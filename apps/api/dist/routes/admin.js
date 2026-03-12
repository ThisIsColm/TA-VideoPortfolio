"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../lib/db"));
const crypto_1 = __importDefault(require("crypto"));
const ghost_1 = require("../lib/ghost");
const router = (0, express_1.Router)();
// GET /api/admin/collections
router.get('/collections', async (req, res) => {
    try {
        const collections = db_1.default.prepare('SELECT * FROM collections ORDER BY created_at DESC').all();
        const allSlugs = new Set();
        const collectionSlugMap = {};
        for (const c of collections) {
            const items = db_1.default.prepare('SELECT ghost_slug FROM collection_items WHERE collection_id = ? ORDER BY sort_order ASC LIMIT 4')
                .all(c.id);
            const slugs = items.map(i => i.ghost_slug);
            collectionSlugMap[c.id] = slugs;
            slugs.forEach(s => allSlugs.add(s));
            // Also get total count
            const countRow = db_1.default.prepare('SELECT count(*) as count FROM collection_items WHERE collection_id = ?')
                .get(c.id);
            c.itemCount = countRow.count;
        }
        // Fetch all thumbnails in one go
        let thumbnailMap = {};
        if (allSlugs.size > 0) {
            const { posts } = await (0, ghost_1.fetchGhostPosts)(1, 200, '', '', Array.from(allSlugs));
            posts.forEach(p => {
                if (p.thumbnail)
                    thumbnailMap[p.slug] = p.thumbnail;
            });
        }
        // Map thumbnails and firstPostSlug back to collections
        for (const c of collections) {
            const slugs = collectionSlugMap[c.id];
            c.thumbnails = slugs
                .map(slug => thumbnailMap[slug])
                .filter(Boolean);
            c.firstPostSlug = slugs.length > 0 ? slugs[0] : null;
        }
        res.json({ collections });
    }
    catch (err) {
        console.error('List collections error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/admin/collections
router.post('/collections', (req, res) => {
    try {
        const { title, slug, intro } = req.body;
        if (!title || !slug) {
            res.status(400).json({ error: 'Title and slug are required' });
            return;
        }
        // Check uniqueness
        const existing = db_1.default.prepare('SELECT id FROM collections WHERE slug = ?').get(slug);
        if (existing) {
            res.status(409).json({ error: 'A collection with this slug already exists' });
            return;
        }
        const id = crypto_1.default.randomUUID();
        db_1.default.prepare('INSERT INTO collections (id, title, slug, intro) VALUES (?, ?, ?, ?)')
            .run(id, title, slug, intro || '');
        const collection = db_1.default.prepare('SELECT * FROM collections WHERE id = ?').get(id);
        res.status(201).json({ collection });
    }
    catch (err) {
        console.error('Create collection error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /api/admin/collections/:id
router.patch('/collections/:id', (req, res) => {
    try {
        const { title, slug, intro, heroItemId } = req.body;
        const id = req.params.id;
        const existing = db_1.default.prepare('SELECT id FROM collections WHERE id = ?').get(id);
        if (!existing) {
            res.status(404).json({ error: 'Collection not found' });
            return;
        }
        const updates = [];
        const values = [];
        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
        }
        if (slug !== undefined) {
            updates.push('slug = ?');
            values.push(slug);
        }
        if (intro !== undefined) {
            updates.push('intro = ?');
            values.push(intro);
        }
        if (heroItemId !== undefined) {
            updates.push('hero_item_id = ?');
            values.push(heroItemId);
        }
        if (updates.length > 0) {
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);
            db_1.default.prepare(`UPDATE collections SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        }
        const collection = db_1.default.prepare('SELECT * FROM collections WHERE id = ?').get(id);
        res.json({ collection });
    }
    catch (err) {
        // SQLite unique constraint violation
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            res.status(409).json({ error: 'Slug must be unique' });
            return;
        }
        console.error('Update collection error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/admin/collections/:id
router.get('/collections/:id', (req, res) => {
    try {
        const id = req.params.id;
        const collection = db_1.default.prepare('SELECT * FROM collections WHERE id = ?').get(id);
        if (!collection) {
            res.status(404).json({ error: 'Collection not found' });
            return;
        }
        const itemsQuery = db_1.default.prepare('SELECT * FROM collection_items WHERE collection_id = ? ORDER BY sort_order ASC')
            .all(id);
        const items = itemsQuery.map(i => ({
            id: i.id,
            ghostPostId: i.ghost_post_id,
            ghostSlug: i.ghost_slug,
            sortOrder: i.sort_order,
            createdAt: i.created_at,
        }));
        res.json({
            collection: {
                ...collection,
                items
            }
        });
    }
    catch (err) {
        console.error('Get collection error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/admin/collections/:id
router.delete('/collections/:id', (req, res) => {
    try {
        const id = req.params.id;
        const result = db_1.default.prepare('DELETE FROM collections WHERE id = ?').run(id);
        if (result.changes === 0) {
            res.status(404).json({ error: 'Collection not found' });
            return;
        }
        res.json({ ok: true });
    }
    catch (err) {
        console.error('Delete collection error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/admin/collections/:id/items
router.post('/collections/:id/items', (req, res) => {
    try {
        const collectionId = req.params.id;
        const { ghostPostId, ghostSlug } = req.body;
        if (!ghostPostId || !ghostSlug) {
            res.status(400).json({ error: 'ghostPostId and ghostSlug are required' });
            return;
        }
        // Verify collection
        const existing = db_1.default.prepare('SELECT id FROM collections WHERE id = ?').get(collectionId);
        if (!existing) {
            res.status(404).json({ error: 'Collection not found' });
            return;
        }
        // Check if item already exists
        const itemExists = db_1.default.prepare('SELECT id FROM collection_items WHERE collection_id = ? AND ghost_post_id = ?')
            .get(collectionId, ghostPostId);
        if (itemExists) {
            res.status(409).json({ error: 'This post is already in the collection' });
            return;
        }
        // Get max sort_order
        const maxSortRow = db_1.default.prepare('SELECT MAX(sort_order) as maxSort FROM collection_items WHERE collection_id = ?')
            .get(collectionId);
        const nextSortOrder = (maxSortRow.maxSort ?? -1) + 1;
        const itemId = crypto_1.default.randomUUID();
        db_1.default.prepare(`
            INSERT INTO collection_items (id, collection_id, ghost_post_id, ghost_slug, sort_order)
            VALUES (?, ?, ?, ?, ?)
        `).run(itemId, collectionId, ghostPostId, ghostSlug, nextSortOrder);
        const item = db_1.default.prepare('SELECT * FROM collection_items WHERE id = ?').get(itemId);
        res.status(201).json({ item });
    }
    catch (err) {
        console.error('Add item error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /api/admin/collections/:id/items/reorder
router.patch('/collections/:id/items/reorder', (req, res) => {
    try {
        const collectionId = req.params.id;
        const { itemIds } = req.body;
        if (!Array.isArray(itemIds)) {
            res.status(400).json({ error: 'itemIds array is required' });
            return;
        }
        const runTransaction = db_1.default.transaction((ids) => {
            const stmt = db_1.default.prepare('UPDATE collection_items SET sort_order = ? WHERE id = ? AND collection_id = ?');
            for (let i = 0; i < ids.length; i++) {
                stmt.run(i, ids[i], collectionId);
            }
        });
        runTransaction(itemIds);
        res.json({ ok: true });
    }
    catch (err) {
        console.error('Reorder items error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
