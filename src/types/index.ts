// =============================================================================
// El-Kholasa DZ — TypeScript Type Definitions
// =============================================================================

export interface SummaryPoint {
  point: string;
  order: number;
}

export interface SourceAttribution {
  source_slug: string;
  name_ar: string;
  name_latin: string;
  article_url: string;
  accent_color: string;
  logo_url: string | null;
  published_at: string | null;
}

export interface TimelineEntry {
  id: number;
  entry_text_ar: string;
  entry_type: 'update' | 'correction' | 'closure';
  source_slug: string | null;
  source_url: string | null;
  event_timestamp: string;
}

export interface NewsCluster {
  id: number;
  slug: string;
  title_ar: string;
  lead_ar: string | null;
  summary_points: SummaryPoint[];
  seo_description: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  is_breaking: boolean;
  is_developing: boolean;
  priority: number;
  source_count: number;
  sources: SourceAttribution[];
  timeline: TimelineEntry[];
  category: string;
  event_date: string | null;
  last_updated_at: string;
  json_ld: object | null;
  view_count: number;
}

export interface Category {
  id: number;
  slug: string;
  name_ar: string;
  name_fr: string | null;
  icon: string;
  sort_order: number;
  cluster_count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export type Theme = 'light' | 'dark';

export interface SavedArticle {
  clusterId: number;
  slug: string;
  title_ar: string;
  summary_points: SummaryPoint[];
  hero_image_url: string | null;
  seo_description: string | null;
  savedAt: string;
}

export type AudioState = 'idle' | 'playing' | 'paused';

export interface AudioPlaybackState {
  clusterId: number | null;
  state: AudioState;
}
