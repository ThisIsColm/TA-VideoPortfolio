# Ghost Companion Sites

A curated case-study portfolio library built on top of Ghost headless CMS. Connects your Ghost authoring environment to a highly polished React/Vite/Tailwind frontend portfolio.

## Architecture
- **Web**: React + Vite + Tailwind (Figma design system)
- **API**: Node.js + Express + `better-sqlite3`. Purely serves as a curation layer and Ghost content proxy.
- **Data**: No users, no sessions, no admin UI. Collections are constructed manually via API/CLI to keep the application ultra-lightweight.

## Installation

```bash
npm install
```
This installs dependencies for both `/apps/web` and `/apps/api` via workspaces.

Configure your `.env` in `apps/api/`:
```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=file:database.sqlite3

GHOST_API_URL=https://your-ghost-blog.com
GHOST_CONTENT_KEY=your_key
```

## Running the App

**Development**
```bash
npm run dev
```

**Production Build**
```bash
npm run build
npm start
```

## Managing Collections (Unauthenticated Admin API)
Since this app is deeply private and relies on manual curation, all collection management is done via a local CLI script or direct cURL commands against the backend port.

### Using the CLI Manager
```bash
# Create a new collection
node manage.js create-collection "My Portfolio" "my-portfolio" "Optional introduction..."

# Add a Ghost post to a collection
# You need the Ghost Post ID and Slug from your CMS.
node manage.js add-item <collection_id> <ghost_post_id> <ghost_slug>

# List collections
node manage.js list-collections
```

### Using cURL
```bash
# 1. Create a Collection
curl -X POST http://localhost:3001/api/admin/collections \
  -H "Content-Type: application/json" \
  -d '{"title": "Featured Work", "slug": "featured"}'

# 2. Add Item to Collection
curl -X POST http://localhost:3001/api/admin/collections/{COLLECTION_ID}/items \
  -H "Content-Type: application/json" \
  -d '{"ghostPostId": "YOUR_GHOST_POST_ID", "ghostSlug": "your-ghost-post-slug"}'

# 3. Change Ordering
curl -X PATCH http://localhost:3001/api/admin/collections/{COLLECTION_ID}/items/reorder \
  -H "Content-Type: application/json" \
  -d '{"itemIds": ["id_1", "id_2", "id_3"]}'
```

## Public Library Access
Your frontend reads strictly from:
- `GET /api/public/collections/:slug`
- `GET /api/public/collections/:slug/posts/:postSlug`

When clicking on a post inside a collection, a responsive overlay pulls the rendered Ghost HTML directly, scraping Vimeo embeds to construct cinematic hero blocks, and parsing img tags to build a horizontal filmstrip gallery.