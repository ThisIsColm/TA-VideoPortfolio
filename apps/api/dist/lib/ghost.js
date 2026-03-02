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
const GHOST_API_URL = process.env.GHOST_API_URL || '';
const GHOST_CONTENT_KEY = process.env.GHOST_CONTENT_KEY || '';
function ghostUrl(path, params = {}) {
    const base = GHOST_API_URL.replace(/\/$/, '');
    const url = new URL(`${base}/ghost/api/content/${path}`);
    url.searchParams.set('key', GHOST_CONTENT_KEY);
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
        },
        allowedIframeHostnames: ['player.vimeo.com'],
        allowedSchemes: ['http', 'https', 'mailto'],
    });
}
function transformPost(post) {
    const vimeoId = extractVimeoId(post.html);
    const stills = extractImages(post.html);
    const year = post.published_at ? new Date(post.published_at).getFullYear().toString() : '';
    const tags = (post.tags || []).map(t => t.name);
    let description = post.custom_excerpt || post.excerpt || post.plaintext || '';
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
    };
}
async function fetchGhostPosts(page = 1, limit = 50, search = '', tag = '') {
    if (!GHOST_API_URL || !GHOST_CONTENT_KEY) {
        return { posts: [], meta: { page: 1, pages: 0, total: 0 } };
    }
    let filter = '';
    if (tag) {
        filter = `tag:${tag}`;
    }
    const url = ghostUrl('posts/', {
        include: 'tags',
        limit: String(limit),
        page: String(page),
        fields: 'id,title,slug,feature_image,custom_excerpt,excerpt,plaintext,html,published_at',
        filter: filter,
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
    const posts = postsRaw.map(transformPost);
    const meta = data.meta?.pagination || { page: 1, pages: 0, total: 0 };
    return { posts, meta: { page: meta.page, pages: meta.pages, total: meta.total } };
}
async function fetchGhostPost(slug) {
    if (!GHOST_API_URL || !GHOST_CONTENT_KEY) {
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
    return transformPost(data.posts[0]);
}
