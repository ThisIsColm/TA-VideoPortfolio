import { Router, Request, Response } from 'express';
import { fetchGhostPosts, fetchGhostPost, fetchGhostTags } from '../lib/ghost';

const router = Router();

// GET /api/ghost/tags
router.get('/tags', async (req: Request, res: Response) => {
    try {
        const tags = await fetchGhostTags();
        res.json({ tags });
    } catch (err: any) {
        console.error('Ghost tags error:', err);
        res.status(502).json({ error: 'Failed to fetch tags from Ghost', message: err.message });
    }
});

// GET /api/ghost/posts
router.get('/posts', async (req: Request, res: Response) => {
    try {
        const search = req.query.search as string || '';
        const tag = req.query.tag as string || '';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        const result = await fetchGhostPosts(page, limit, search, tag);
        res.json(result);
    } catch (err: any) {
        console.error('Ghost posts error:', err);
        res.status(502).json({ error: 'Failed to fetch posts from Ghost', message: err.message });
    }
});

// GET /api/ghost/posts/:slug
router.get('/posts/:slug', async (req: Request, res: Response) => {
    try {
        const post = await fetchGhostPost(req.params.slug);
        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }
        res.json({ post });
    } catch (err: any) {
        console.error('Ghost post error:', err);
        res.status(502).json({ error: 'Failed to fetch post from Ghost', message: err.message });
    }
});

export default router;
