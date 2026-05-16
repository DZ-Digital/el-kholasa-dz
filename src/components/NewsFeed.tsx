/**
 * NewsFeed — Dynamic Hybrid Feed Layout Engine
 *
 * Layout Philosophy: Explicitly rejects rigid Bento Grids.
 * Breaking/high-engagement news renders as full-bleed sprawling hero cards.
 * Secondary stories cascade into fluid compact grid items based on priority metadata.
 *
 * Priority Thresholds:
 *   priority <= 2 OR is_breaking=true → Hero card (full width)
 *   priority 3-4                      → Featured compact (2-col span on lg)
 *   priority > 4                      → Standard compact grid item
 */

import React, { useMemo } from 'react';
import { ClusterCard } from './ClusterCard';
import { SkeletonCard } from './SkeletonCard';
import type { NewsCluster } from '../types';

interface NewsFeedProps {
  clusters: NewsCluster[];
  isLoading: boolean;
  isDark: boolean;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ clusters, isLoading, isDark }) => {
  // Separate clusters by priority for layout assignment
  const { heroItems, featuredItems, standardItems } = useMemo(() => {
    const hero: NewsCluster[] = [];
    const featured: NewsCluster[] = [];
    const standard: NewsCluster[] = [];

    clusters.forEach((c) => {
      if (c.is_breaking || c.priority <= 2) {
        hero.push(c);
      } else if (c.priority <= 4) {
        featured.push(c);
      } else {
        standard.push(c);
      }
    });

    return { heroItems: hero, featuredItems: featured, standardItems: standard };
  }, [clusters]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Hero skeleton */}
        <SkeletonCard variant="hero" isDark={isDark} />
        {/* Compact grid skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} variant="compact" isDark={isDark} />
          ))}
        </div>
      </div>
    );
  }

  if (clusters.length === 0) {
    return <EmptyFeed isDark={isDark} />;
  }

  return (
    <div className="space-y-6" dir="rtl">

      {/* ── TIER 1: Hero Cards — Full-bleed, sprawling ────────────────── */}
      {heroItems.length > 0 && (
        <section aria-label="الأخبار العاجلة والمميزة">
          <div className="space-y-5">
            {heroItems.map((cluster) => (
              <ClusterCard
                key={cluster.id}
                cluster={cluster}
                variant="hero"
                isDark={isDark}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── TIER 2: Featured Compact — 2-col on large screens ─────────── */}
      {featuredItems.length > 0 && (
        <section aria-label="أخبار بارزة">
          {heroItems.length > 0 && (
            <div className={`flex items-center gap-3 mb-4`}>
              <div className={`flex-1 h-px ${isDark ? 'bg-white/8' : 'bg-gray-200'}`} />
              <span
                className={`text-xs font-semibold tracking-widest uppercase px-3 ${
                  isDark ? 'text-white/30' : 'text-gray-400'
                }`}
                style={{ fontFamily: "'Cairo', sans-serif", letterSpacing: '0.15em' }}
              >
                أخبار بارزة
              </span>
              <div className={`flex-1 h-px ${isDark ? 'bg-white/8' : 'bg-gray-200'}`} />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {featuredItems.map((cluster) => (
              <ClusterCard
                key={cluster.id}
                cluster={cluster}
                variant="compact"
                isDark={isDark}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── TIER 3: Standard Grid — Dynamic fluid grid ────────────────── */}
      {standardItems.length > 0 && (
        <section aria-label="أخبار أخرى">
          {(heroItems.length > 0 || featuredItems.length > 0) && (
            <div className={`flex items-center gap-3 mb-4`}>
              <div className={`flex-1 h-px ${isDark ? 'bg-white/8' : 'bg-gray-200'}`} />
              <span
                className={`text-xs font-semibold tracking-widest uppercase px-3 ${
                  isDark ? 'text-white/30' : 'text-gray-400'
                }`}
                style={{ fontFamily: "'Cairo', sans-serif", letterSpacing: '0.15em' }}
              >
                مزيد من الأخبار
              </span>
              <div className={`flex-1 h-px ${isDark ? 'bg-white/8' : 'bg-gray-200'}`} />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {standardItems.map((cluster) => (
              <ClusterCard
                key={cluster.id}
                cluster={cluster}
                variant="compact"
                isDark={isDark}
              />
            ))}
          </div>
        </section>
      )}

      {/* Load More button */}
      {clusters.length >= 8 && (
        <div className="flex justify-center pt-4 pb-8">
          <div
            className={`text-sm ${isDark ? 'text-white/25' : 'text-gray-300'}`}
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            • • • تحديث تلقائي كل ساعة • • •
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyFeed: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
    <div className="text-7xl opacity-20">📰</div>
    <div className="space-y-2">
      <h3
        className={`text-xl font-bold ${isDark ? 'text-white/40' : 'text-gray-400'}`}
        style={{ fontFamily: "'Cairo', sans-serif" }}
      >
        لا توجد نتائج
      </h3>
      <p
        className={`text-sm ${isDark ? 'text-white/25' : 'text-gray-300'}`}
        style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
      >
        جرّب البحث بكلمات مختلفة أو اختر فئة أخرى
      </p>
    </div>
  </div>
);
