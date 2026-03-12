"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const migrate_1 = require("./lib/migrate");
const admin_1 = __importDefault(require("./routes/admin"));
const public_1 = __importDefault(require("./routes/public"));
const ghost_1 = __importDefault(require("./routes/ghost"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3021', 10);
console.log('API: Starting boot process...');
// Run migrations synchronously before accepting requests
try {
    (0, migrate_1.runMigrations)();
}
catch (e) {
    console.error('API: Database migration failed. Halting boot.', e);
    process.exit(1);
}
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
// Routes
app.use('/api/dashboard', admin_1.default);
app.use('/api/public', public_1.default);
app.use('/api/ghost', ghost_1.default);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});
// Serve static files from the web workspace in production
if (process.env.NODE_ENV === 'production') {
    const webDistPath = path_1.default.resolve(__dirname, '../../web/dist');
    app.use(express_1.default.static(webDistPath));
    // Catch-all route for SPA: serve index.html for any non-API routes
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api/')) {
            res.sendFile(path_1.default.join(webDistPath, 'index.html'));
        }
    });
}
app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});
exports.default = app;
