import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import express from 'express';
import cors from 'cors';
import { runMigrations } from './lib/migrate';

import adminRoutes from './routes/admin';
import publicRoutes from './routes/public';
import ghostRoutes from './routes/ghost';

const app = express();
const PORT = parseInt(process.env.PORT || '3021', 10);

console.log('API: Starting boot process...');

// Run migrations synchronously before accepting requests
try {
    runMigrations();
} catch (e) {
    console.error('API: Database migration failed. Halting boot.', e);
    process.exit(1);
}

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));

// Routes
app.use('/api/dashboard', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/ghost', ghostRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});

// Serve static files from the web workspace in production
if (process.env.NODE_ENV === 'production') {
    const webDistPath = path.resolve(__dirname, '../../web/dist');
    app.use(express.static(webDistPath));

    // Catch-all route for SPA: serve index.html for any non-API routes
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api/')) {
            res.sendFile(path.join(webDistPath, 'index.html'));
        }
    });
}

app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});

export default app;
