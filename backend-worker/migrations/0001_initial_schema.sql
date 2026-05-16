-- =============================================================================
-- Migration: 0001_initial_schema.sql
-- El-Kholasa DZ — Initial Database Schema
-- Applied via: wrangler d1 migrations apply elkholasa-db --remote
-- =============================================================================

-- See full schema in backend-worker/schema.sql
-- This migration file mirrors the complete initial schema for D1 migration tracking

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT    NOT NULL UNIQUE,
    name_ar     TEXT    NOT NULL,
    name_fr     TEXT,
    description TEXT,
    icon        TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active, sort_order);

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

CREATE TABLE IF NOT EXISTS news_sources (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    slug         TEXT    NOT NULL UNIQUE,
    name_ar      TEXT    NOT NULL,
    name_latin   TEXT    NOT NULL,
    base_url     TEXT    NOT NULL,
    rss_feeds    TEXT    NOT NULL DEFAULT '[]',
    language     TEXT    NOT NULL DEFAULT 'ar',
    logo_url     TEXT,
    accent_color TEXT    NOT NULL DEFAULT '#1a56db',
    reliability  INTEGER NOT NULL DEFAULT 80,
    is_active    INTEGER NOT NULL DEFAULT 1,
    last_scraped TEXT,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sources_active ON news_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_sources_slug ON news_sources(slug);

INSERT OR IGNORE INTO news_sources
    (slug, name_ar, name_latin, base_url, rss_feeds, language, accent_color, reliability) VALUES
    ('el-khabar',    'الخبر',         'El Khabar',    'https://www.elkhabar.com',
     '["https://www.elkhabar.com/feed/"]', 'ar', '#c0392b', 90),
    ('echourouk',    'الشروق',        'Echourouk',    'https://www.echoroukonline.com',
     '["https://www.echoroukonline.com/feed/"]', 'ar', '#e74c3c', 85),
    ('aps',          'وأج',           'APS',          'https://www.aps.dz',
     '["https://www.aps.dz/ar/feed/"]', 'ar', '#1abc9c', 95),
    ('ennahar',      'النهار',        'Ennahar',      'https://www.ennaharonline.com',
     '["https://www.ennaharonline.com/feed/"]', 'ar', '#16a085', 83),
    ('algerie360',   'الجزائر 360',   'Algérie 360',  'https://www.algerie360.com',
     '["https://www.algerie360.com/feed/"]', 'ar', '#f39c12', 80),
    ('tsa-algerie',  'TSA الجزائر',   'TSA Algérie',  'https://www.tsa-algerie.com',
     '["https://www.tsa-algerie.com/feed/"]', 'fr', '#27ae60', 87);

CREATE TABLE IF NOT EXISTS news_clusters (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    slug            TEXT    NOT NULL UNIQUE,
    category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    priority        INTEGER NOT NULL DEFAULT 50,
    is_breaking     INTEGER NOT NULL DEFAULT 0,
    title_ar        TEXT    NOT NULL,
    lead_ar         TEXT,
    summary_points  TEXT    NOT NULL DEFAULT '[]',
    embedding       TEXT,
    seo_description TEXT,
    json_ld         TEXT,
    hero_image_url  TEXT,
    hero_image_alt  TEXT,
    source_count    INTEGER NOT NULL DEFAULT 1,
    sources_json    TEXT    NOT NULL DEFAULT '[]',
    first_seen_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    last_updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
    event_date      TEXT,
    is_developing   INTEGER NOT NULL DEFAULT 0,
    is_archived     INTEGER NOT NULL DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS raw_articles (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id       INTEGER NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
    cluster_id      INTEGER REFERENCES news_clusters(id) ON DELETE SET NULL,
    external_url    TEXT    NOT NULL UNIQUE,
    title_raw       TEXT    NOT NULL,
    body_raw        TEXT,
    excerpt         TEXT,
    author          TEXT,
    language        TEXT    NOT NULL DEFAULT 'ar',
    image_url       TEXT,
    image_alt       TEXT,
    embedding       TEXT,
    is_processed    INTEGER NOT NULL DEFAULT 0,
    processing_log  TEXT,
    published_at    TEXT,
    scraped_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_articles_source    ON raw_articles(source_id);
CREATE INDEX IF NOT EXISTS idx_articles_cluster   ON raw_articles(cluster_id);
CREATE INDEX IF NOT EXISTS idx_articles_processed ON raw_articles(is_processed, scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_url       ON raw_articles(external_url);
CREATE INDEX IF NOT EXISTS idx_articles_published ON raw_articles(published_at DESC);

CREATE TABLE IF NOT EXISTS cluster_timelines (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    cluster_id      INTEGER NOT NULL REFERENCES news_clusters(id) ON DELETE CASCADE,
    entry_text_ar   TEXT    NOT NULL,
    entry_type      TEXT    NOT NULL DEFAULT 'update',
    source_slug     TEXT,
    source_url      TEXT,
    event_timestamp TEXT    NOT NULL DEFAULT (datetime('now')),
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_timelines_cluster ON cluster_timelines(cluster_id, event_timestamp DESC);

CREATE TABLE IF NOT EXISTS scrape_jobs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id       INTEGER NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
    job_type        TEXT    NOT NULL DEFAULT 'rss',
    status          TEXT    NOT NULL DEFAULT 'pending',
    triggered_by    TEXT    NOT NULL DEFAULT 'cron',
    articles_found  INTEGER NOT NULL DEFAULT 0,
    articles_new    INTEGER NOT NULL DEFAULT 0,
    clusters_created INTEGER NOT NULL DEFAULT 0,
    clusters_updated INTEGER NOT NULL DEFAULT 0,
    error_message   TEXT,
    started_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    completed_at    TEXT,
    duration_ms     INTEGER
);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_source ON scrape_jobs(source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON scrape_jobs(status, started_at DESC);

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint      TEXT    NOT NULL UNIQUE,
    p256dh_key    TEXT    NOT NULL,
    auth_key      TEXT    NOT NULL,
    user_agent    TEXT,
    categories    TEXT    NOT NULL DEFAULT '["breaking"]',
    is_active     INTEGER NOT NULL DEFAULT 1,
    subscribed_at TEXT    NOT NULL DEFAULT (datetime('now')),
    last_sent_at  TEXT
);

CREATE TABLE IF NOT EXISTS saved_clusters (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    cluster_id  INTEGER NOT NULL REFERENCES news_clusters(id) ON DELETE CASCADE,
    device_id   TEXT    NOT NULL,
    saved_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(cluster_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_device ON saved_clusters(device_id, saved_at DESC);
