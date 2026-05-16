/**
 * ClusterCard — The primary news display unit for El-Kholasa DZ
 *
 * Variants:
 *   - 'hero':    Full-bleed, sprawling card for breaking/high-priority stories
 *   - 'compact': Fluid grid item for secondary stories
 *
 * Features:
 *   - Strict 3:2 aspect ratio image containers (CLS-mitigated)
 *   - Glassmorphism card surfaces with OLED-safe text tokens
 *   - AI-generated 3-point summary with animated disclosure
 *   - Source Dock with branded publisher buttons
 *   - Inline TTS audio trigger with animated SVG waveform
 *   - Save/bookmark action with IndexedDB persistence
 *   - Developing story timeline display
 */

import React, { useState, useCallback } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Volume2,
  VolumeX,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Zap,
  Radio,
} from 'lucide-react';
import type { NewsCluster } from '../types';
import { SourceDock } from './SourceDock';
import { AudioWaveform } from './AudioWaveform';
import { formatDistanceToNow } from '../utils/dateUtils';
import { useAudioPlayback } from '../hooks/useAudioPlayback';
import { useSavedArticles } from '../hooks/useSavedArticles';

interface ClusterCardProps {
  cluster: NewsCluster;
  variant: 'hero' | 'compact';
  isDark: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  breaking: 'عاجل',
  politics: 'سياسة',
  economy: 'اقتصاد',
  society: 'مجتمع',
  security: 'أمن',
  sports: 'رياضة',
  culture: 'ثقافة',
  technology: 'تكنولوجيا',
  health: 'صحة',
  world: 'دولي',
  energy: 'طاقة',
  education: 'تعليم',
};

const CATEGORY_COLORS: Record<string, string> = {
  breaking: 'bg-red-500/20 text-red-400 border-red-500/30',
  politics: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  economy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  society: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  security: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  sports: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  culture: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  technology: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  health: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  world: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  energy: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  education: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
};

const CATEGORY_COLORS_LIGHT: Record<string, string> = {
  breaking: 'bg-red-100 text-red-700 border-red-200',
  politics: 'bg-blue-100 text-blue-700 border-blue-200',
  economy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  society: 'bg-purple-100 text-purple-700 border-purple-200',
  security: 'bg-orange-100 text-orange-700 border-orange-200',
  sports: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  culture: 'bg-pink-100 text-pink-700 border-pink-200',
  technology: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  health: 'bg-teal-100 text-teal-700 border-teal-200',
  world: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  energy: 'bg-amber-100 text-amber-700 border-amber-200',
  education: 'bg-violet-100 text-violet-700 border-violet-200',
};

export const ClusterCard: React.FC<ClusterCardProps> = ({ cluster, variant, isDark }) => {
  const [showSummary, setShowSummary] = useState(variant === 'hero');
  const [showTimeline, setShowTimeline] = useState(false);
  const [imgError, setImgError] = useState(false);

  const { speak, stop, isPlaying, isPaused, isActive } = useAudioPlayback();
  const { isSaved, toggleSave } = useSavedArticles();

  const saved = isSaved(cluster.id);
  const playing = isPlaying(cluster.id);
  const paused = isPaused(cluster.id);
  const active = isActive(cluster.id);

  const handleAudio = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (active && !playing) {
        // Resume or stop
        if (paused) {
          speak(cluster.id, cluster.title_ar, cluster.summary_points);
        } else {
          stop();
        }
      } else {
        speak(cluster.id, cluster.title_ar, cluster.summary_points);
      }
    },
    [active, playing, paused, speak, stop, cluster]
  );

  const handleSave = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleSave(cluster);
    },
    [toggleSave, cluster]
  );

  const handleToggleSummary = useCallback(() => {
    setShowSummary(v => !v);
  }, []);

  const audioState = playing ? 'playing' : paused ? 'paused' : 'idle';
  const catColor = isDark ? CATEGORY_COLORS[cluster.category] : CATEGORY_COLORS_LIGHT[cluster.category];
  const catLabel = CATEGORY_LABELS[cluster.category] ?? cluster.category;
  const timeAgo = formatDistanceToNow(new Date(cluster.last_updated_at));

  // ─── Card Surface Styles ─────────────────────────────────────────────────
  const cardBase = isDark
    ? `
      bg-black/60 border border-white/10
      backdrop-blur-xl
      hover:border-white/20 hover:bg-black/70
      shadow-[0_4px_32px_rgba(0,0,0,0.6)]
      hover:shadow-[0_8px_48px_rgba(0,0,0,0.8)]
    `
    : `
      bg-white/80 border border-gray-200/80
      backdrop-blur-md
      hover:border-gray-300 hover:bg-white/90
      shadow-[0_4px_24px_rgba(0,0,0,0.08)]
      hover:shadow-[0_8px_40px_rgba(0,0,0,0.14)]
    `;

  // ─── Title Styles ────────────────────────────────────────────────────────
  const titleClass = isDark
    ? 'text-[#F5F5F7]'  // Strict off-white: never #FFFFFF in dark mode
    : 'text-gray-900';

  const leadClass = isDark ? 'text-[#E5E5EA]/70' : 'text-gray-600';
  const metaClass = isDark ? 'text-white/40' : 'text-gray-400';

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <article
      className={`
        relative ${cardBase} rounded-2xl overflow-hidden
        transition-all duration-300 cursor-pointer group
        ${variant === 'hero' ? 'col-span-full' : ''}
      `}
      dir="rtl"
      onClick={handleToggleSummary}
      role="article"
      aria-label={cluster.title_ar}
    >
      {/* ── Breaking/Developing Pulse Indicator ──────────────────────── */}
      {cluster.is_breaking && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse z-10" />
      )}

      {/* ── Hero Image — Strict 3:2 Aspect Ratio ─────────────────────── */}
      {cluster.hero_image_url && !imgError && (
        <div
          className="relative overflow-hidden"
          style={{ aspectRatio: '3/2' }} // CLS-preventing explicit aspect ratio
        >
          <img
            src={cluster.hero_image_url}
            alt={cluster.hero_image_alt ?? cluster.title_ar}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading={variant === 'hero' ? 'eager' : 'lazy'}
            onError={() => setImgError(true)}
            style={{ display: 'block' }}
          />
          {/* Gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Category badge overlaid on image */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <span
              className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                border backdrop-blur-md
                ${catColor}
              `}
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              {cluster.is_breaking && (
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              )}
              {catLabel}
            </span>

            {cluster.is_developing && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold backdrop-blur-md bg-amber-500/20 text-amber-400 border border-amber-500/30"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                <Radio size={10} className="animate-pulse" />
                متطور
              </span>
            )}
          </div>

          {/* Source count badge */}
          {cluster.source_count > 1 && (
            <div className="absolute bottom-3 left-3">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-black/50 text-white/90 border border-white/10"
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                <TrendingUp size={10} />
                {cluster.source_count} مصادر
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── No Image Variant — Category Color Banner ──────────────────── */}
      {(imgError || !cluster.hero_image_url) && (
        <div className="relative" style={{ aspectRatio: '3/2' }}>
          <div
            className={`w-full h-full flex items-center justify-center ${
              isDark ? 'bg-white/5' : 'bg-gray-50'
            }`}
          >
            <div className="text-center">
              <div className="text-5xl mb-2 opacity-30">📰</div>
              <span className={`text-sm ${isDark ? 'text-white/20' : 'text-gray-300'}`}>
                الخلاصة الجزائرية
              </span>
            </div>
          </div>
          <div className="absolute top-3 right-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${catColor}`}
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              {cluster.is_breaking && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
              {catLabel}
            </span>
          </div>
        </div>
      )}

      {/* ── Card Body ─────────────────────────────────────────────────── */}
      <div className={`p-4 ${variant === 'hero' ? 'md:p-6' : 'p-4'} space-y-3`}>

        {/* ── Meta Row ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={11} className={metaClass} />
            <span
              className={`text-xs ${metaClass}`}
              style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
            >
              {timeAgo}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* TTS Audio trigger */}
            <button
              onClick={handleAudio}
              className={`
                flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold
                border transition-all duration-200 hover:scale-105 active:scale-95
                ${isDark
                  ? `border-white/15 hover:border-white/25 bg-white/5 hover:bg-white/10 ${
                      playing ? 'text-emerald-400' : 'text-white/50 hover:text-white/80'
                    }`
                  : `border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 ${
                      playing ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
                    }`
                }
              `}
              aria-label={playing ? 'إيقاف القراءة الصوتية' : 'تشغيل الملخص الصوتي'}
              title={playing ? 'إيقاف' : 'استمع للملخص'}
            >
              {active ? (
                <>
                  <AudioWaveform state={audioState} isDark={isDark} size="sm" />
                  {paused ? <VolumeX size={12} /> : null}
                </>
              ) : (
                <Volume2 size={13} />
              )}
            </button>

            {/* Save/Bookmark */}
            <button
              onClick={handleSave}
              className={`
                p-1.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95
                ${isDark
                  ? saved
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-white/30 hover:text-white/60'
                  : saved
                    ? 'text-amber-500 hover:text-amber-600'
                    : 'text-gray-300 hover:text-gray-500'
                }
              `}
              aria-label={saved ? 'إزالة من المحفوظات' : 'حفظ للقراءة لاحقاً'}
              title={saved ? 'إزالة من المحفوظات' : 'حفظ للقراءة لاحقاً'}
            >
              {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            </button>
          </div>
        </div>

        {/* ── Headline ─────────────────────────────────────────────── */}
        <h2
          className={`
            font-bold leading-relaxed ${titleClass}
            ${variant === 'hero' ? 'text-xl md:text-2xl' : 'text-base'}
          `}
          style={{
            fontFamily: "'Cairo', sans-serif",
            lineHeight: '1.7',
          }}
        >
          {cluster.is_breaking && (
            <span className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded text-xs font-black bg-red-500 text-white align-middle">
              <Zap size={9} />
              عاجل
            </span>
          )}
          {cluster.title_ar}
        </h2>

        {/* ── Lead Text (hero variant only) ────────────────────────── */}
        {variant === 'hero' && cluster.lead_ar && (
          <p
            className={`text-sm leading-relaxed ${leadClass}`}
            style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", lineHeight: '1.8' }}
          >
            {cluster.lead_ar}
          </p>
        )}

        {/* ── AI Summary Toggle Button ──────────────────────────────── */}
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleSummary(); }}
          className={`
            flex items-center gap-2 text-xs font-semibold transition-colors
            ${isDark
              ? 'text-white/40 hover:text-white/70'
              : 'text-gray-400 hover:text-gray-600'
            }
          `}
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >
          <span>الجوهر الرئيسي</span>
          {showSummary ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* ── AI 3-Point Summary — "The Core Essence" ─────────────── */}
        {showSummary && (
          <div
            className={`
              rounded-xl p-4 space-y-2.5
              ${isDark
                ? 'bg-white/5 border border-white/8'
                : 'bg-gray-50 border border-gray-100'
              }
            `}
          >
            {/* Summary header */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500"
                aria-hidden="true"
              />
              <span
                className={`text-xs font-bold tracking-wider ${
                  isDark ? 'text-emerald-400/80' : 'text-emerald-600'
                }`}
                style={{ fontFamily: "'Cairo', sans-serif", letterSpacing: '0.1em' }}
              >
                الخلاصة الذكية • ٣ نقاط
              </span>
            </div>

            {/* 3-Point bulleted list */}
            <ul className="space-y-2.5" dir="rtl">
              {cluster.summary_points.slice(0, 3).map((point, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span
                    className={`
                      flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                      text-xs font-bold mt-0.5
                      ${isDark
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-emerald-100 text-emerald-700'
                      }
                    `}
                    aria-hidden="true"
                  >
                    {idx + 1}
                  </span>
                  <p
                    className={`text-sm flex-1 ${
                      isDark ? 'text-[#E5E5EA]/85' : 'text-gray-700'
                    }`}
                    style={{
                      fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                      lineHeight: '1.75',
                    }}
                  >
                    {point.point}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Developing Story Timeline ─────────────────────────────── */}
        {cluster.is_developing && cluster.timeline.length > 0 && (
          <div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowTimeline(v => !v); }}
              className={`
                flex items-center gap-2 text-xs font-semibold transition-colors mb-2
                ${isDark ? 'text-amber-400/70 hover:text-amber-400' : 'text-amber-600/80 hover:text-amber-700'}
              `}
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              <Radio size={11} className="animate-pulse" />
              <span>التطورات ({cluster.timeline.length})</span>
              {showTimeline ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showTimeline && (
              <div className="relative pr-4 border-r-2 border-amber-500/30 space-y-3 mt-3">
                {cluster.timeline.map((entry) => (
                  <div key={entry.id} className="relative">
                    <div className="absolute -right-[9px] top-1.5 w-3.5 h-3.5 rounded-full bg-amber-500/60 border-2 border-amber-400" />
                    <p
                      className={`text-xs ${isDark ? 'text-[#E5E5EA]/70' : 'text-gray-600'}`}
                      style={{
                        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                        lineHeight: '1.7',
                      }}
                    >
                      {entry.entry_text_ar}
                    </p>
                    <span className={`text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                      {formatDistanceToNow(new Date(entry.event_timestamp))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Source Dock ───────────────────────────────────────────── */}
        {showSummary && cluster.sources.length > 0 && (
          <div onClick={(e) => e.stopPropagation()}>
            <SourceDock sources={cluster.sources} isDark={isDark} />
          </div>
        )}
      </div>
    </article>
  );
};
