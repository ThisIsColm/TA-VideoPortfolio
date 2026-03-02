// Centralized API client for all backend requests

const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(res.status, body.error || `Request failed: ${res.status}`);
    }

    return res.json();
}

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

// Auth functions removed per user request
// ─── Ghost Posts ──────────────────────────────────────

export interface GhostPost {
    id: string;
    title: string;
    slug: string;
    thumbnail: string;
    vimeoId: string | null;
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

export async function fetchGhostPosts(page = 1, limit = 50) {
    return request<{
        posts: GhostPost[];
        meta: { page: number; pages: number; total: number };
    }>(`/ghost/posts?page=${page}&limit=${limit}`);
}

export async function fetchGhostPostBySlug(slug: string) {
    return request<{ post: GhostPost }>(`/ghost/posts/${slug}`);
}

// ─── Collections (Admin) ─────────────────────────────

export interface CollectionSummary {
    id: string;
    title: string;
    slug: string;
    intro: string;
    itemCount: number;
    thumbnails: string[];
    createdAt: string;
    updatedAt: string;
    hasPassword?: boolean;
    heroItemId?: string;
}

export interface CollectionDetail {
    id: string;
    title: string;
    slug: string;
    intro: string;
    items: CollectionItem[];
    createdAt: string;
    updatedAt: string;
    heroItemId?: string;
}

export interface CollectionItem {
    id: string;
    ghostPostId: string;
    ghostSlug: string;
    sortOrder: number;
}

export async function fetchCollections(): Promise<{ collections: CollectionSummary[] }> {
    const data = await request<{ collections: any[] }>('/admin/collections');
    return {
        collections: data.collections.map(c => ({
            ...c,
            createdAt: c.createdAt || c.created_at,
            updatedAt: c.updatedAt || c.updated_at
        })) as CollectionSummary[]
    };
}

export async function fetchCollection(id: string): Promise<{ collection: CollectionDetail }> {
    const data = await request<{ collection: any }>(`/admin/collections/${id}`);
    if (data.collection) {
        data.collection.createdAt = data.collection.createdAt || data.collection.created_at;
        data.collection.updatedAt = data.collection.updatedAt || data.collection.updated_at;
        data.collection.heroItemId = data.collection.heroItemId || data.collection.hero_item_id;
    }
    return data as { collection: CollectionDetail };
}

export async function createCollection(data: {
    title: string;
    slug: string;
    intro?: string;
    password?: string;
}) {
    return request<{ collection: any }>('/admin/collections', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateCollection(id: string, data: {
    title?: string;
    slug?: string;
    intro?: string;
    password?: string;
    heroItemId?: string | null;
}) {
    return request<{ collection: any }>(`/admin/collections/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function deleteCollection(id: string) {
    return request<{ ok: boolean }>(`/admin/collections/${id}`, { method: 'DELETE' });
}

export async function addCollectionItem(collectionId: string, ghostPostId: string, ghostSlug: string) {
    return request<{ item: CollectionItem }>(`/admin/collections/${collectionId}/items`, {
        method: 'POST',
        body: JSON.stringify({ ghostPostId, ghostSlug }),
    });
}

export async function reorderCollectionItems(collectionId: string, itemIds: string[]) {
    return request<{ ok: boolean }>(`/admin/collections/${collectionId}/items/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ itemIds }),
    });
}

export async function removeCollectionItem(collectionId: string, itemId: string) {
    return request<{ ok: boolean }>(`/admin/collections/${collectionId}/items/${itemId}`, {
        method: 'DELETE',
    });
}

// ─── Public Collections ──────────────────────────────

export interface PublicCollection {
    id: string;
    title: string;
    slug: string;
    intro: string;
    posts?: GhostPost[];
    requiresPassword?: boolean;
    heroPostId?: string;
}

export async function fetchPublicCollection(slug: string, password?: string) {
    const headers: Record<string, string> = {};
    if (password) {
        headers['x-collection-password'] = password;
    }
    return request<{ collection: PublicCollection }>(`/public/collections/${slug}`, { headers });
}

export async function fetchPublicPost(collectionSlug: string, postSlug: string) {
    return request<{ post: GhostPost }>(`/public/collections/${collectionSlug}/posts/${postSlug}`);
}
