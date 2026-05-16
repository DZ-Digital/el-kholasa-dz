/**
 * =============================================================================
 * El-Kholasa DZ (الخلاصة الجزائرية) — Main PWA Application
 * =============================================================================
 * Architecture: Single-Page Progressive Web App
 * Hosted on:    Cloudflare Pages (Edge CDN)
 * Backend API:  Cloudflare Workers + D1 + Workers AI
 *
 * Features:
 *   - Dynamic Hybrid Feed (hero + fluid grid based on priority metadata)
 *   - OLED Dark Mode (#000000 base) with Glassmorphism card surfaces
 *   - Arabic RTL typography (Cairo + IBM Plex Sans Arabic)
 *   - Strict 3:2 image aspect ratios (CLS-mitigated)
 *   - AI-generated 3-point summaries with Source Dock attribution
 *   - Inline Web Speech API TTS with animated waveform
 *   - PWA bookmarking with localStorage/IndexedDB persistence
 *   - Category filtering sidebar
 *   - Search across article titles and summaries
 *   - Offline indicator + cached content resilience
 * =============================================================================
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { CategorySidebar } from './components/CategorySidebar';
import { NewsFeed } from './components/NewsFeed';
import { SavedArticlesPanel } from './components/SavedArticlesPanel';
import { useTheme } from './hooks/useTheme';
import { useSavedArticles } from './hooks/useSavedArticles';
import { MOCK_CLUSTERS, MOCK_CATEGORIES } from './data/mockData';
import type { NewsCluster } from './types';
import { RefreshCw, Cpu, Database, Zap, CheckCircle2 } from 'lucide-react';

// In production, replace with: const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://api.elkholasa.dz';
const USE_MOCK_DATA = true;

function App() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { saved, removeArticle } = useSavedArticles();

  // ── State ─────────────────────────────────────────────────────────────────
  const [clusters, setClusters] = useState<NewsCluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedPanelOpen, setSavedPanelOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showArchBanner, setShowArchBanner] = useState(true);

  // ── Online/Offline detection ──────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Data Fetching (Mock in demo, Live API in production) ──────────────────
  const fetchClusters = useCallback(async () => {
    setIsLoading(true);
    try {
      if (USE_MOCK_DATA) {
        // Simulate network latency for realistic skeleton loading demo
        await new Promise(resolve => setTimeout(resolve, 1200));
        setClusters(MOCK_CLUSTERS);
        setLastUpdated(new Date());
      } else {
        // Production: Live Cloudflare Worker API
        const params = new URLSearchParams();
        if (activeCategory) params.set('category', activeCategory);
        params.set('limit', '20');
        const res = await fetch(`/api/v1/clusters?${params}`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setClusters(data.data ?? []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('[App] Failed to fetch clusters:', err);
      // Offline fallback: show cached data from localStorage
      const cachedRaw = localStorage.getItem('elkholasa-cache');
      if (cachedRaw) {
        try {
          setClusters(JSON.parse(cachedRaw));
        } catch { /* ignore */ }
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  // Cache clusters in localStorage for offline fallback
  useEffect(() => {
    if (clusters.length > 0) {
      try {
        localStorage.setItem('elkholasa-cache', JSON.stringify(clusters.slice(0, 20)));
      } catch { /* Storage quota */ }
    }
  }, [clusters]);

  // ── Filtered Clusters (search + category) ────────────────────────────────
  const filteredClusters = useMemo(() => {
    let result = clusters;

    if (activeCategory && !USE_MOCK_DATA) {
      // For live API, category filtering is done server-side
      result = clusters;
    } else if (activeCategory) {
      result = clusters.filter(c => c.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(c =>
        c.title_ar.includes(q) ||
        c.lead_ar?.includes(q) ||
        c.summary_points.some(p => p.point.includes(q)) ||
        c.sources.some(s => s.name_ar.includes(q))
      );
    }

    return result;
  }, [clusters, activeCategory, searchQuery]);

  // ── Page title update based on category ──────────────────────────────────
  useEffect(() => {
    const catName = MOCK_CATEGORIES.find(c => c.slug === activeCategory)?.name_ar;
    document.title = catName
      ? `${catName} | الخلاصة الجزائرية`
      : 'الخلاصة الجزائرية | El-Kholasa DZ';
  }, [activeCategory]);

  // ── Background: OLED / Light mode body styles ─────────────────────────────
  const bgStyle = isDark
    ? { background: '#000000' }
    : { background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e8f4f0 100%)' };

  // ── Architecture Badge Metrics ─────────────────────────────────────────────
  const archStats = [
    { icon: <Database size={12} />, label: 'Cloudflare D1', value: 'Edge SQLite' },
    { icon: <Cpu size={12} />, label: 'Workers AI', value: 'Llama 3.1 + BGE' },
    { icon: <Zap size={12} />, label: 'خوادم حافة', value: '300+ نقطة تواجد' },
    { icon: <CheckCircle2 size={12} />, label: 'التحديث', value: 'كل 15 دقيقة' },
  ];

  return (
    <div
      className="min-h-screen transition-colors duration-500"
      style={bgStyle}
      dir="rtl"
    >
      {/* ── Ambient glow effects (OLED dark mode only) ───────────────────── */}
      {isDark && (
        <>
          <div
            className="fixed top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(5,150,105,0.06) 0%, transparent 70%)',
              filter: 'blur(60px)',
              zIndex: 0,
            }}
          />
          <div
            className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
              filter: 'blur(80px)',
              zIndex: 0,
            }}
          />
        </>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        savedCount={saved.length}
        onShowSaved={() => setSavedPanelOpen(true)}
        isOnline={isOnline}
        onSearch={setSearchQuery}
        onToggleSidebar={() => setSidebarOpen(v => !v)}
      />

      {/* ── Layout: Sidebar + Main Feed ────────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto flex">

        {/* ── Category Sidebar ──────────────────────────────────────────── */}
        <CategorySidebar
          categories={MOCK_CATEGORIES}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          isDark={isDark}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* ── Main Content ──────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6" role="main">

          {/* ── Architecture Info Banner ───────────────────────────────── */}
          {showArchBanner && (
            <div
              className={`
                mb-6 rounded-2xl border p-4 relative
                ${isDark
                  ? 'bg-emerald-950/40 border-emerald-500/20 backdrop-blur-xl'
                  : 'bg-emerald-50 border-emerald-200'
                }
              `}
            >
              <button
                onClick={() => setShowArchBanner(false)}
                className={`absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full transition-colors ${
                  isDark ? 'text-white/30 hover:text-white/60 hover:bg-white/8' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                ✕ إخفاء
              </button>

              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-lg font-black"
                  style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
                >
                  خ
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-sm font-bold mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}
                    style={{ fontFamily: "'Cairo', sans-serif" }}
                  >
                    الخلاصة الجزائرية — هيكل المشروع المعماري
                  </h3>
                  <p
                    className={`text-xs mb-3 ${isDark ? 'text-emerald-400/60' : 'text-emerald-700/70'}`}
                    style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                  >
                    منصة تجميع وتلخيص الأخبار الجزائرية مدعومة بالذكاء الاصطناعي على حافة الإنترنت
                  </p>

                  {/* Architecture stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {archStats.map((stat, i) => (
                      <div
                        key={i}
                        className={`px-3 py-2 rounded-xl text-xs ${
                          isDark
                            ? 'bg-black/40 border border-emerald-500/15'
                            : 'bg-white border border-emerald-100'
                        }`}
                      >
                        <div className={`flex items-center gap-1.5 mb-1 ${isDark ? 'text-emerald-400/70' : 'text-emerald-600'}`}>
                          {stat.icon}
                          <span style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{stat.label}</span>
                        </div>
                        <div className={`font-bold ${isDark ? 'text-[#F5F5F7]' : 'text-gray-900'}`} style={{ fontFamily: "'Cairo', sans-serif" }}>
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Architecture tree */}
                  <div className="mt-3">
                    <ArchitectureTree isDark={isDark} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Feed Status Bar ────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {/* Active filter indicator */}
              {activeCategory && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${
                  isDark
                    ? 'bg-white/6 border-white/12 text-white/60'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}>
                  <span style={{ fontFamily: "'Cairo', sans-serif" }}>
                    {MOCK_CATEGORIES.find(c => c.slug === activeCategory)?.icon}{' '}
                    {MOCK_CATEGORIES.find(c => c.slug === activeCategory)?.name_ar}
                  </span>
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="hover:opacity-80"
                    aria-label="إلغاء الفلتر"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Search query indicator */}
              {searchQuery && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${
                  isDark
                    ? 'bg-white/6 border-white/12 text-white/60'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}>
                  <span style={{ fontFamily: "'Cairo', sans-serif" }}>بحث: "{searchQuery}"</span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:opacity-80"
                    aria-label="مسح البحث"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Results count */}
              {!isLoading && (
                <span
                  className={`text-xs ${isDark ? 'text-white/25' : 'text-gray-400'}`}
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  {filteredClusters.length} خبر
                </span>
              )}
            </div>

            {/* Refresh button + last updated */}
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span
                  className={`text-xs hidden sm:block ${isDark ? 'text-white/20' : 'text-gray-300'}`}
                  style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                >
                  آخر تحديث: {lastUpdated.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={fetchClusters}
                disabled={isLoading}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                  border transition-all duration-200
                  ${isDark
                    ? 'border-white/12 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 disabled:opacity-40'
                    : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:opacity-40'
                  }
                `}
                aria-label="تحديث الأخبار"
              >
                <RefreshCw
                  size={12}
                  className={isLoading ? 'animate-spin' : ''}
                />
                <span style={{ fontFamily: "'Cairo', sans-serif" }}>
                  {isLoading ? 'جاري التحديث...' : 'تحديث'}
                </span>
              </button>
            </div>
          </div>

          {/* ── Offline Warning ─────────────────────────────────────────── */}
          {!isOnline && (
            <div
              className={`mb-4 px-4 py-3 rounded-xl text-sm border ${
                isDark
                  ? 'bg-amber-950/40 border-amber-500/20 text-amber-400/80'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
              role="alert"
            >
              <span style={{ fontFamily: "'Cairo', sans-serif" }}>
                📡 وضع عدم الاتصال — يتم عرض المحتوى المخزن مؤقتاً
              </span>
            </div>
          )}

          {/* ── Main News Feed ──────────────────────────────────────────── */}
          <NewsFeed
            clusters={filteredClusters}
            isLoading={isLoading}
            isDark={isDark}
          />
        </main>
      </div>

      {/* ── Saved Articles Slide Panel ─────────────────────────────────── */}
      <SavedArticlesPanel
        isOpen={savedPanelOpen}
        onClose={() => setSavedPanelOpen(false)}
        saved={saved}
        onRemove={removeArticle}
        isDark={isDark}
      />

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer
        className={`relative z-10 border-t mt-12 py-8 ${
          isDark ? 'border-white/6' : 'border-gray-200'
        }`}
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black"
                style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
              >
                خ
              </div>
              <div>
                <p
                  className={`text-sm font-bold ${isDark ? 'text-[#F5F5F7]/60' : 'text-gray-600'}`}
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  الخلاصة الجزائرية
                </p>
                <p
                  className={`text-xs ${isDark ? 'text-white/25' : 'text-gray-400'}`}
                  style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                >
                  مُجمِّع الأخبار الجزائرية بالذكاء الاصطناعي
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <p
                className={`text-xs ${isDark ? 'text-white/20' : 'text-gray-300'}`}
                style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
              >
                مدعوم بـ Cloudflare Workers AI • D1 • Pages
              </p>
              <p
                className={`text-xs ${isDark ? 'text-white/15' : 'text-gray-200'}`}
                style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
              >
                © 2025 El-Kholasa DZ — جميع الحقوق محفوظة
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Architecture Tree Visualization ─────────────────────────────────────────

interface ArchTreeProps {
  isDark: boolean;
}

const ArchitectureTree: React.FC<ArchTreeProps> = ({ isDark }) => {
  const treeColor = isDark ? 'text-emerald-400/50' : 'text-emerald-600/60';
  const itemColor = isDark ? 'text-white/50' : 'text-gray-600';
  const valueColor = isDark ? 'text-emerald-300/70' : 'text-emerald-700';

  const nodes = [
    { indent: 0, label: 'elkholasa-dz/', type: 'dir' },
    { indent: 1, label: 'backend-worker/', type: 'dir' },
    { indent: 2, label: 'schema.sql', type: 'file', value: 'D1 SQLite Schema' },
    { indent: 2, label: 'wrangler.toml', type: 'file', value: 'CF Configuration' },
    { indent: 2, label: 'src/index.ts', type: 'file', value: 'Worker Engine' },
    { indent: 2, label: 'migrations/', type: 'dir' },
    { indent: 1, label: 'frontend-pwa/', type: 'dir' },
    { indent: 2, label: 'src/App.tsx', type: 'file', value: 'PWA Root' },
    { indent: 2, label: 'public/sw.js', type: 'file', value: 'Service Worker' },
    { indent: 1, label: '.github/workflows/', type: 'dir' },
    { indent: 2, label: 'deploy-backend.yml', type: 'file', value: 'CI/CD Pipeline' },
    { indent: 2, label: 'deploy-frontend.yml', type: 'file', value: 'CF Pages Deploy' },
  ];

  return (
    <div
      className={`rounded-xl p-3 font-mono text-xs overflow-x-auto ${
        isDark ? 'bg-black/60 border border-white/8' : 'bg-gray-900/5 border border-emerald-100'
      }`}
    >
      {nodes.map((node, i) => (
        <div key={i} className="flex items-center gap-1 leading-6">
          <span className={treeColor}>
            {node.indent === 0 ? '' : '│  '.repeat(node.indent - 1) + (i === nodes.length - 1 || nodes[i + 1]?.indent <= node.indent ? '└─ ' : '├─ ')}
          </span>
          <span className={node.type === 'dir' ? valueColor : itemColor}>
            {node.type === 'dir' ? '📁 ' : '📄 '}{node.label}
          </span>
          {node.value && (
            <span className={`ml-2 ${treeColor} opacity-60`}>
              # {node.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default App;
