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
    tags: Array<{
        name: string;
        slug: string;
    }>;
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
    vimeoIds: string[];
    vimeoVideos: VimeoVideo[];
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
export declare function extractVimeoIds(html: string | null): string[];
export declare function extractVimeoId(html: string | null): string | null;
export declare function extractImages(html: string | null): string[];
export declare function sanitizeGhostHtml(html: string): string;
export declare function transformPost(post: GhostPostRaw): Promise<GhostPostTransformed>;
export declare function fetchGhostPosts(page?: number, limit?: number, search?: string, tag?: string, slugs?: string[]): Promise<{
    posts: GhostPostTransformed[];
    meta: {
        page: number;
        pages: number;
        total: number;
    };
}>;
export declare function fetchGhostTags(): Promise<string[]>;
export declare function fetchGhostPost(slug: string): Promise<GhostPostTransformed | null>;
