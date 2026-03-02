CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    intro TEXT DEFAULT '',
    hero_item_id TEXT REFERENCES collection_items(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collection_items (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    ghost_post_id TEXT NOT NULL,
    ghost_slug TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
