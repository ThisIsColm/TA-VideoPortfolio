import fs from 'fs';
import path from 'path';
import db from './db';

// On built output, we might be in dist/lib, so migrations are in ../migrations or src/migrations
// We'll calculate the project root first
const apiRoot = path.resolve(__dirname, '..', '..');
const migrationsDirSrc = path.join(apiRoot, 'src', 'migrations');
// If we are running compiled code, we might need to look for migrations in the source folder
// since .sql files don't compile to dist.
const migrationsDir = fs.existsSync(migrationsDirSrc) ? migrationsDirSrc : path.join(__dirname, '..', 'migrations');

export function runMigrations() {
    console.log('API: Running migrations...');

    // Create migrations table if it doesn't exist
    db.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Get applied migrations
    const appliedRows = db.prepare('SELECT name FROM _migrations').all() as { name: string }[];
    const applied = new Set(appliedRows.map(r => r.name));

    if (!fs.existsSync(migrationsDir)) {
        console.warn(`API: Migrations directory not found at ${migrationsDir}`);
        return;
    }

    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort(); // sort alphabetically to ensure correct order

    let count = 0;
    for (const file of files) {
        if (!applied.has(file)) {
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

            // Run inside a transaction
            const run = db.transaction(() => {
                db.exec(sql);
                db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
            });

            run();
            console.log(`API: Applied migration ${file}`);
            count++;
        }
    }

    console.log(`API: Database up to date. Applied ${count} new migrations.`);
}
