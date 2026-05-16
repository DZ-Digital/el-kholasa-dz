-- =============================================================================
-- El-Kholasa DZ (الخلاصة الجزائرية) — Cloudflare D1 Database Schema
-- Production-Grade Edge-Replicated SQLite for Algerian News Aggregation
-- =============================================================================
-- Authored for: Cloudflare D1 (Edge SQLite)
-- Target: backend-worker/schema.sql
-- Run via: wrangler d1 migrations apply elkholasa-db --remote
-- =============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- -----------------------------------------------------------------------------
-- TABLE: categories
-- Stores the top-level taxonomic categories for news classification.
-- Categories are seeded from a controlled vocabulary aligned with Arabic media.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT    NOT NULL UNIQUE,          -- e.g. "politics", "economy"
    name_ar     TEXT    NOT NULL,                 -- Arabic display name (e.g. "سياسة")
    name_fr     TEXT,                             -- Optional French label
    description TEXT,
    icon        TEXT,                             -- Emoji or SVG string token
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1,       -- Boolean: 1=active
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active, sort_order);

-- Seed canonical categories
INSERT OR IGNORE INTO categories (slug, name_ar, name_fr, icon, sort_order) VALUES
    ('breaking',   'عاجل',           'Urgent',       '🔴', 1),
    ('politics',   'سياسة',          'Politique',    '🏛️', 2),
    ('economy',    'اقتصاد',         'Économie',     '📈', 3),
    ('society',    'مجتمع',          'Société',      '👥', 4),
    ('security',   'أمن وقضاء',      'Sécurité',     '🛡️', 5),
    ('sports',     'رياضة',          'Sport',        '⚽', 6),
    ('culture',    'ثقافة وفنون',    'Culture',      '🎭', 7),
    ('technology', 'تكنولوجيا',      'Technologie',  '💻', 8),
    ('health',     'صحة',            'Santé',        '🏥', 9),
    ('world',      'دولي',           'Monde',        '🌍', 10),
    ('energy',     'طاقة',           'Énergie',      '⚡', 11),
    ('education',  'تعليم',          'Éducation',    '📚', 12);

-- -----------------------------------------------------------------------------
-- TABLE: news_sources
-- Registry of all Algerian press outlets tracked by the aggregation pipeline.
-- Each outlet has editorial metadata including language preference and RSS feeds.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news_sources (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    slug         TEXT    NOT NULL UNIQUE,          -- e.g. "el-khabar"
    name_ar      TEXT    NOT NULL,                 -- "الخبر"
    name_latin   TEXT    NOT NULL,                 -- "El Khabar"
    base_url     TEXT    NOT NULL,
    rss_feeds    TEXT    NOT NULL DEFAULT '[]',    -- JSON array of RSS URLs
    language     TEXT    NOT NULL DEFAULT 'ar',    -- ISO 639-1
    logo_url     TEXT,
    accent_color TEXT    NOT NULL DEFAULT '#1a56db', -- Hex brand color
    reliability  INTEGER NOT NULL DEFAULT 80,      -- 0-100 trust score
    is_active    INTEGER NOT NULL DEFAULT 1,
    last_scraped TEXT,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sources_active ON news_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_sources_slug ON news_sources(slug);

-- Seed major Algerian news outlets
INSERT OR IGNORE INTO news_sources
    (slug, name_ar, name_latin, base_url, rss_feeds, language, accent_color, reliability) VALUES
    ('el-khabar',    'الخبر',         'El Khabar',    'https://www.elkhabar.com',
     '["https://www.elkhabar.com/feed/"]', 'ar', '#c0392b', 90),

    ('echourouk',    'الشروق',        'Echourouk',    'https://www.echoroukonline.com',
     '["https://www.echoroukonline.com/feed/"]', 'ar', '#e74c3c', 85),

    ('el-watan',     'الوطن',         'El Watan',     'https://www.elwatan.com',
     '["https://www.elwatan.com/feed/"]', 'fr', '#2980b9', 88),

    ('tsa-algerie',  'TSA الجزائر',   'TSA Algérie',  'https://www.tsa-algerie.com',
     '["https://www.tsa-algerie.com/feed/"]', 'fr', '#27ae60', 87),

    ('el-moudjahid', 'المجاهد',       'El Moudjahid', 'https://www.elmoudjahid.com',
     '["https://www.elmoudjahid.com/ar/feed"]', 'ar', '#8e44ad', 82),

    ('algerie360',   'الجزائر 360',   'Algérie 360',  'https://www.algerie360.com',
     '["https://www.algerie360.com/feed/"]', 'ar', '#f39c12', 80),

    ('ennahar',      'النهار',        'Ennahar',      'https://www.ennaharonline.com',
     '["https://www.ennaharonline.com/feed/"]', 'ar', '#16a085', 83),

    ('al-hiwar',     'الحوار',        'Al Hiwar',     'https://www.elhiwardz.com',
     '["https://www.elhiwardz.com/feed/"]', 'ar', '#d35400', 78),

    ('aps',          'وأج',           'APS',          'https://www.aps.dz',
     '["https://www.aps.dz/ar/feed/"]', 'ar', '#1abc9c', 95),

    ('liberté',      'ليبرتي',        'Liberté',      'https://www.liberte-algerie.com',
     '["https://www.liberte-algerie.com/feed/"]', 'fr', '#9b59b6', 86),

    ('el-massa',     'المساء',        'El Massa',     'https://www.el-massa.com',
     '["https://www.el-massa.com/feed/"]', 'ar', '#34495e', 79),

    ('horizons',     'أفاق',          'Horizons',     'https://www.horizons-dz.com',
     '["https://www.horizons-dz.com/feed/"]', 'ar', '#e67e22', 77);

-- -----------------------------------------------------------------------------
-- TABLE: news_clusters
-- The core entity. Each row represents a deduplicated, AI-processed news story.
-- A cluster can absorb multiple raw articles covering the same event.
-- This is the primary unit exposed by the API and rendered in the frontend PWA.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news_clusters (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    slug            TEXT    NOT NULL UNIQUE,            -- URL-safe identifier

    -- Classification
    category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    priority        INTEGER NOT NULL DEFAULT 50,        -- 1=Breaking, 100=Low. Used for layout.
    is_breaking     INTEGER NOT NULL DEFAULT 0,         -- Hero card trigger flag

    -- Content (Arabic — Strict MSA)
    title_ar        TEXT    NOT NULL,                   -- Primary display headline
    lead_ar         TEXT,                               -- Optional 1-sentence lead paragraph

    -- AI-Generated Outputs
    summary_points  TEXT    NOT NULL DEFAULT '[]',      -- JSON: [{"point": "..."}] — 3 items max
    embedding       TEXT,                               -- JSON float[] — vector for clustering
    seo_description TEXT,                               -- Strict ≤150 char meta description (AR)
    json_ld         TEXT,                               -- Full JSON-LD NewsArticle structured data

    -- Media
    hero_image_url  TEXT,                               -- Primary image (enforced 3:2 ratio)
    hero_image_alt  TEXT,                               -- Arabic alt text for accessibility

    -- Source Aggregation Stats
    source_count    INTEGER NOT NULL DEFAULT 1,
    sources_json    TEXT    NOT NULL DEFAULT '[]',      -- Denormalized list of contributing source slugs

    -- Story Lifecycle
    first_seen_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    last_updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
    event_date      TEXT,                               -- Canonical date of the event
    is_developing   INTEGER NOT NULL DEFAULT 0,         -- Story still evolving flag
    is_archived     INTEGER NOT NULL DEFAULT 0,

    -- Engagement Signals (incremented by Worker on each read)
    view_count      INTEGER NOT NULL DEFAULT 0,
    share_count     INTEGER NOT NULL DEFAULT 0,
    save_count      INTEGER NOT NULL DEFAULT 0,

    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_clusters_category  ON news_clusters(category_id, is_archived, priority);
CREATE INDEX IF NOT EXISTS idx_clusters_breaking  ON news_clusters(is_breaking, last_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_clusters_slug      ON news_clusters(slug);
CREATE INDEX IF NOT EXISTS idx_clusters_date      ON news_clusters(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_clusters_priority  ON news_clusters(priority ASC, last_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_clusters_updated   ON news_clusters(last_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_clusters_sources   ON news_clusters(sources_json);  -- For source filtering

-- -----------------------------------------------------------------------------
-- TABLE: raw_articles
-- Individual raw articles scraped from each news outlet before AI processing.
-- These are the atomic inputs to the clustering and summarization pipeline.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw_articles (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id       INTEGER NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
    cluster_id      INTEGER REFERENCES news_clusters(id) ON DELETE SET NULL,  -- NULL until clustered

    -- Raw Content
    external_url    TEXT    NOT NULL UNIQUE,            -- Canonical source URL
    title_raw       TEXT    NOT NULL,                   -- Original title (any language)
    body_raw        TEXT,                               -- Full scraped body text
    excerpt         TEXT,                               -- Short preview text
    author          TEXT,                               -- Byline if available
    language        TEXT    NOT NULL DEFAULT 'ar',      -- Detected content language

    -- Media
    image_url       TEXT,
    image_alt       TEXT,

    -- AI Processing State
    embedding       TEXT,                               -- JSON float[] for this article
    is_processed    INTEGER NOT NULL DEFAULT 0,         -- 0=pending, 1=clustered, 2=rejected
    processing_log  TEXT,                               -- Error messages or skip reasons

    -- Provenance
    published_at    TEXT,                               -- Publisher-reported timestamp (ISO 8601)
    scraped_at      TEXT    NOT NULL DEFAULT (datetime('now')),

    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_articles_source    ON raw_articles(source_id);
CREATE INDEX IF NOT EXISTS idx_articles_cluster   ON raw_articles(cluster_id);
CREATE INDEX IF NOT EXISTS idx_articles_processed ON raw_articles(is_processed, scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_url       ON raw_articles(external_url);
CREATE INDEX IF NOT EXISTS idx_articles_published ON raw_articles(published_at DESC);

-- -----------------------------------------------------------------------------
-- TABLE: cluster_timelines
-- Chronological event entries appended to a cluster as a story develops.
-- Implements "Evolutionary Story Tracking" — no duplicate clusters created.
-- Each timeline entry captures a discrete development in the news story.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cluster_timelines (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    cluster_id      INTEGER NOT NULL REFERENCES news_clusters(id) ON DELETE CASCADE,

    -- Content
    entry_text_ar   TEXT    NOT NULL,                   -- Single-sentence Arabic update
    entry_type      TEXT    NOT NULL DEFAULT 'update',  -- "update" | "correction" | "closure"
    source_slug     TEXT,                               -- Which outlet broke this update
    source_url      TEXT,                               -- Direct link to update article

    -- Temporal
    event_timestamp TEXT    NOT NULL DEFAULT (datetime('now')),
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_timelines_cluster ON cluster_timelines(cluster_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_timelines_type    ON cluster_timelines(entry_type);

-- -----------------------------------------------------------------------------
-- TABLE: scrape_jobs
-- Audit log for all scraping runs. Tracks success/failure per source per cycle.
-- Used by the CI/CD pipeline and admin dashboard to monitor pipeline health.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scrape_jobs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id       INTEGER NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,

    -- Job Metadata
    job_type        TEXT    NOT NULL DEFAULT 'rss',     -- "rss" | "html" | "manual"
    status          TEXT    NOT NULL DEFAULT 'pending', -- "pending" | "running" | "success" | "error"
    triggered_by    TEXT    NOT NULL DEFAULT 'cron',    -- "cron" | "webhook" | "manual"

    -- Results
    articles_found  INTEGER NOT NULL DEFAULT 0,
    articles_new    INTEGER NOT NULL DEFAULT 0,
    clusters_created INTEGER NOT NULL DEFAULT 0,
    clusters_updated INTEGER NOT NULL DEFAULT 0,
    error_message   TEXT,

    -- Timing
    started_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    completed_at    TEXT,
    duration_ms     INTEGER
);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_source ON scrape_jobs(source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON scrape_jobs(status, started_at DESC);

-- -----------------------------------------------------------------------------
-- TABLE: push_subscriptions
-- Stores PWA Push API subscription objects per user device.
-- Used for broadcasting breaking news notifications.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint      TEXT    NOT NULL UNIQUE,
    p256dh_key    TEXT    NOT NULL,
    auth_key      TEXT    NOT NULL,
    user_agent    TEXT,
    categories    TEXT    NOT NULL DEFAULT '["breaking"]',  -- JSON: subscribed category slugs
    is_active     INTEGER NOT NULL DEFAULT 1,
    subscribed_at TEXT    NOT NULL DEFAULT (datetime('now')),
    last_sent_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_push_active ON push_subscriptions(is_active);

-- -----------------------------------------------------------------------------
-- TABLE: saved_clusters (Bookmarks)
-- Server-side persistence layer for "Save for Later" user bookmarks.
-- Primary storage is IndexedDB on device; this is the sync/backup layer.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_clusters (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    cluster_id  INTEGER NOT NULL REFERENCES news_clusters(id) ON DELETE CASCADE,
    device_id   TEXT    NOT NULL,                       -- Anonymous device fingerprint
    saved_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(cluster_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_device ON saved_clusters(device_id, saved_at DESC);

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
