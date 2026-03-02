# Ghost Companion Collections

A premium, cinematic video case study platform for showcasing video production work. Built with React, TypeScript, and a custom dark design system inspired by high-end film studio portfolios.

## Features

### Client-Facing Experience
- **Collection Pages** (`/p/{slug}`) - Curated video galleries with minimal, elegant design
- **Case Study Overlays** - Immersive full-screen video viewing with Vimeo embeds
- **Stills Galleries** - Horizontal scrolling cinematic image galleries with fullscreen lightbox
- **Password Protection** - Optional password-protected collections
- **Expiry Dates** - Time-limited collection access

### Admin Dashboard
- **Collections Management** - Create, edit, and delete collections
- **Ghost Posts Browser** - Browse and search video posts with multi-select
- **Drag-to-Reorder** - Intuitive video ordering within collections
- **Link Sharing** - One-click collection link copying
- **Authentication** - Simple password-based admin access (default: `admin`)

## Design System

### Visual Philosophy
- **Dark & Cinematic** - Near-black backgrounds (#0A0A0A) with high-contrast white text
- **Minimal & Spacious** - Premium feel through restraint and generous spacing
- **Premium Interactions** - 700ms overlay animations, subtle hover states
- **Responsive** - Fully responsive from mobile to desktop

### Color Palette
- Primary Background: `#0A0A0A`
- Secondary Background: `#121212`
- Text Primary: `rgba(255, 255, 255, 0.95)`
- Text Secondary: `rgba(255, 255, 255, 0.60)`
- Border Subtle: `rgba(255, 255, 255, 0.06)`

### Animation System
- Overlay Enter: 700ms ease-out (theatrical reveal)
- Hover States: 200ms ease-out (responsive feel)
- Transitions: Custom cubic-bezier curves for premium motion

## Getting Started

1. **Login** - Navigate to `/login` and use password: `admin`
2. **Create Collection** - Dashboard → New Collection
3. **Browse Posts** - Navigate to Ghost Posts to view available videos
4. **Add to Collection** - Edit collection and browse posts (multi-select coming soon)
5. **Share** - Copy the collection link and share with clients

## Routes

- `/` - Redirects to login
- `/login` - Admin authentication
- `/dashboard` - Collections list
- `/dashboard/posts` - Ghost posts browser
- `/dashboard/collections/new` - Create new collection
- `/dashboard/collections/:id/edit` - Edit collection
- `/p/:slug` - Public collection page

## Data Storage

Collections are stored in `localStorage` for this demo. For production use with real persistence and multi-user access, integrate with Supabase or your preferred backend.

## Mock Data

The app includes 9 mock video posts with Unsplash imagery and 3 sample collections. Edit `/src/app/lib/mockData.ts` to customize.

## Customization

- **Theme**: Edit `/src/styles/ghost-theme.css` for colors, spacing, typography
- **Components**: All components in `/src/app/components/ghost/`
- **Mock Data**: Update `/src/app/lib/mockData.ts` with real Ghost CMS posts

## Key Components

- `ThumbnailCard` - Video thumbnail with play icon hover
- `CaseStudyOverlay` - Full-screen case study viewer
- `Button` - Primary, secondary, and ghost variants
- `Input/Textarea` - Form inputs with labels
- `DraggableVideoRow` - Drag-and-drop video reordering

## Technologies

- React 18
- TypeScript
- React Router 7 (Data mode)
- Tailwind CSS 4
- Motion (Framer Motion)
- React DnD
- Lucide React (icons)
- date-fns
- Vimeo Player API

---

Built with Figma Make
