"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractVimeoIds = extractVimeoIds;
exports.extractVimeoId = extractVimeoId;
exports.extractImages = extractImages;
exports.sanitizeGhostHtml = sanitizeGhostHtml;
exports.transformPost = transformPost;
exports.fetchGhostPosts = fetchGhostPosts;
exports.fetchGhostTags = fetchGhostTags;
exports.fetchGhostPost = fetchGhostPost;
// ghost.ts
const sanitize_html_1 = __importDefault(require("sanitize-html"));
function ghostUrl(path, params = {}) {
    const apiUrl = process.env.GHOST_API_URL || '';
    const contentKey = process.env.GHOST_CONTENT_KEY || '';
    if (!apiUrl)
        throw new Error('GHOST_API_URL is missing');
    const base = apiUrl.replace(/\/$/, '');
    const url = new URL(`${base}/ghost/api/content/${path}`);
    url.searchParams.set('key', contentKey);
    for (const [k, v] of Object.entries(params)) {
        if (v)
            url.searchParams.set(k, v);
    }
    return url.toString();
}
function extractVimeoIds(html) {
    if (!html)
        return [];
    const ids = new Set();
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
function extractVimeoId(html) {
    const ids = extractVimeoIds(html);
    return ids.length > 0 ? ids[0] : null;
}
function extractImages(html) {
    if (!html)
        return [];
    const matches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
    return matches.map(m => m[1]).filter(url => !url.includes('favicon'));
}
function sanitizeGhostHtml(html) {
    return (0, sanitize_html_1.default)(html, {
        allowedTags: [
            ...sanitize_html_1.default.defaults.allowedTags,
            'img', 'figure', 'figcaption', 'iframe',
            'video', 'source', 'picture',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        ],
        allowedAttributes: {
            ...sanitize_html_1.default.defaults.allowedAttributes,
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
const vimeoCache = new Map();
async function fetchVimeoMetadata(vimeoId) {
    if (vimeoCache.has(vimeoId))
        return vimeoCache.get(vimeoId);
    try {
        console.log(`Fetching Vimeo oEmbed for: ${vimeoId}`);
        const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}`);
        if (res.ok) {
            const data = await res.json();
            const meta = { width: data.width, height: data.height };
            vimeoCache.set(vimeoId, meta);
            return meta;
        }
    }
    catch (err) {
        console.error(`Failed to fetch Vimeo metadata for ${vimeoId}:`, err);
    }
    return {};
}
async function transformPost(post) {
    const vimeoIds = extractVimeoIds(post.html);
    const vimeoId = vimeoIds.length > 0 ? vimeoIds[0] : null;
    const stills = extractImages(post.html);
    const year = post.published_at ? new Date(post.published_at).getFullYear().toString() : '';
    const tags = (post.tags || []).map(t => t.name);
    let description = post.custom_excerpt || post.excerpt || post.plaintext || '';
    // Fetch metadata for all videos in parallel
    const vimeoVideos = await Promise.all(vimeoIds.map(async (id) => {
        const meta = await fetchVimeoMetadata(id);
        return { id, ...meta };
    }));
    let vimeoWidth;
    let vimeoHeight;
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
async function fetchGhostPosts(page = 1, limit = 50, search = '', tag = '', slugs = []) {
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
    let postsRaw = data.posts;
    if (tag) {
        const tLower = tag.toLowerCase();
        postsRaw = postsRaw.filter(p => (p.tags || []).some(t => t.name.toLowerCase() === tLower));
    }
    if (slugs.length > 0) {
        postsRaw = postsRaw.filter(p => slugs.includes(p.slug));
    }
    if (search) {
        const s = search.toLowerCase();
        postsRaw = postsRaw.filter(p => p.title.toLowerCase().includes(s) ||
            (p.custom_excerpt || '').toLowerCase().includes(s) ||
            (p.tags || []).some(t => t.name.toLowerCase().includes(s)));
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
async function fetchGhostTags() {
    if (!process.env.GHOST_API_URL || !process.env.GHOST_CONTENT_KEY) {
        return [];
    }
    const url = ghostUrl('tags/', { limit: 'all' });
    const res = await fetch(url);
    if (!res.ok)
        return [];
    const data = await res.json();
    return (data.tags || []).map((t) => t.name);
}
async function fetchGhostPost(slug) {
    if (!process.env.GHOST_API_URL || !process.env.GHOST_CONTENT_KEY) {
        return null;
    }
    const url = ghostUrl(`posts/slug/${slug}/`, {
        include: 'tags',
        fields: 'id,title,slug,feature_image,custom_excerpt,excerpt,plaintext,html,published_at',
    });
    const res = await fetch(url);
    if (!res.ok) {
        if (res.status === 404)
            return null;
        throw new Error(`Ghost API error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    if (!data.posts || data.posts.length === 0)
        return null;
    return await transformPost(data.posts[0]);
}
