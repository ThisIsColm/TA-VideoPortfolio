import { Router, Request, Response } from 'express';
import db from '../lib/db';
import crypto from 'crypto';
import { fetchGhostPosts } from '../lib/ghost';

const router = Router();

// GET /api/admin/collections
router.get('/collections', async (req: Request, res: Response) => {
    try {
        const collections = db.prepare('SELECT * FROM collections ORDER BY created_at DESC').all() as any[];
        const allSlugs = new Set<string>();
        const collectionSlugMap: Record<string, string[]> = {};

        for (const c of collections) {
            const items = db.prepare('SELECT ghost_slug FROM collection_items WHERE collection_id = ? ORDER BY sort_order ASC LIMIT 4')
                .all(c.id) as { ghost_slug: string }[];

            const slugs = items.map(i => i.ghost_slug);
            collectionSlugMap[c.id] = slugs;
            slugs.forEach(s => allSlugs.add(s));

            // Also get total count
            const countRow = db.prepare('SELECT count(*) as count FROM collection_items WHERE collection_id = ?')
                .get(c.id) as { count: number };
            c.itemCount = countRow.count;
        }

        // Fetch all thumbnails in one go
        let thumbnailMap: Record<string, string> = {};
        if (allSlugs.size > 0) {
            const { posts } = await fetchGhostPosts(1, 200, '', '', Array.from(allSlugs));
            posts.forEach(p => {
                if (p.thumbnail) thumbnailMap[p.slug] = p.thumbnail;
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
    } catch (err) {
        console.error('List collections error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/collections
router.post('/collections', (req: Request, res: Response) => {
    try {
        const { title, slug, intro } = req.body;

        if (!title || !slug) {
            res.status(400).json({ error: 'Title and slug are required' });
            return;
        }

        // Check uniqueness
        const existing = db.prepare('SELECT id FROM collections WHERE slug = ?').get(slug);
        if (existing) {
            res.status(409).json({ error: 'A collection with this slug already exists' });
            return;
        }

        const id = crypto.randomUUID();
        db.prepare('INSERT INTO collections (id, title, slug, intro) VALUES (?, ?, ?, ?)')
            .run(id, title, slug, intro || '');

        const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(id);
        res.status(201).json({ collection });
    } catch (err) {
        console.error('Create collection error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/admin/collections/:id
router.patch('/collections/:id', (req: Request, res: Response) => {
    try {
        const { title, slug, intro, heroItemId } = req.body;
        const id = req.params.id;

        const existing = db.prepare('SELECT id FROM collections WHERE id = ?').get(id);
        if (!existing) {
            res.status(404).json({ error: 'Collection not found' });
            return;
        }

        const updates: string[] = [];
        const values: any[] = [];

        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (slug !== undefined) { updates.push('slug = ?'); values.push(slug); }
        if (intro !== undefined) { updates.push('intro = ?'); values.push(intro); }
        if (heroItemId !== undefined) { updates.push('hero_item_id = ?'); values.push(heroItemId); }

        if (updates.length > 0) {
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);
            db.prepare(`UPDATE collections SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        }

        const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(id);
        res.json({ collection });
    } catch (err: any) {
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
router.get('/collections/:id', (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(id) as any;

        if (!collection) {
            res.status(404).json({ error: 'Collection not found' });
            return;
        }

        const itemsQuery = db.prepare('SELECT * FROM collection_items WHERE collection_id = ? ORDER BY sort_order ASC')
            .all(id) as any[];

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
    } catch (err) {
        console.error('Get collection error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/admin/collections/:id
router.delete('/collections/:id', (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const result = db.prepare('DELETE FROM collections WHERE id = ?').run(id);

        if (result.changes === 0) {
            res.status(404).json({ error: 'Collection not found' });
            return;
        }

        res.json({ ok: true });
    } catch (err) {
        console.error('Delete collection error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/collections/:id/items
router.post('/collections/:id/items', (req: Request, res: Response) => {
    try {
        const collectionId = req.params.id;
        const { ghostPostId, ghostSlug } = req.body;

        if (!ghostPostId || !ghostSlug) {
            res.status(400).json({ error: 'ghostPostId and ghostSlug are required' });
            return;
        }

        // Verify collection
        const existing = db.prepare('SELECT id FROM collections WHERE id = ?').get(collectionId);
        if (!existing) {
            res.status(404).json({ error: 'Collection not found' });
            return;
        }

        // Check if item already exists
        const itemExists = db.prepare('SELECT id FROM collection_items WHERE collection_id = ? AND ghost_post_id = ?')
            .get(collectionId, ghostPostId);

        if (itemExists) {
            res.status(409).json({ error: 'This post is already in the collection' });
            return;
        }

        // Get max sort_order
        const maxSortRow = db.prepare('SELECT MAX(sort_order) as maxSort FROM collection_items WHERE collection_id = ?')
            .get(collectionId) as { maxSort: number | null };
        const nextSortOrder = (maxSortRow.maxSort ?? -1) + 1;

        const itemId = crypto.randomUUID();
        db.prepare(`
            INSERT INTO collection_items (id, collection_id, ghost_post_id, ghost_slug, sort_order)
            VALUES (?, ?, ?, ?, ?)
        `).run(itemId, collectionId, ghostPostId, ghostSlug, nextSortOrder);

        const item = db.prepare('SELECT * FROM collection_items WHERE id = ?').get(itemId);
        res.status(201).json({ item });
    } catch (err) {
        console.error('Add item error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/admin/collections/:id/items/reorder
router.patch('/collections/:id/items/reorder', (req: Request, res: Response) => {
    try {
        const collectionId = req.params.id;
        const { itemIds } = req.body;

        if (!Array.isArray(itemIds)) {
            res.status(400).json({ error: 'itemIds array is required' });
            return;
        }

        const runTransaction = db.transaction((ids: string[]) => {
            const stmt = db.prepare('UPDATE collection_items SET sort_order = ? WHERE id = ? AND collection_id = ?');
            for (let i = 0; i < ids.length; i++) {
                stmt.run(i, ids[i], collectionId);
            }
        });

        runTransaction(itemIds);
        res.json({ ok: true });
    } catch (err) {
        console.error('Reorder items error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
