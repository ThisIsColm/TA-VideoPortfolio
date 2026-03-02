"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ghost_1 = require("../lib/ghost");
const router = (0, express_1.Router)();
// GET /api/ghost/posts
router.get('/posts', async (req, res) => {
    try {
        const search = req.query.search || '';
        const tag = req.query.tag || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const result = await (0, ghost_1.fetchGhostPosts)(page, limit, search, tag);
        res.json(result);
    }
    catch (err) {
        console.error('Ghost posts error:', err);
        res.status(502).json({ error: 'Failed to fetch posts from Ghost', message: err.message });
    }
});
// GET /api/ghost/posts/:slug
router.get('/posts/:slug', async (req, res) => {
    try {
        const post = await (0, ghost_1.fetchGhostPost)(req.params.slug);
        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }
        res.json({ post });
    }
    catch (err) {
        console.error('Ghost post error:', err);
        res.status(502).json({ error: 'Failed to fetch post from Ghost', message: err.message });
    }
});
exports.default = router;
