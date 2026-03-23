import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import express from 'express';
import cors from 'cors';
import { runMigrations } from './lib/migrate';
import { renderOgTags } from './lib/ogRenderer';
import db from './lib/db';
import { fetchGhostPost } from './lib/ghost';

import adminRoutes from './routes/admin';
import publicRoutes from './routes/public';
import ghostRoutes from './routes/ghost';

const app = express();
const PORT = parseInt(process.env.PORT || '3021', 10);
const SITE_URL = (process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, '');

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
    const indexHtmlPath = path.join(webDistPath, 'index.html');

    // Cache index.html in memory on startup
    let indexHtml = '';
    try {
        indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
    } catch (e) {
        console.error('API: Failed to read index.html', e);
    }

    const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

    app.use(express.static(webDistPath));

    // OG-injected routes for /p/:slug and /p/:slug/:postSlug
    app.get('/p/:slug/:postSlug?', async (req, res) => {
        const { slug, postSlug } = req.params;

        try {
            // Look up the collection in SQLite
            const collection = db.prepare('SELECT * FROM collections WHERE slug = ?').get(slug) as any;

            if (!collection) {
                // Collection not found — serve the SPA and let client handle 404
                res.send(indexHtml);
                return;
            }

            let title = collection.title || 'Tiny Ark';
            let description = collection.intro || '';
            let imageUrl = DEFAULT_OG_IMAGE;
            let imageAlt = title;
            let pageUrl = `${SITE_URL}/p/${slug}`;

            if (postSlug) {
                // Individual post page — fetch the specific post from Ghost
                pageUrl = `${SITE_URL}/p/${slug}/${postSlug}`;
                const post = await fetchGhostPost(postSlug);
                if (post) {
                    title = post.title || title;
                    description = post.description || description;
                    imageUrl = post.thumbnail || DEFAULT_OG_IMAGE;
                    imageAlt = post.title || imageAlt;
                }
            } else {
                // Collection page — try to get the hero post image
                const items = db.prepare(
                    'SELECT * FROM collection_items WHERE collection_id = ? ORDER BY sort_order ASC'
                ).all(collection.id) as any[];

                // Find hero post, or fall back to first post
                let heroSlug: string | null = null;
                if (collection.hero_item_id) {
                    const heroItem = items.find((i: any) => i.id === collection.hero_item_id);
                    if (heroItem) heroSlug = heroItem.ghost_slug;
                }
                if (!heroSlug && items.length > 0) {
                    heroSlug = items[0].ghost_slug;
                }

                if (heroSlug) {
                    const heroPost = await fetchGhostPost(heroSlug);
                    if (heroPost) {
                        imageUrl = heroPost.thumbnail || DEFAULT_OG_IMAGE;
                        imageAlt = heroPost.title || imageAlt;
                        // If collection has no intro, use hero post description
                        if (!description) {
                            description = heroPost.description || '';
                        }
                    }
                }
            }

            // Build fallback description if still empty
            if (!description) {
                description = `${title} — a video portfolio by Tiny Ark`;
            }

            const ogTags = renderOgTags({
                title,
                description,
                imageUrl,
                imageAlt,
                pageUrl,
                type: 'article',
            });

            // Inject OG tags and dynamic title into <head>
            const modifiedHtml = indexHtml
                .replace('<title>Tiny Ark Portfolios</title>', `<title>${title} — Tiny Ark</title>\n  ${ogTags}`);

            res.send(modifiedHtml);
        } catch (err) {
            console.error('OG injection error:', err);
            // Fallback: serve the original HTML
            res.send(indexHtml);
        }
    });

    // Catch-all route for SPA: serve index.html for any non-API routes
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api/')) {
            res.send(indexHtml);
        }
    });
}

app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});

export default app;
