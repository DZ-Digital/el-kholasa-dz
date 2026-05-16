/**
 * =============================================================================
 * El-Kholasa DZ (الخلاصة الجزائرية) — Core Cloudflare Worker Engine
 * =============================================================================
 * Runtime:    Cloudflare Workers (Edge, V8 Isolates)
 * Database:   Cloudflare D1 (Edge-replicated SQLite)
 * AI Engine:  Cloudflare Workers AI
 *   - Summarization:  @cf/meta/llama-3.1-8b-instruct
 *   - Embeddings:     @cf/baai/bge-small-en-v1.5
 * Cache:      Cloudflare KV
 *
 * Pipeline Architecture:
 *   RSS Fetch → Raw Article Storage → Vector Embedding → Similarity Clustering
 *   → Duplicate Detection → AI Summarization (3-point MSA Arabic)
 *   → SEO Description (<150 chars) → JSON-LD Generation → API Response
 * =============================================================================
 */

import { Ai } from "@cloudflare/ai";

// =============================================================================
// TYPE DEFINITIONS & ENVIRONMENT BINDINGS
// =============================================================================

export interface Env {
  // Cloudflare Bindings
  DB: D1Database;
  AI: Ai;
  CACHE: KVNamespace;

  // Configuration Variables
  ENVIRONMENT: string;
  APP_NAME: string;
  APP_NAME_AR: string;
  ALLOWED_ORIGINS: string;
  CACHE_TTL_SECONDS: string;
  EMBEDDING_MODEL: string;
  SUMMARIZATION_MODEL: string;
  CLUSTER_SIMILARITY_THRESHOLD: string;
  MAX_SUMMARY_POINTS: string;
  SEO_DESC_MAX_CHARS: string;
  MAX_CLUSTERS_PER_PAGE: string;

  // Secrets (injected via wrangler secret put)
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
  INTERNAL_API_SECRET?: string;
}

interface NewsSource {
  id: number;
  slug: string;
  name_ar: string;
  name_latin: string;
  base_url: string;
  rss_feeds: string; // JSON string
  language: string;
  logo_url: string | null;
  accent_color: string;
  reliability: number;
  is_active: number;
  last_scraped: string | null;
}

interface RawArticle {
  id?: number;
  source_id: number;
  cluster_id?: number | null;
  external_url: string;
  title_raw: string;
  body_raw?: string | null;
  excerpt?: string | null;
  author?: string | null;
  language: string;
  image_url?: string | null;
  image_alt?: string | null;
  embedding?: string | null;
  is_processed?: number;
  published_at?: string | null;
}

interface NewsCluster {
  id: number;
  slug: string;
  category_id: number;
  priority: number;
  is_breaking: number;
  title_ar: string;
  lead_ar: string | null;
  summary_points: string; // JSON string
  seo_description: string | null;
  json_ld: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  source_count: number;
  sources_json: string; // JSON string
  first_seen_at: string;
  last_updated_at: string;
  event_date: string | null;
  is_developing: number;
  view_count: number;
}

interface SummaryPoint {
  point: string;
  order: number;
}

interface ParsedRssFeed {
  title: string;
  url: string;
  imageUrl?: string;
  excerpt?: string;
  publishedAt?: string;
  author?: string;
}

interface ClusterApiResponse {
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

interface SourceAttribution {
  source_slug: string;
  name_ar: string;
  name_latin: string;
  article_url: string;
  accent_color: string;
  logo_url: string | null;
  published_at: string | null;
}

interface TimelineEntry {
  id: number;
  entry_text_ar: string;
  entry_type: string;
  source_slug: string | null;
  source_url: string | null;
  event_timestamp: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ALGERIAN_NEWS_SOURCES: Array<{
  slug: string;
  nameAr: string;
  nameLatin: string;
  rssUrls: string[];
  language: string;
}> = [
  {
    slug: "el-khabar",
    nameAr: "الخبر",
    nameLatin: "El Khabar",
    rssUrls: ["https://www.elkhabar.com/feed/"],
    language: "ar",
  },
  {
    slug: "echourouk",
    nameAr: "الشروق",
    nameLatin: "Echourouk",
    rssUrls: ["https://www.echoroukonline.com/feed/"],
    language: "ar",
  },
  {
    slug: "aps",
    nameAr: "وأج",
    nameLatin: "APS",
    rssUrls: ["https://www.aps.dz/ar/feed/"],
    language: "ar",
  },
  {
    slug: "ennahar",
    nameAr: "النهار",
    nameLatin: "Ennahar",
    rssUrls: ["https://www.ennaharonline.com/feed/"],
    language: "ar",
  },
  {
    slug: "algerie360",
    nameAr: "الجزائر 360",
    nameLatin: "Algérie 360",
    rssUrls: ["https://www.algerie360.com/feed/"],
    language: "ar",
  },
  {
    slug: "tsa-algerie",
    nameAr: "TSA الجزائر",
    nameLatin: "TSA Algérie",
    rssUrls: ["https://www.tsa-algerie.com/feed/"],
    language: "fr",
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generates a URL-safe slug from Arabic or mixed text
 */
function generateSlug(text: string): string {
  const timestamp = Date.now().toString(36);
  const clean = text
    .replace(/[\u0600-\u06FF]/g, (char) =>
      char.charCodeAt(0).toString(36).padStart(2, "0")
    )
    .replace(/[^a-z0-9]/gi, "-")
    .replace(/-+/g, "-")
    .substring(0, 40)
    .toLowerCase();
  return `${clean}-${timestamp}`;
}

/**
 * Computes cosine similarity between two float vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Truncates text to a strict character limit (for SEO descriptions)
 */
function truncateToCharLimit(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const truncated = text.substring(0, limit - 3);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > limit * 0.7 ? truncated.substring(0, lastSpace) : truncated) + "...";
}

/**
 * Parses an RSS 2.0 / Atom feed XML string and extracts article items
 * Handles both Arabic and French Algerian news feed formats
 */
function parseRssFeed(xmlText: string, sourceUrl: string): ParsedRssFeed[] {
  const items: ParsedRssFeed[] = [];

  // Match <item> or <entry> blocks (RSS 2.0 and Atom)
  const itemRegex = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const block = match[1];

    // Extract title — strip CDATA
    const titleMatch =
      block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";
    if (!title) continue;

    // Extract link
    const linkMatch =
      block.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i) ||
      block.match(/<link[^>]+href="([^"]+)"/i);
    const url = linkMatch ? linkMatch[1].trim() : sourceUrl;

    // Extract description/summary
    const descMatch =
      block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) ||
      block.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i);
    const rawExcerpt = descMatch ? descMatch[1].trim() : "";
    // Strip HTML tags from excerpt
    const excerpt = rawExcerpt
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 500);

    // Extract publication date
    const dateMatch =
      block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ||
      block.match(/<published[^>]*>([\s\S]*?)<\/published>/i) ||
      block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i);
    let publishedAt: string | undefined;
    if (dateMatch) {
      try {
        publishedAt = new Date(dateMatch[1].trim()).toISOString();
      } catch {
        publishedAt = new Date().toISOString();
      }
    }

    // Extract image (media:content, enclosure, og:image in description)
    const imgMatch =
      block.match(/<media:content[^>]+url="([^"]+)"/i) ||
      block.match(/<enclosure[^>]+url="([^"]+)"/i) ||
      rawExcerpt.match(/<img[^>]+src="([^"]+)"/i);
    const imageUrl = imgMatch ? imgMatch[1] : undefined;

    // Extract author
    const authorMatch =
      block.match(/<dc:creator[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/dc:creator>/i) ||
      block.match(/<author[^>]*>([\s\S]*?)<\/author>/i);
    const author = authorMatch
      ? authorMatch[1].replace(/<[^>]+>/g, "").trim()
      : undefined;

    if (url && url !== sourceUrl) {
      items.push({ title, url, imageUrl, excerpt, publishedAt, author });
    }
  }

  return items;
}

/**
 * CORS headers builder for the API
 */
function buildCorsHeaders(env: Env, origin: string | null): Headers {
  const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });

  if (
    origin &&
    (allowedOrigins.includes(origin) ||
      env.ENVIRONMENT === "development" ||
      allowedOrigins.includes("*"))
  ) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type,X-Internal-Token,Authorization"
    );
    headers.set("Access-Control-Max-Age", "86400");
  }

  return headers;
}

// =============================================================================
// AI ENGINE CORE
// =============================================================================

/**
 * Generates a vector embedding for a text string using BGE-Small
 * Returns a float array representing the semantic position of the text
 */
async function generateEmbedding(
  text: string,
  env: Env
): Promise<number[] | null> {
  try {
    const result = await env.AI.run(
      "@cf/baai/bge-small-en-v1.5" as Parameters<typeof env.AI.run>[0],
      { text: [text.substring(0, 2000)] } // BGE has input limits
    );
    const data = (result as { data: number[][] }).data;
    return data?.[0] ?? null;
  } catch (err) {
    console.error("[AI:Embed] Failed to generate embedding:", err);
    return null;
  }
}

/**
 * Generates a strict 3-point Arabic summary using Llama-3.1-8B
 * Output is Modern Standard Arabic (فصحى مبسطة)
 * Each point is a concise, factual bullet targeting educated general readers
 */
async function generateArabicSummary(
  articles: { title: string; excerpt: string; sourceNameAr: string }[],
  env: Env
): Promise<SummaryPoint[]> {
  const articlesText = articles
    .slice(0, 5) // Limit to 5 sources for context window efficiency
    .map(
      (a, i) =>
        `المصدر ${i + 1} (${a.sourceNameAr}):\nالعنوان: ${a.title}\nالمحتوى: ${a.excerpt}`
    )
    .join("\n\n---\n\n");

  const systemPrompt = `أنت محرر أخبار متخصص في تلخيص الأخبار الجزائرية بالعربية الفصحى المبسطة. مهمتك تحليل المقالات المقدمة واستخراج ثلاث نقاط رئيسية دقيقة وموضوعية. القواعد الصارمة:
1. أكتب بالعربية الفصحى الواضحة فقط
2. كل نقطة يجب أن تكون جملة واحدة مكتملة (20-50 كلمة)
3. ركز على الحقائق الموضوعية، وتجنب التعليق أو الرأي الشخصي
4. النقاط يجب أن تكون متكاملة ومترابطة
5. أبدأ كل نقطة بـ "•"`;

  const userPrompt = `لخّص هذه المقالات الجزائرية في ثلاث نقاط رئيسية فقط:

${articlesText}

الصيغة المطلوبة (ثلاث نقاط فقط):
• [النقطة الأولى]
• [النقطة الثانية]
• [النقطة الثالثة]`;

  try {
    const result = await env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct" as Parameters<typeof env.AI.run>[0],
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 400,
        temperature: 0.3,
      }
    );

    const responseText =
      (result as { response: string }).response?.trim() ?? "";

    // Parse bullet points from response
    const pointMatches = responseText.match(/•\s*([^\n•]+)/g);
    if (!pointMatches || pointMatches.length === 0) {
      // Fallback: split by newlines and filter non-empty
      const lines = responseText
        .split("\n")
        .filter((l) => l.trim().length > 10)
        .slice(0, 3);
      return lines.map((line, i) => ({
        point: line.replace(/^[•\-\*\d\.]+\s*/, "").trim(),
        order: i + 1,
      }));
    }

    return pointMatches.slice(0, 3).map((p, i) => ({
      point: p.replace(/^•\s*/, "").trim(),
      order: i + 1,
    }));
  } catch (err) {
    console.error("[AI:Summarize] Failed to generate summary:", err);
    // Graceful degradation: use first article title + excerpt
    return articles.slice(0, 3).map((a, i) => ({
      point: a.excerpt
        ? a.excerpt.substring(0, 150)
        : a.title,
      order: i + 1,
    }));
  }
}

/**
 * Generates a strict ≤150 character SEO meta description in Arabic
 * Designed for optimal search engine snippet display
 */
async function generateSeoDescription(
  clusterTitle: string,
  summaryPoints: SummaryPoint[],
  env: Env
): Promise<string> {
  const summaryText = summaryPoints.map((p) => p.point).join(" | ");

  const prompt = `اكتب وصفاً موجزاً دقيقاً لمقال إخباري جزائري في جملة واحدة فقط، لا تتجاوز 140 حرفاً عربياً. يجب أن يكون الوصف مفيداً لمحركات البحث وجذاباً للقراء.

عنوان المقال: ${clusterTitle}
الملخص: ${summaryText}

الوصف (جملة واحدة فقط، أقل من 140 حرفاً):`;

  try {
    const result = await env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct" as Parameters<typeof env.AI.run>[0],
      {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.2,
      }
    );
    const raw =
      (result as { response: string }).response?.trim().split("\n")[0] ?? "";
    return truncateToCharLimit(raw, 150);
  } catch {
    // Fallback: construct from title + first summary point
    const fallback = `${clusterTitle}: ${summaryPoints[0]?.point ?? ""}`;
    return truncateToCharLimit(fallback, 150);
  }
}

/**
 * Builds a NewsArticle JSON-LD structured data object
 * Compliant with Schema.org NewsArticle spec for pristine SEO crawler ingestion
 */
function buildJsonLd(cluster: {
  title_ar: string;
  seo_description: string;
  hero_image_url: string | null;
  first_seen_at: string;
  last_updated_at: string;
  slug: string;
  sources: SourceAttribution[];
  summary_points: SummaryPoint[];
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `https://elkholasa.dz/cluster/${cluster.slug}`,
    headline: cluster.title_ar,
    description: cluster.seo_description,
    inLanguage: "ar",
    datePublished: cluster.first_seen_at,
    dateModified: cluster.last_updated_at,
    url: `https://elkholasa.dz/cluster/${cluster.slug}`,
    image: cluster.hero_image_url
      ? {
          "@type": "ImageObject",
          url: cluster.hero_image_url,
          width: 1200,
          height: 800,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "الخلاصة الجزائرية",
      alternateName: "El-Kholasa DZ",
      url: "https://elkholasa.dz",
      logo: {
        "@type": "ImageObject",
        url: "https://elkholasa.dz/logo.png",
        width: 192,
        height: 192,
      },
    },
    author: cluster.sources.slice(0, 3).map((s) => ({
      "@type": "Organization",
      name: s.name_ar,
      alternateName: s.name_latin,
      url: s.article_url,
    })),
    articleBody: cluster.summary_points.map((p) => `• ${p.point}`).join("\n"),
    keywords: "الجزائر، أخبار، الخلاصة الجزائرية",
    isAccessibleForFree: true,
    hasPart: cluster.sources.map((s) => ({
      "@type": "NewsArticle",
      url: s.article_url,
      datePublished: s.published_at,
      publisher: {
        "@type": "Organization",
        name: s.name_ar,
      },
    })),
  };
}

// =============================================================================
// SCRAPING & PROCESSING PIPELINE
// =============================================================================

/**
 * Fetches and parses RSS feeds for a given source
 * Returns normalized article objects ready for embedding
 */
async function scrapeFeedForSource(
  source: NewsSource,
  env: Env
): Promise<ParsedRssFeed[]> {
  const feedUrls: string[] = JSON.parse(source.rss_feeds);
  const allItems: ParsedRssFeed[] = [];

  for (const feedUrl of feedUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const response = await fetch(feedUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ElKholasaBot/1.0; +https://elkholasa.dz/bot)",
          Accept: "application/rss+xml, application/xml, text/xml, */*",
          "Accept-Language": "ar,fr;q=0.9,en;q=0.7",
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(
          `[Scrape] ${source.slug} → ${feedUrl}: HTTP ${response.status}`
        );
        continue;
      }

      const xmlText = await response.text();
      const items = parseRssFeed(xmlText, source.base_url);
      allItems.push(...items);
      console.log(`[Scrape] ${source.slug} → ${items.length} items parsed`);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        console.warn(`[Scrape] ${source.slug} timed out for ${feedUrl}`);
      } else {
        console.error(`[Scrape] ${source.slug} feed error:`, err);
      }
    }
  }

  return allItems;
}

/**
 * Core clustering engine: finds if a new article belongs to an existing cluster
 * Uses cosine similarity on BGE embeddings to detect semantic duplicates
 * Threshold is configurable via CLUSTER_SIMILARITY_THRESHOLD env var
 */
async function findSimilarCluster(
  articleEmbedding: number[],
  env: Env
): Promise<number | null> {
  const threshold = parseFloat(
    env.CLUSTER_SIMILARITY_THRESHOLD || "0.82"
  );

  // Fetch recent cluster embeddings for comparison (last 48h window)
  const { results } = await env.DB.prepare(`
    SELECT id, embedding 
    FROM news_clusters 
    WHERE embedding IS NOT NULL 
      AND is_archived = 0
      AND datetime(last_updated_at) >= datetime('now', '-48 hours')
    ORDER BY last_updated_at DESC
    LIMIT 100
  `).all<{ id: number; embedding: string }>();

  let bestMatch: { id: number; score: number } | null = null;

  for (const cluster of results) {
    try {
      const clusterEmbedding: number[] = JSON.parse(cluster.embedding);
      const similarity = cosineSimilarity(articleEmbedding, clusterEmbedding);
      if (
        similarity >= threshold &&
        (!bestMatch || similarity > bestMatch.score)
      ) {
        bestMatch = { id: cluster.id, score: similarity };
      }
    } catch {
      continue;
    }
  }

  if (bestMatch) {
    console.log(
      `[Cluster] Match found: cluster_id=${bestMatch.id} score=${bestMatch.score.toFixed(3)}`
    );
  }

  return bestMatch?.id ?? null;
}

/**
 * The main article ingestion pipeline:
 *   1. Check URL uniqueness (dedup at article level)
 *   2. Generate vector embedding
 *   3. Find similar existing cluster OR create new one
 *   4. Store raw article and link to cluster
 *   5. Trigger AI summarization and SEO generation for new clusters
 *   6. Update cluster timeline for evolving stories
 */
async function ingestArticle(
  article: ParsedRssFeed,
  source: NewsSource,
  env: Env
): Promise<{ action: "created" | "clustered" | "duplicate" | "error" }> {
  try {
    // Step 1: Check if URL already exists in our database
    const existing = await env.DB.prepare(
      "SELECT id, cluster_id FROM raw_articles WHERE external_url = ?"
    )
      .bind(article.url)
      .first<{ id: number; cluster_id: number | null }>();

    if (existing) {
      return { action: "duplicate" };
    }

    // Step 2: Generate embedding for semantic comparison
    const embeddingText = `${article.title} ${article.excerpt ?? ""}`;
    const embedding = await generateEmbedding(embeddingText, env);

    // Step 3: Find existing similar cluster
    let clusterId: number | null = null;
    let action: "created" | "clustered" = "created";

    if (embedding) {
      clusterId = await findSimilarCluster(embedding, env);
    }

    if (clusterId) {
      // Article belongs to an existing cluster — append to timeline
      action = "clustered";

      // Insert timeline entry for the story development
      await env.DB.prepare(`
        INSERT INTO cluster_timelines (cluster_id, entry_text_ar, entry_type, source_slug, source_url, event_timestamp)
        VALUES (?, ?, 'update', ?, ?, ?)
      `)
        .bind(
          clusterId,
          article.title,
          source.slug,
          article.url,
          article.publishedAt ?? new Date().toISOString()
        )
        .run();

      // Update cluster's last_updated_at, source count, and mark as developing
      await env.DB.prepare(`
        UPDATE news_clusters 
        SET 
          last_updated_at = datetime('now'),
          source_count = source_count + 1,
          is_developing = 1,
          sources_json = json_set(
            COALESCE(sources_json, '[]'),
            '$[' || json_array_length(COALESCE(sources_json, '[]')) || ']',
            ?
          )
        WHERE id = ?
      `)
        .bind(source.slug, clusterId)
        .run();
    } else {
      // Step 4: Create a new cluster for this article
      const slug = generateSlug(article.title);

      // Determine category (simplified — production would use AI classification)
      const categoryId = await inferCategory(article.title, env);

      // Generate initial AI summary with available data
      const summaryPoints = await generateArabicSummary(
        [
          {
            title: article.title,
            excerpt: article.excerpt ?? "",
            sourceNameAr: source.name_ar,
          },
        ],
        env
      );

      const seoDescription = await generateSeoDescription(
        article.title,
        summaryPoints,
        env
      );

      const sourcesJson = JSON.stringify([source.slug]);

      const clusterResult = await env.DB.prepare(`
        INSERT INTO news_clusters (
          slug, category_id, priority, is_breaking, title_ar, lead_ar,
          summary_points, seo_description, hero_image_url, hero_image_alt,
          source_count, sources_json, event_date, embedding,
          first_seen_at, last_updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, datetime('now'), datetime('now'))
      `)
        .bind(
          slug,
          categoryId,
          60, // Default priority; adjusted by engagement signals
          0, // Not breaking by default
          article.title,
          article.excerpt ?? null,
          JSON.stringify(summaryPoints),
          seoDescription,
          article.imageUrl ?? null,
          article.title ?? null,
          sourcesJson,
          article.publishedAt ? article.publishedAt.substring(0, 10) : null,
          embedding ? JSON.stringify(embedding) : null
        )
        .run();

      clusterId = clusterResult.meta.last_row_id as number;

      // Generate and store JSON-LD
      const jsonLd = buildJsonLd({
        title_ar: article.title,
        seo_description: seoDescription,
        hero_image_url: article.imageUrl ?? null,
        first_seen_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
        slug,
        sources: [
          {
            source_slug: source.slug,
            name_ar: source.name_ar,
            name_latin: source.name_latin,
            article_url: article.url,
            accent_color: source.accent_color,
            logo_url: source.logo_url,
            published_at: article.publishedAt ?? null,
          },
        ],
        summary_points: summaryPoints,
      });

      await env.DB.prepare(
        "UPDATE news_clusters SET json_ld = ? WHERE id = ?"
      )
        .bind(JSON.stringify(jsonLd), clusterId)
        .run();
    }

    // Step 5: Store raw article linked to cluster
    await env.DB.prepare(`
      INSERT INTO raw_articles (
        source_id, cluster_id, external_url, title_raw, excerpt,
        author, language, image_url, embedding, is_processed, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `)
      .bind(
        source.id,
        clusterId,
        article.url,
        article.title,
        article.excerpt ?? null,
        article.author ?? null,
        source.language,
        article.imageUrl ?? null,
        embedding ? JSON.stringify(embedding) : null,
        article.publishedAt ?? null
      )
      .run();

    // Update source's last_scraped timestamp
    await env.DB.prepare(
      "UPDATE news_sources SET last_scraped = datetime('now') WHERE id = ?"
    )
      .bind(source.id)
      .run();

    return { action };
  } catch (err) {
    console.error("[Ingest] Article ingestion error:", err);
    return { action: "error" };
  }
}

/**
 * Infers a category for an article based on keyword matching
 * In production, this would use Workers AI text classification
 */
async function inferCategory(title: string, env: Env): Promise<number> {
  const lower = title.toLowerCase();

  const keywords: Record<number, string[]> = {
    1: ["عاجل", "breaking", "urgent", "عاجلاً"], // breaking
    2: ["رئيس", "حكومة", "وزير", "برلمان", "سياس", "انتخاب", "أحزاب"], // politics
    3: ["اقتصاد", "بورصة", "دينار", "نفط", "تضخم", "ميزانية", "صادرات"], // economy
    5: ["أمن", "شرطة", "جريمة", "قضاء", "محكمة", "إرهاب"], // security
    6: ["كرة", "رياض", "مباراة", "بطولة", "ملعب", "فريق"], // sports
    7: ["ثقافة", "فن", "سينما", "مهرجان", "موسيقى", "أدب"], // culture
    8: ["تكنولوجيا", "ذكاء اصطناعي", "رقمي", "إنترنت", "تطبيق"], // technology
    9: ["صحة", "مستشفى", "طب", "مرض", "علاج", "دواء"], // health
    10: ["دولي", "عالمي", "أمريكا", "فرنسا", "أوروبا", "الأمم المتحدة"], // world
    11: ["طاقة", "كهرباء", "غاز", "سونطراك", "بترول"], // energy
    12: ["تعليم", "مدرسة", "جامعة", "بكالوريا", "طالب"], // education
  };

  for (const [catId, words] of Object.entries(keywords)) {
    if (words.some((w) => lower.includes(w))) {
      return parseInt(catId);
    }
  }

  return 4; // Default: society
}

// =============================================================================
// MAIN AGGREGATION PIPELINE (Cron Handler)
// =============================================================================

/**
 * Executes the full news aggregation cycle:
 *   - Iterates all active sources
 *   - Fetches and parses RSS feeds
 *   - Ingests articles through the AI pipeline
 *   - Logs job statistics to scrape_jobs table
 */
async function runAggregationCycle(env: Env): Promise<void> {
  console.log("[Pipeline] Starting aggregation cycle...");
  const cycleStart = Date.now();

  const { results: sources } = await env.DB.prepare(
    "SELECT * FROM news_sources WHERE is_active = 1"
  ).all<NewsSource>();

  let totalCreated = 0;
  let totalClustered = 0;
  let totalDuplicates = 0;
  let totalErrors = 0;

  for (const source of sources) {
    const jobStart = Date.now();
    let jobStatus = "success";
    let jobError: string | undefined;

    try {
      const items = await scrapeFeedForSource(source, env);
      let srcCreated = 0,
        srcClustered = 0;

      for (const item of items) {
        const result = await ingestArticle(item, source, env);
        if (result.action === "created") { srcCreated++; totalCreated++; }
        else if (result.action === "clustered") { srcClustered++; totalClustered++; }
        else if (result.action === "duplicate") totalDuplicates++;
        else totalErrors++;
      }

      await env.DB.prepare(`
        INSERT INTO scrape_jobs 
          (source_id, job_type, status, triggered_by, articles_found, articles_new, 
           clusters_created, clusters_updated, started_at, completed_at, duration_ms)
        VALUES (?, 'rss', ?, 'cron', ?, ?, ?, ?, datetime('now'), datetime('now'), ?)
      `)
        .bind(
          source.id,
          jobStatus,
          items.length,
          srcCreated + srcClustered,
          srcCreated,
          srcClustered,
          Date.now() - jobStart
        )
        .run();
    } catch (err) {
      jobStatus = "error";
      jobError = (err as Error).message;
      console.error(`[Pipeline] Source ${source.slug} failed:`, err);

      await env.DB.prepare(`
        INSERT INTO scrape_jobs 
          (source_id, job_type, status, triggered_by, error_message, started_at, completed_at, duration_ms)
        VALUES (?, 'rss', 'error', 'cron', ?, datetime('now'), datetime('now'), ?)
      `)
        .bind(source.id, jobError, Date.now() - jobStart)
        .run();
    }
  }

  const duration = Date.now() - cycleStart;
  console.log(
    `[Pipeline] Cycle complete in ${duration}ms: ` +
    `+${totalCreated} clusters, +${totalClustered} clustered, ` +
    `${totalDuplicates} dupes, ${totalErrors} errors`
  );

  // Invalidate API cache after new data
  try {
    await env.CACHE.delete("clusters:latest");
    await env.CACHE.delete("clusters:breaking");
    await env.CACHE.delete("categories:all");
  } catch {
    // Cache invalidation failure is non-critical
  }
}

// =============================================================================
// API ROUTE HANDLERS
// =============================================================================

/**
 * GET /api/v1/clusters
 * Returns paginated news clusters with full source attribution
 * Supports filtering by category, breaking status, and priority
 */
async function handleGetClusters(
  request: Request,
  env: Env,
  corsHeaders: Headers
): Promise<Response> {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 50);
  const offset = parseInt(url.searchParams.get("offset") ?? "0");
  const category = url.searchParams.get("category");
  const breakingOnly = url.searchParams.get("breaking") === "1";

  const cacheKey = `clusters:${category ?? "all"}:${limit}:${offset}:${breakingOnly}`;

  // Check KV cache first
  const cached = await env.CACHE.get(cacheKey, "text");
  if (cached) {
    const headers = new Headers(corsHeaders);
    headers.set("X-Cache", "HIT");
    return new Response(cached, { headers });
  }

  // Build dynamic SQL query
  let where = "WHERE c.is_archived = 0";
  const bindings: (string | number)[] = [];

  if (category) {
    where += " AND cat.slug = ?";
    bindings.push(category);
  }
  if (breakingOnly) {
    where += " AND c.is_breaking = 1";
  }

  const { results: clusters } = await env.DB.prepare(`
    SELECT 
      c.id, c.slug, c.title_ar, c.lead_ar, c.summary_points, c.seo_description,
      c.hero_image_url, c.hero_image_alt, c.is_breaking, c.is_developing,
      c.priority, c.source_count, c.sources_json, c.event_date, c.last_updated_at,
      c.first_seen_at, c.json_ld, c.view_count,
      cat.slug AS category_slug, cat.name_ar AS category_name_ar
    FROM news_clusters c
    JOIN categories cat ON c.category_id = cat.id
    ${where}
    ORDER BY c.is_breaking DESC, c.priority ASC, c.last_updated_at DESC
    LIMIT ? OFFSET ?
  `)
    .bind(...bindings, limit, offset)
    .all<NewsCluster & { category_slug: string; category_name_ar: string }>();

  // Enrich each cluster with full source attribution
  const enriched: ClusterApiResponse[] = [];

  for (const cluster of clusters) {
    // Fetch raw article sources for this cluster
    const { results: rawArticles } = await env.DB.prepare(`
      SELECT 
        ns.slug AS source_slug, ns.name_ar, ns.name_latin, ns.accent_color, ns.logo_url,
        ra.external_url AS article_url, ra.published_at
      FROM raw_articles ra
      JOIN news_sources ns ON ra.source_id = ns.id
      WHERE ra.cluster_id = ?
      ORDER BY ra.published_at ASC
    `)
      .bind(cluster.id)
      .all<SourceAttribution>();

    // Fetch timeline entries
    const { results: timeline } = await env.DB.prepare(`
      SELECT id, entry_text_ar, entry_type, source_slug, source_url, event_timestamp
      FROM cluster_timelines
      WHERE cluster_id = ?
      ORDER BY event_timestamp ASC
      LIMIT 20
    `)
      .bind(cluster.id)
      .all<TimelineEntry>();

    let summaryPoints: SummaryPoint[] = [];
    try {
      summaryPoints = JSON.parse(cluster.summary_points);
    } catch { summaryPoints = []; }

    let jsonLd = null;
    try {
      jsonLd = cluster.json_ld ? JSON.parse(cluster.json_ld) : null;
    } catch { jsonLd = null; }

    // Increment view count asynchronously (fire and forget)
    env.DB.prepare("UPDATE news_clusters SET view_count = view_count + 1 WHERE id = ?")
      .bind(cluster.id)
      .run()
      .catch(() => {});

    enriched.push({
      id: cluster.id,
      slug: cluster.slug,
      title_ar: cluster.title_ar,
      lead_ar: cluster.lead_ar,
      summary_points: summaryPoints,
      seo_description: cluster.seo_description,
      hero_image_url: cluster.hero_image_url,
      hero_image_alt: cluster.hero_image_alt,
      is_breaking: Boolean(cluster.is_breaking),
      is_developing: Boolean(cluster.is_developing),
      priority: cluster.priority,
      source_count: cluster.source_count,
      sources: rawArticles.results ?? [],
      timeline: timeline.results ?? [],
      category: (cluster as NewsCluster & { category_slug: string }).category_slug,
      event_date: cluster.event_date,
      last_updated_at: cluster.last_updated_at,
      json_ld: jsonLd,
      view_count: cluster.view_count,
    });
  }

  const responseBody = JSON.stringify({
    success: true,
    data: enriched,
    meta: {
      total: enriched.length,
      limit,
      offset,
      has_more: enriched.length === limit,
    },
  });

  // Cache in KV for 5 minutes
  await env.CACHE.put(cacheKey, responseBody, {
    expirationTtl: parseInt(env.CACHE_TTL_SECONDS || "300"),
  });

  const headers = new Headers(corsHeaders);
  headers.set("X-Cache", "MISS");
  headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
  return new Response(responseBody, { headers });
}

/**
 * GET /api/v1/clusters/:slug
 * Returns a single cluster by slug with full enrichment
 */
async function handleGetCluster(
  slug: string,
  env: Env,
  corsHeaders: Headers
): Promise<Response> {
  const cluster = await env.DB.prepare(`
    SELECT 
      c.*, cat.slug AS category_slug, cat.name_ar AS category_name_ar
    FROM news_clusters c
    JOIN categories cat ON c.category_id = cat.id
    WHERE c.slug = ? AND c.is_archived = 0
  `)
    .bind(slug)
    .first<NewsCluster & { category_slug: string }>();

  if (!cluster) {
    return new Response(JSON.stringify({ success: false, error: "Cluster not found" }), {
      status: 404,
      headers: corsHeaders,
    });
  }

  const { results: sources } = await env.DB.prepare(`
    SELECT ns.slug AS source_slug, ns.name_ar, ns.name_latin, ns.accent_color, ns.logo_url,
           ra.external_url AS article_url, ra.published_at
    FROM raw_articles ra
    JOIN news_sources ns ON ra.source_id = ns.id
    WHERE ra.cluster_id = ?
    ORDER BY ra.published_at ASC
  `)
    .bind(cluster.id)
    .all<SourceAttribution>();

  const { results: timeline } = await env.DB.prepare(`
    SELECT id, entry_text_ar, entry_type, source_slug, source_url, event_timestamp
    FROM cluster_timelines WHERE cluster_id = ?
    ORDER BY event_timestamp ASC
  `)
    .bind(cluster.id)
    .all<TimelineEntry>();

  let summaryPoints: SummaryPoint[] = [];
  try { summaryPoints = JSON.parse(cluster.summary_points); } catch { summaryPoints = []; }
  let jsonLd = null;
  try { jsonLd = cluster.json_ld ? JSON.parse(cluster.json_ld) : null; } catch { jsonLd = null; }

  const response: ClusterApiResponse = {
    id: cluster.id,
    slug: cluster.slug,
    title_ar: cluster.title_ar,
    lead_ar: cluster.lead_ar,
    summary_points: summaryPoints,
    seo_description: cluster.seo_description,
    hero_image_url: cluster.hero_image_url,
    hero_image_alt: cluster.hero_image_alt,
    is_breaking: Boolean(cluster.is_breaking),
    is_developing: Boolean(cluster.is_developing),
    priority: cluster.priority,
    source_count: cluster.source_count,
    sources: sources.results ?? [],
    timeline: timeline.results ?? [],
    category: cluster.category_slug,
    event_date: cluster.event_date,
    last_updated_at: cluster.last_updated_at,
    json_ld: jsonLd,
    view_count: cluster.view_count,
  };

  return new Response(JSON.stringify({ success: true, data: response }), {
    headers: corsHeaders,
  });
}

/**
 * GET /api/v1/categories
 * Returns all active categories with cluster counts
 */
async function handleGetCategories(
  env: Env,
  corsHeaders: Headers
): Promise<Response> {
  const cached = await env.CACHE.get("categories:all", "text");
  if (cached) {
    const headers = new Headers(corsHeaders);
    headers.set("X-Cache", "HIT");
    return new Response(cached, { headers });
  }

  const { results } = await env.DB.prepare(`
    SELECT 
      c.id, c.slug, c.name_ar, c.name_fr, c.icon, c.sort_order,
      COUNT(nc.id) AS cluster_count
    FROM categories c
    LEFT JOIN news_clusters nc ON nc.category_id = c.id AND nc.is_archived = 0
    WHERE c.is_active = 1
    GROUP BY c.id
    ORDER BY c.sort_order ASC
  `).all();

  const body = JSON.stringify({ success: true, data: results });
  await env.CACHE.put("categories:all", body, { expirationTtl: 900 });

  return new Response(body, { headers: corsHeaders });
}

/**
 * POST /api/v1/push/subscribe
 * Registers a device push subscription for breaking news notifications
 */
async function handlePushSubscribe(
  request: Request,
  env: Env,
  corsHeaders: Headers
): Promise<Response> {
  try {
    const body = await request.json() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      categories?: string[];
    };

    await env.DB.prepare(`
      INSERT INTO push_subscriptions (endpoint, p256dh_key, auth_key, categories)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        p256dh_key = excluded.p256dh_key,
        auth_key = excluded.auth_key,
        categories = excluded.categories,
        is_active = 1
    `)
      .bind(
        body.endpoint,
        body.keys.p256dh,
        body.keys.auth,
        JSON.stringify(body.categories ?? ["breaking"])
      )
      .run();

    return new Response(JSON.stringify({ success: true, message: "اشتراك ناجح" }), {
      status: 201,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Subscription failed" }),
      { status: 400, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/v1/trigger-scrape (Internal — requires INTERNAL_API_SECRET)
 * Manually triggers the full aggregation cycle
 */
async function handleManualTrigger(
  request: Request,
  env: Env,
  corsHeaders: Headers
): Promise<Response> {
  const token = request.headers.get("X-Internal-Token");
  if (!token || token !== env.INTERNAL_API_SECRET) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  // Run pipeline asynchronously (don't wait for it to complete)
  // In production, use Cloudflare Queues or Durable Objects for this
  Promise.resolve().then(() => runAggregationCycle(env)).catch(console.error);

  return new Response(
    JSON.stringify({ success: true, message: "Pipeline triggered" }),
    { headers: corsHeaders }
  );
}

/**
 * GET /health
 * Returns Worker health status and D1 connectivity check
 */
async function handleHealth(env: Env, corsHeaders: Headers): Promise<Response> {
  const startTime = Date.now();
  let dbStatus = "ok";
  let clusterCount = 0;

  try {
    const result = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM news_clusters WHERE is_archived = 0"
    ).first<{ count: number }>();
    clusterCount = result?.count ?? 0;
  } catch (err) {
    dbStatus = "error";
  }

  return new Response(
    JSON.stringify({
      status: "healthy",
      version: "1.0.0",
      environment: env.ENVIRONMENT,
      db: dbStatus,
      cluster_count: clusterCount,
      latency_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }),
    { headers: corsHeaders }
  );
}

// =============================================================================
// MAIN WORKER EXPORT
// =============================================================================

export default {
  /**
   * HTTP Request Handler
   * Routes incoming requests to the appropriate API handler
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const corsHeaders = buildCorsHeaders(env, origin);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Route table
    const path = url.pathname.replace(/\/$/, ""); // Normalize trailing slash

    try {
      // Health check
      if (path === "/health") {
        return await handleHealth(env, corsHeaders);
      }

      // News Clusters
      if (path === "/api/v1/clusters" && request.method === "GET") {
        return await handleGetClusters(request, env, corsHeaders);
      }

      // Single Cluster by slug
      const clusterMatch = path.match(/^\/api\/v1\/clusters\/([a-z0-9-]+)$/);
      if (clusterMatch && request.method === "GET") {
        return await handleGetCluster(clusterMatch[1], env, corsHeaders);
      }

      // Categories
      if (path === "/api/v1/categories" && request.method === "GET") {
        return await handleGetCategories(env, corsHeaders);
      }

      // Push subscription
      if (path === "/api/v1/push/subscribe" && request.method === "POST") {
        return await handlePushSubscribe(request, env, corsHeaders);
      }

      // Manual pipeline trigger (internal)
      if (path === "/api/v1/trigger-scrape" && request.method === "POST") {
        return await handleManualTrigger(request, env, corsHeaders);
      }

      // 404 for unknown routes
      return new Response(
        JSON.stringify({ success: false, error: "Route not found", path }),
        { status: 404, headers: corsHeaders }
      );
    } catch (err) {
      console.error("[Worker] Unhandled error:", err);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Internal server error",
          message: env.ENVIRONMENT === "development" ? (err as Error).message : undefined,
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  },

  /**
   * Scheduled Cron Handler
   * Executes the aggregation pipeline on defined cron intervals
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const cron = event.cron;
    console.log(`[Cron] Triggered: ${cron}`);

    ctx.waitUntil(
      (async () => {
        try {
          if (cron === "0 * * * *" || cron === "*/15 * * * *") {
            // Main aggregation cycle or breaking news scan
            await runAggregationCycle(env);
          } else if (cron === "0 2 * * *") {
            // Daily: Archive clusters older than 30 days
            await env.DB.prepare(`
              UPDATE news_clusters 
              SET is_archived = 1 
              WHERE datetime(last_updated_at) < datetime('now', '-30 days')
                AND is_archived = 0
            `).run();

            // Cleanup raw articles for archived clusters
            await env.DB.prepare(`
              DELETE FROM raw_articles
              WHERE cluster_id IN (
                SELECT id FROM news_clusters WHERE is_archived = 1
              )
              AND datetime(created_at) < datetime('now', '-7 days')
            `).run();

            console.log("[Cron:Daily] Archive + cleanup complete");
          } else if (cron === "30 3 * * 0") {
            // Weekly: Re-generate summaries for developing stories
            const { results: developing } = await env.DB.prepare(`
              SELECT nc.*, GROUP_CONCAT(ra.title_raw, '||') AS all_titles,
                     GROUP_CONCAT(ra.excerpt, '||') AS all_excerpts,
                     GROUP_CONCAT(ns.name_ar, '||') AS all_sources
              FROM news_clusters nc
              JOIN raw_articles ra ON ra.cluster_id = nc.id
              JOIN news_sources ns ON ra.source_id = ns.id
              WHERE nc.is_developing = 1 AND nc.is_archived = 0
              GROUP BY nc.id
              LIMIT 50
            `).all<NewsCluster & { all_titles: string; all_excerpts: string; all_sources: string }>();

            for (const cluster of developing) {
              const articles = cluster.all_titles.split("||").slice(0, 5).map((t, i) => ({
                title: t,
                excerpt: (cluster.all_excerpts ?? "").split("||")[i] ?? "",
                sourceNameAr: (cluster.all_sources ?? "").split("||")[i] ?? "مصدر",
              }));

              const newSummary = await generateArabicSummary(articles, env);
              const newSeo = await generateSeoDescription(cluster.title_ar, newSummary, env);

              await env.DB.prepare(
                "UPDATE news_clusters SET summary_points = ?, seo_description = ? WHERE id = ?"
              )
                .bind(JSON.stringify(newSummary), newSeo, cluster.id)
                .run();
            }

            console.log(`[Cron:Weekly] Re-summarized ${developing.length} developing stories`);
          }
        } catch (err) {
          console.error("[Cron] Error in scheduled handler:", err);
        }
      })()
    );
  },
};
