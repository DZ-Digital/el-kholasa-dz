# الخلاصة الجزائرية | El-Kholasa DZ

> **Production-Grade Algerian News Aggregator powered by Cloudflare Serverless Ecosystem**

A high-performance Progressive Web App (PWA) that aggregates, deduplicates, and AI-summarizes Algerian news from major press outlets using Cloudflare Workers AI, D1, and Pages.

---

## 🏗️ Repository Architecture

```
elkholasa-dz/
├── 📁 backend-worker/                    # Cloudflare Worker — Backend Engine
│   ├── 📄 schema.sql                     # D1 SQLite schema (categories, clusters, articles, timelines)
│   ├── 📄 wrangler.toml                  # Cloudflare configuration (D1, AI, KV, Cron bindings)
│   ├── 📄 package.json                   # Worker dependencies (Hono, @cloudflare/ai)
│   ├── 📄 tsconfig.json                  # TypeScript strict config for Workers runtime
│   ├── 📁 migrations/
│   │   └── 📄 0001_initial_schema.sql    # D1 migration (tracked by Wrangler)
│   └── 📁 src/
│       └── 📄 index.ts                   # Core Worker: Scraping + AI + API + Cron handlers
│
├── 📁 src/                               # Frontend PWA (Vite + React + Tailwind v4)
│   ├── 📄 main.tsx                       # Entry point: SW registration, JSON-LD injection
│   ├── 📄 App.tsx                        # Root component: layout, state, data fetching
│   ├── 📄 index.css                      # Design system: OLED dark mode, RTL, glassmorphism
│   ├── 📁 components/
│   │   ├── 📄 Header.tsx                 # Sticky glassmorphism header + search + theme toggle
│   │   ├── 📄 CategorySidebar.tsx        # RTL category filter navigation
│   │   ├── 📄 NewsFeed.tsx               # Dynamic hybrid layout engine (hero + grid)
│   │   ├── 📄 ClusterCard.tsx            # Main news card: summary + source dock + audio
│   │   ├── 📄 SourceDock.tsx             # Multi-source attribution button dock
│   │   ├── 📄 AudioWaveform.tsx          # Animated SVG waveform for TTS playback
│   │   ├── 📄 SkeletonCard.tsx           # Zero-CLS skeleton loaders (3:2 aspect ratio)
│   │   └── 📄 SavedArticlesPanel.tsx     # Offline bookmarks slide panel
│   ├── 📁 hooks/
│   │   ├── 📄 useTheme.ts                # OLED dark/light mode with localStorage persistence
│   │   ├── 📄 useAudioPlayback.ts        # Web Speech API TTS orchestration
│   │   └── 📄 useSavedArticles.ts        # Bookmark management with offline persistence
│   ├── 📁 data/
│   │   └── 📄 mockData.ts                # Rich Arabic mock data (8 clusters, 12 categories)
│   ├── 📁 types/
│   │   └── 📄 index.ts                   # TypeScript interfaces: NewsCluster, Source, etc.
│   └── 📁 utils/
│       └── 📄 dateUtils.ts               # Arabic-localized relative time formatting
│
├── 📁 public/
│   ├── 📄 manifest.json                  # PWA Web App Manifest (Arabic, RTL, shortcuts)
│   └── 📄 sw.js                          # Service Worker: caching strategies + push notifications
│
├── 📁 .github/
│   └── 📁 workflows/
│       ├── 📄 deploy-backend.yml         # CI/CD: TypeCheck → D1 Migrate → Worker Deploy → Smoke Tests
│       └── 📄 deploy-frontend.yml        # CI/CD: Build → Lighthouse → Pages Deploy → Cache Purge
│
├── 📄 index.html                         # HTML shell: Arabic fonts, PWA meta, RTL dir
├── 📄 package.json                       # Frontend dependencies
├── 📄 vite.config.ts                     # Vite build configuration
└── 📄 tsconfig.json                      # TypeScript configuration
```

---

## 🧠 AI Pipeline Architecture

```
RSS Feeds (12 Algerian outlets)
         │
         ▼
┌─────────────────────┐
│   Cloudflare Worker  │  ← Cron: every 15min (breaking) / 1hr (full)
│   Scrape Engine      │
└────────┬────────────┘
         │ Raw Articles
         ▼
┌─────────────────────┐
│  Workers AI          │  @cf/baai/bge-small-en-v1.5
│  Embedding Engine    │  → float[] semantic vectors
└────────┬────────────┘
         │ Cosine Similarity (threshold: 0.82)
         ▼
┌─────────────────────┐
│  Clustering Engine   │  Deduplication via vector similarity
│  (D1 Query)          │  Timeline append for evolving stories
└────────┬────────────┘
         │ Clustered text
         ▼
┌─────────────────────┐
│  Workers AI          │  @cf/meta/llama-3.1-8b-instruct
│  Summarization       │  → 3-point MSA Arabic bullets
│  + SEO Description   │  → ≤150 char Arabic meta description
│  + JSON-LD Builder   │  → NewsArticle structured data
└────────┬────────────┘
         │ Enriched NewsCluster
         ▼
┌─────────────────────┐
│  Cloudflare D1       │  Edge-replicated SQLite
│  + KV Cache          │  5-min API response cache
└────────┬────────────┘
         │ REST API
         ▼
┌─────────────────────┐
│  PWA Frontend        │  Cloudflare Pages (Edge CDN)
│  (React + Tailwind)  │  Service Worker + Push API
└─────────────────────┘
```

---

## 🚀 Deployment

### Prerequisites
- Cloudflare account with Workers, D1, Pages, and KV enabled
- GitHub repository with the required Secrets configured

### GitHub Secrets Required
```
CLOUDFLARE_API_TOKEN      # Cloudflare API token with Workers + Pages + D1 permissions
CLOUDFLARE_ACCOUNT_ID     # Your Cloudflare account ID
CLOUDFLARE_ZONE_ID        # Zone ID for elkholasa.dz domain
VAPID_PUBLIC_KEY          # Web Push VAPID public key
VAPID_PRIVATE_KEY         # Web Push VAPID private key
VITE_API_BASE_URL         # https://api.elkholasa.dz
```

### Initial Setup
```bash
# 1. Create D1 database
wrangler d1 create elkholasa-db

# 2. Apply migrations
wrangler d1 migrations apply elkholasa-db --remote

# 3. Create KV namespace
wrangler kv:namespace create CACHE

# 4. Update wrangler.toml with IDs from above commands

# 5. Deploy backend
cd backend-worker && wrangler deploy

# 6. Deploy frontend
npm run build && wrangler pages deploy dist --project-name=elkholasa-dz
```

### Automated CI/CD
Every push to `main` automatically:
1. **Backend**: TypeCheck → D1 Migrations → Worker Deploy → Smoke Tests
2. **Frontend**: Build → Lighthouse Audit → Pages Deploy → CDN Cache Purge

---

## 📱 PWA Features

| Feature | Implementation |
|---------|---------------|
| Offline Resilience | Service Worker: Stale-While-Revalidate + Cache-First |
| Auto-Cache | Background fetch + cache top 20 clusters on SW activation |
| Save for Later | `localStorage` bookmarks + SW offline cluster caching |
| Push Notifications | Push API + AI-generated ≤150 char Arabic alerts |
| TTS Audio Brief | Web Speech API with Arabic vocal engine |
| Install Prompt | `beforeinstallprompt` captured + deferred for UX |

---

## 🎨 Design System

| Token | Light Mode | OLED Dark Mode |
|-------|-----------|----------------|
| Background | `#f8fafc` | `#000000` |
| Text Primary | `#111827` | `#F5F5F7` (Soft off-white — NO pure white) |
| Text Secondary | `#6b7280` | `#E5E5EA` (Ivory) |
| Card Surface | `rgba(255,255,255,0.85)` | `rgba(0,0,0,0.60)` |
| Backdrop Blur | `blur(12px)` | `blur(12px)` |
| Accent | `#059669` | `#34d399` |
| Line Height (Arabic) | 1.65–1.75 | 1.65–1.75 |

---

## 📰 News Sources

| Outlet | Slug | Language | Reliability |
|--------|------|----------|-------------|
| الخبر (El Khabar) | `el-khabar` | AR | 90% |
| الشروق (Echourouk) | `echourouk` | AR | 85% |
| وأج (APS) | `aps` | AR | 95% |
| TSA Algérie | `tsa-algerie` | FR | 87% |
| El Watan | `el-watan` | FR | 88% |
| النهار (Ennahar) | `ennahar` | AR | 83% |
| الجزائر 360 | `algerie360` | AR | 80% |
| المجاهد (El Moudjahid) | `el-moudjahid` | AR | 82% |
| ليبرتي (Liberté) | `liberté` | FR | 86% |
| المساء (El Massa) | `el-massa` | AR | 79% |
| أفاق (Horizons) | `horizons` | AR | 77% |
| الحوار (Al Hiwar) | `al-hiwar` | AR | 78% |

---

*Built with ❤️ for the Algerian digital community — مبني بالحب لمجتمع الجزائر الرقمي*
