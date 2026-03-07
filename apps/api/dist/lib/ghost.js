"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractVimeoId = extractVimeoId;
exports.extractImages = extractImages;
exports.sanitizeGhostHtml = sanitizeGhostHtml;
exports.transformPost = transformPost;
exports.fetchGhostPosts = fetchGhostPosts;
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
function extractVimeoId(html) {
    if (!html)
        return null;
    const iframeMatch = html.match(/src=["']https?:\/\/player\.vimeo\.com\/video\/(\d+)[^"']*["']/i);
    if (iframeMatch)
        return iframeMatch[1];
    const urlMatch = html.match(/https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/i);
    if (urlMatch)
        return urlMatch[1];
    return null;
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
    const vimeoId = extractVimeoId(post.html);
    const stills = extractImages(post.html);
    const year = post.published_at ? new Date(post.published_at).getFullYear().toString() : '';
    const tags = (post.tags || []).map(t => t.name);
    let description = post.custom_excerpt || post.excerpt || post.plaintext || '';
    let vimeoWidth;
    let vimeoHeight;
    if (vimeoId) {
        const meta = await fetchVimeoMetadata(vimeoId);
        vimeoWidth = meta.width;
        vimeoHeight = meta.height;
    }
    return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        thumbnail: post.feature_image || '',
        vimeoId,
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
    let filters = [];
    if (tag) {
        filters.push(`tag:${tag}`);
    }
    if (slugs.length > 0) {
        filters.push(`slug:[${slugs.join(',')}]`);
    }
    const url = ghostUrl('posts/', {
        include: 'tags',
        limit: String(limit),
        page: String(page),
        fields: 'id,title,slug,feature_image,custom_excerpt,excerpt,plaintext,html,published_at',
        filter: filters.join('+'),
    });
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Ghost API error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    let postsRaw = data.posts;
    // Basic client-side search since Ghost API doesn't support full-text search out of the box easily
    if (search) {
        const s = search.toLowerCase();
        postsRaw = postsRaw.filter(p => p.title.toLowerCase().includes(s) ||
            (p.custom_excerpt || '').toLowerCase().includes(s));
    }
    const posts = await Promise.all(postsRaw.map(transformPost));
    const meta = data.meta?.pagination || { page: 1, pages: 0, total: 0 };
    return { posts, meta: { page: meta.page, pages: meta.pages, total: meta.total } };
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
