"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../lib/db"));
const ghost_1 = require("../lib/ghost");
const router = (0, express_1.Router)();
// GET /api/public/collections/:slug
router.get('/collections/:slug', async (req, res) => {
    try {
        const slug = req.params.slug;
        const collection = db_1.default.prepare('SELECT * FROM collections WHERE slug = ?').get(slug);
        if (!collection) {
            res.status(404).json({ error: 'Collection not found' });
            return;
        }
        const items = db_1.default.prepare('SELECT * FROM collection_items WHERE collection_id = ? ORDER BY sort_order ASC')
            .all(collection.id);
        // Fetch Ghost posts for each item
        const posts = [];
        let heroPostId = null;
        for (const item of items) {
            if (item.id === collection.hero_item_id) {
                heroPostId = item.ghost_post_id;
            }
            try {
                const post = await (0, ghost_1.fetchGhostPost)(item.ghost_slug);
                if (post) {
                    posts.push(post);
                }
            }
            catch (err) {
                console.error(`Failed to fetch Ghost post ${item.ghost_slug}:`, err);
            }
        }
        res.json({
            collection: {
                id: collection.id,
                title: collection.title,
                slug: collection.slug,
                intro: collection.intro,
                posts,
                heroPostId,
            },
        });
    }
    catch (err) {
        console.error('Public collection error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/public/collections/:slug/posts/:postSlug
router.get('/collections/:slug/posts/:postSlug', async (req, res) => {
    try {
        const { slug, postSlug } = req.params;
        const collection = db_1.default.prepare('SELECT id FROM collections WHERE slug = ?').get(slug);
        if (!collection) {
            res.status(404).json({ error: 'Collection not found' });
            return;
        }
        // Verify post is in collection
        const item = db_1.default.prepare('SELECT id FROM collection_items WHERE collection_id = ? AND ghost_slug = ?')
            .get(collection.id, postSlug);
        if (!item) {
            res.status(404).json({ error: 'Post not found in this collection' });
            return;
        }
        const post = await (0, ghost_1.fetchGhostPost)(postSlug);
        if (!post) {
            res.status(404).json({ error: 'Post not found in Ghost' });
            return;
        }
        res.json({ post });
    }
    catch (err) {
        console.error('Public post error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
