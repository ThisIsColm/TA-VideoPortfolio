import { Router, Request, Response } from 'express';
import db from '../lib/db';
import { fetchGhostPost, type GhostPostTransformed } from '../lib/ghost';

const router = Router();

// GET /api/public/collections/:slug
router.get('/collections/:slug', async (req: Request, res: Response) => {
    try {
        const slug = req.params.slug;
        const collection = db.prepare('SELECT * FROM collections WHERE slug = ?').get(slug) as any;

        if (!collection) {
            res.status(404).json({ error: 'Collection not found' });
            return;
        }

        const items = db.prepare('SELECT * FROM collection_items WHERE collection_id = ? ORDER BY sort_order ASC')
            .all(collection.id) as any[];

        // Fetch Ghost posts for each item
        const posts: GhostPostTransformed[] = [];
        let heroPostId: string | null = null;

        for (const item of items) {
            if (item.id === collection.hero_item_id) {
                heroPostId = item.ghost_post_id;
            }
            try {
                const post = await fetchGhostPost(item.ghost_slug);
                if (post) {
                    posts.push(post);
                }
            } catch (err) {
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
    } catch (err) {
        console.error('Public collection error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/public/collections/:slug/posts/:postSlug
router.get('/collections/:slug/posts/:postSlug', async (req: Request, res: Response) => {
    try {
        const { slug, postSlug } = req.params;

        const collection = db.prepare('SELECT id FROM collections WHERE slug = ?').get(slug) as any;
        if (!collection) {
            res.status(404).json({ error: 'Collection not found' });
            return;
        }

        // Verify post is in collection
        const item = db.prepare('SELECT id FROM collection_items WHERE collection_id = ? AND ghost_slug = ?')
            .get(collection.id, postSlug);

        if (!item) {
            res.status(404).json({ error: 'Post not found in this collection' });
            return;
        }

        const post = await fetchGhostPost(postSlug);
        if (!post) {
            res.status(404).json({ error: 'Post not found in Ghost' });
            return;
        }

        res.json({ post });
    } catch (err) {
        console.error('Public post error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
