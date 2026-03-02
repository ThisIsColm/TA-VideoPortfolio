"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
// Connect to SQLite DB inside the API root directory
const dbPath = path_1.default.resolve(process.env.DATABASE_URL?.replace('file:', '') || 'database.sqlite3');
const db = new better_sqlite3_1.default(dbPath, {
// verbose: console.log, // Enable for debugging queries
});
// Use WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');
exports.default = db;
