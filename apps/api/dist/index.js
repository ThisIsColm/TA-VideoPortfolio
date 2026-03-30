"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const migrate_1 = require("./lib/migrate");
const ogRenderer_1 = require("./lib/ogRenderer");
const db_1 = __importDefault(require("./lib/db"));
const ghost_1 = require("./lib/ghost");
const admin_1 = __importDefault(require("./routes/admin"));
const public_1 = __importDefault(require("./routes/public"));
const ghost_2 = __importDefault(require("./routes/ghost"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3021', 10);
const SITE_URL = (process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, '');
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
app.use('/api/ghost', ghost_2.default);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});
// Serve static files from the web workspace in production
if (process.env.NODE_ENV === 'production') {
    const webDistPath = path_1.default.resolve(__dirname, '../../web/dist');
    const indexHtmlPath = path_1.default.join(webDistPath, 'index.html');
    // Cache index.html in memory on startup
    let indexHtml = '';
    try {
        indexHtml = fs_1.default.readFileSync(indexHtmlPath, 'utf-8');
    }
    catch (e) {
        console.error('API: Failed to read index.html', e);
    }
    const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
    app.use(express_1.default.static(webDistPath));
    // OG-injected routes for /p/:slug and /p/:slug/:postSlug
    app.get('/p/:slug/:postSlug?', async (req, res) => {
        const { slug, postSlug } = req.params;
        try {
            // Look up the collection in SQLite
            const collection = db_1.default.prepare('SELECT * FROM collections WHERE slug = ?').get(slug);
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
                const post = await (0, ghost_1.fetchGhostPost)(postSlug);
                if (post) {
                    title = post.title || title;
                    description = post.description || description;
                    imageUrl = post.thumbnail || DEFAULT_OG_IMAGE;
                    imageAlt = post.title || imageAlt;
                }
            }
            else {
                // Collection page — try to get the hero post image
                const items = db_1.default.prepare('SELECT * FROM collection_items WHERE collection_id = ? ORDER BY sort_order ASC').all(collection.id);
                // Find hero post, or fall back to first post
                let heroSlug = null;
                if (collection.hero_item_id) {
                    const heroItem = items.find((i) => i.id === collection.hero_item_id);
                    if (heroItem)
                        heroSlug = heroItem.ghost_slug;
                }
                if (!heroSlug && items.length > 0) {
                    heroSlug = items[0].ghost_slug;
                }
                if (heroSlug) {
                    const heroPost = await (0, ghost_1.fetchGhostPost)(heroSlug);
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
            const ogTags = (0, ogRenderer_1.renderOgTags)({
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
        }
        catch (err) {
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
exports.default = app;
