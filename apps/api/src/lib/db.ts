import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';

// Connect to SQLite DB inside the API root directory
const dbPath = path.resolve(process.env.DATABASE_URL?.replace('file:', '') || 'database.sqlite3');

const db: DatabaseType = new Database(dbPath, {
    // verbose: console.log, // Enable for debugging queries
});

// Use WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');

export default db;
