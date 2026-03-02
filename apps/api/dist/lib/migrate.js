"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./db"));
// On built output, we might be in dist/lib, so migrations are in ../migrations or src/migrations
// We'll calculate the project root first
const apiRoot = path_1.default.resolve(__dirname, '..', '..');
const migrationsDirSrc = path_1.default.join(apiRoot, 'src', 'migrations');
// If we are running compiled code, we might need to look for migrations in the source folder
// since .sql files don't compile to dist.
const migrationsDir = fs_1.default.existsSync(migrationsDirSrc) ? migrationsDirSrc : path_1.default.join(__dirname, '..', 'migrations');
function runMigrations() {
    console.log('API: Running migrations...');
    // Create migrations table if it doesn't exist
    db_1.default.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    // Get applied migrations
    const appliedRows = db_1.default.prepare('SELECT name FROM _migrations').all();
    const applied = new Set(appliedRows.map(r => r.name));
    if (!fs_1.default.existsSync(migrationsDir)) {
        console.warn(`API: Migrations directory not found at ${migrationsDir}`);
        return;
    }
    const files = fs_1.default.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort(); // sort alphabetically to ensure correct order
    let count = 0;
    for (const file of files) {
        if (!applied.has(file)) {
            const sql = fs_1.default.readFileSync(path_1.default.join(migrationsDir, file), 'utf8');
            // Run inside a transaction
            const run = db_1.default.transaction(() => {
                db_1.default.exec(sql);
                db_1.default.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
            });
            run();
            console.log(`API: Applied migration ${file}`);
            count++;
        }
    }
    console.log(`API: Database up to date. Applied ${count} new migrations.`);
}
