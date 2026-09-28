# Trendly — Editorial Interior Design Platform

**Trendly** is a tranquil, high-end editorial web application for discovering daily interior design trends, curating bespoke mood boards, and presenting material specification sheets for client review.

Designed specifically for interior designers with an aesthetic grounded in warm minimalism, quiet luxury, and tactile layers.

---

## Key Features

### 1. The Daily Edit & Dynamic Greeting
- **Time-Aware Greeting**: Adapts to Shilpi's day (*"Good morning"*, *"Good afternoon"*, *"Good evening"*).
- **Curated Interior Feed**: High-resolution photography spanning 9 disciplines (*Flooring, Wall Finishes, Lighting, Furniture, Tiles, Paint & Color, Fabrics & Textiles, Hardware, Decor & Accessories*).
- **Style Cue Filters**: One-click filter carousel for aesthetic movements (*Quiet luxury, Japandi, Warm minimalism, Organic modern, Textural interiors, Handcrafted, Earthy palette, Soft modernism, Tactile layers*).

### 2. On-Demand Extraction (Unsplash & Pinterest)
- **Zero Dead Filters**: Filtering by any tag, category, or search term (e.g. *"terracotta"*, *"bouclé"*, *"travertine"*) automatically curates discoveries on-demand if not already in the catalog.
- **Unsplash Integration**: Live photo search via the Unsplash API with automatic caching, rate-limit throttling, and an expanded 50+ image offline fallback pool.
- **Pinterest Sourcing**: Every discovery connects to live Pinterest trending boards and pins (`https://www.pinterest.com/search/pins/?q=...`), with dedicated Pinterest badges and detail links.

### 3. Visual Mood Boards & Project Management
- **Custom Project Boards**: Create and organize boards for specific client schemes or spaces.
- **Drag-and-Drop Reordering**: Rearrange items to curate the perfect visual narrative.
- **Personal Designer Notes**: Add personal notes, lead times, or client feedback to individual mood board items and bookmarks with quick suggestion chips (*"Client approved"*, *"Lead time 6-8 weeks"*, *"Sample on order"*).

### 4. Client Presentation Spec Sheet & PDF Export
- **Print-to-PDF Ready**: Generate an editorial presentation spec sheet from any mood board with one click.
- **Professional Detail**: Features project vision, material balance breakdown, visual gallery, item specification table with personal designer notes, and curator signature.

### 5. AI Design Co-Pilot Drawer
- **Context-Aware Assistance**: An interactive conversational drawer that analyzes your active mood board, answers palette questions, and suggests complementary finishes and hardware.
- **Powered by OpenRouter / Gemini**: Configured with free-tier AI models (`google/gemini-2.0-flash-exp:free`) with an offline curated fallback engine.

### 6. Shareable Links with Expiration
- **Client & Collaborator Links**: Generate standalone public share links with optional expiration (1 day, 7 days, 30 days) and real-time view counting.

---

## Tech Stack

- **Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS, Lucide React, Framer Motion
- **Routing**: React Router v7 (Single-Page Application)
- **Backend**: Express 4, Node.js, `tsx`
- **Database**: LibSQL (`@libsql/client`) with local SQLite (`trendly.db`) or Turso cloud database
- **Testing**: Vitest (17 automated unit and integration tests)
- **Automation**: `node-cron` for scheduled daily trend refreshes

---

## Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 20 / 24)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd "Trendly glm"
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   *(By default, Trendly runs completely offline with local SQLite and curated fallbacks — no paid API keys required.)*

4. **Start the development server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Starts dev server with hot module replacement (HMR) and backend watcher |
| `pnpm check` | Runs TypeScript type checking across client and server (`tsc --noEmit`) |
| `pnpm test` | Runs the full Vitest automated test suite (17 tests) |
| `pnpm build` | Builds production-optimized Vite client bundle and Node.js server bundle |
| `pnpm start` | Runs the compiled production server from `dist/` |

---

## Optional API Keys

Add keys to `.env` to activate live cloud integrations:

```env
# Optional: Unsplash Photo API (free key at https://unsplash.com/developers)
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# Optional: OpenRouter AI (free model: google/gemini-2.0-flash-exp:free)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free

# Optional: Remote Turso Cloud Database
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your_turso_token
```

---

## Deployment

### Render / Railway / Fly.io / VPS
1. Set the **Build Command**: `pnpm install && pnpm build`
2. Set the **Start Command**: `pnpm start`
3. Configure environment variables (`PORT=3000`, `NODE_ENV=production`, etc.).
4. If using Turso, provide `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. If running standalone, local SQLite persists in the container's volume.

---

## License
MIT License. Crafted for Shilpi.
