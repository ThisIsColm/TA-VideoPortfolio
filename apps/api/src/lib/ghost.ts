// ghost.ts
import sanitizeHtml from 'sanitize-html';

export interface GhostPostRaw {
    id: string;
    title: string;
    slug: string;
    feature_image: string | null;
    custom_excerpt: string | null;
    excerpt: string | null;
    plaintext: string | null;
    html: string | null;
    published_at: string;
    tags: Array<{ name: string; slug: string }>;
}

export interface VimeoVideo {
    id: string;
    width?: number;
    height?: number;
}

export interface GhostPostTransformed {
    id: string;
    title: string;
    slug: string;
    thumbnail: string;
    vimeoId: string | null;
    vimeoIds: string[]; // Support for multiple videos
    vimeoVideos: VimeoVideo[]; // Metadata for all videos
    tags: string[];
    year: string;
    client: string | null;
    category: string | null;
    description: string;
    html: string;
    stills: string[];
    vimeoWidth?: number;
    vimeoHeight?: number;
}

function ghostUrl(path: string, params: Record<string, string> = {}): string {
    const apiUrl = process.env.GHOST_API_URL || '';
    const contentKey = process.env.GHOST_CONTENT_KEY || '';
    if (!apiUrl) throw new Error('GHOST_API_URL is missing');
    const base = apiUrl.replace(/\/$/, '');
    const url = new URL(`${base}/ghost/api/content/${path}`);
    url.searchParams.set('key', contentKey);
    for (const [k, v] of Object.entries(params)) {
        if (v) url.searchParams.set(k, v);
    }
    return url.toString();
}

export function extractVimeoIds(html: string | null): string[] {
    if (!html) return [];

    const ids = new Set<string>();

    // Match iframe src: https://player.vimeo.com/video/123456789
    const iframeMatches = html.matchAll(/src=["']https?:\/\/player\.vimeo\.com\/video\/(\d+)[^"']*["']/gi);
    for (const match of iframeMatches) {
        ids.add(match[1]);
    }

    // Match raw links: https://vimeo.com/123456789
    const urlMatches = html.matchAll(/https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/gi);
    for (const match of urlMatches) {
        ids.add(match[1]);
    }

    return Array.from(ids);
}

// Kept for backward compatibility or simple cases
export function extractVimeoId(html: string | null): string | null {
    const ids = extractVimeoIds(html);
    return ids.length > 0 ? ids[0] : null;
}

export function extractImages(html: string | null): string[] {
    if (!html) return [];
    const matches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
    return matches.map(m => m[1]).filter(url => !url.includes('favicon'));
}

export function sanitizeGhostHtml(html: string): string {
    return sanitizeHtml(html, {
        allowedTags: [
            ...sanitizeHtml.defaults.allowedTags,
            'img', 'figure', 'figcaption', 'iframe',
            'video', 'source', 'picture',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        ],
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
            iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title'],
            a: ['href', 'target', 'rel', 'title'],
            figure: ['class'],
            figcaption: ['class'],
            div: ['class'],
        },
        allowedIframeHostnames: ['player.vimeo.com'],
        allowedSchemes: ['http', 'https', 'mailto'],
    });
}

const vimeoCache = new Map<string, { width: number, height: number }>();

async function fetchVimeoMetadata(vimeoId: string): Promise<{ width?: number, height?: number }> {
    if (vimeoCache.has(vimeoId)) return vimeoCache.get(vimeoId)!;
    try {
        console.log(`Fetching Vimeo oEmbed for: ${vimeoId}`);
        const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}`);
        if (res.ok) {
            const data = await res.json() as any;
            const meta = { width: data.width, height: data.height };
            vimeoCache.set(vimeoId, meta);
            return meta;
        }
    } catch (err) {
        console.error(`Failed to fetch Vimeo metadata for ${vimeoId}:`, err);
    }
    return {};
}

export async function transformPost(post: GhostPostRaw): Promise<GhostPostTransformed> {
    const vimeoIds = extractVimeoIds(post.html);
    const vimeoId = vimeoIds.length > 0 ? vimeoIds[0] : null;
    const stills = extractImages(post.html);
    const year = post.published_at ? new Date(post.published_at).getFullYear().toString() : '';
    const tags = (post.tags || []).map(t => t.name);

    let description = post.custom_excerpt || post.excerpt || post.plaintext || '';

    // Fetch metadata for all videos in parallel
    const vimeoVideos: VimeoVideo[] = await Promise.all(
        vimeoIds.map(async (id) => {
            const meta = await fetchVimeoMetadata(id);
            return { id, ...meta };
        })
    );

    let vimeoWidth: number | undefined;
    let vimeoHeight: number | undefined;

    if (vimeoId) {
        const heroVideo = vimeoVideos.find(v => v.id === vimeoId);
        vimeoWidth = heroVideo?.width;
        vimeoHeight = heroVideo?.height;
    }

    return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        thumbnail: post.feature_image || '',
        vimeoId,
        vimeoIds,
        vimeoVideos,
        tags,
        year,
        client: null,
        category: tags[0] || null,
        description,
        html: post.html ? sanitizeGhostHtml(post.html) : '',
        stills,
        vimeoWidth,
        vimeoHeight,
    };
}

export async function fetchGhostPosts(page = 1, limit = 50, search = '', tag = '', slugs: string[] = []): Promise<{
    posts: GhostPostTransformed[];
    meta: { page: number; pages: number; total: number };
}> {
    if (!process.env.GHOST_API_URL || !process.env.GHOST_CONTENT_KEY) {
        return { posts: [], meta: { page: 1, pages: 0, total: 0 } };
    }

    // Always fetch ALL posts lightweightly to implement reliable server-side full-text search and filtering manually.
    const url = ghostUrl('posts/', {
        include: 'tags',
        limit: 'all',
        fields: 'id,title,slug,feature_image,custom_excerpt,excerpt,plaintext,html,published_at',
    });

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Ghost API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    let postsRaw = data.posts as GhostPostRaw[];

    if (tag) {
        const tLower = tag.toLowerCase();
        postsRaw = postsRaw.filter(p => (p.tags || []).some(t => t.name.toLowerCase() === tLower));
    }

    if (slugs.length > 0) {
        postsRaw = postsRaw.filter(p => slugs.includes(p.slug));
    }

    if (search) {
        const s = search.toLowerCase();
        postsRaw = postsRaw.filter(p =>
            p.title.toLowerCase().includes(s) ||
            (p.custom_excerpt || '').toLowerCase().includes(s) ||
            (p.tags || []).some(t => t.name.toLowerCase().includes(s))
        );
    }

    const total = postsRaw.length;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    
    // Only fetch Vimeo metadata for the current page
    const paginatedRaw = postsRaw.slice(start, end);
    const posts = await Promise.all(paginatedRaw.map(transformPost));

    return { posts, meta: { page, pages, total } };
}

export async function fetchGhostTags(): Promise<string[]> {
    if (!process.env.GHOST_API_URL || !process.env.GHOST_CONTENT_KEY) {
        return [];
    }
    const url = ghostUrl('tags/', { limit: 'all' });
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.tags || []).map((t: any) => t.name);
}

export async function fetchGhostPost(slug: string): Promise<GhostPostTransformed | null> {
    if (!process.env.GHOST_API_URL || !process.env.GHOST_CONTENT_KEY) {
        return null;
    }

    const url = ghostUrl(`posts/slug/${slug}/`, {
        include: 'tags',
        fields: 'id,title,slug,feature_image,custom_excerpt,excerpt,plaintext,html,published_at',
    });

    const res = await fetch(url);
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Ghost API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.posts || data.posts.length === 0) return null;

    return await transformPost(data.posts[0]);
}
