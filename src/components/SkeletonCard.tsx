/**
 * SkeletonCard — Zero-CLS skeleton loader for news cluster cards
 * The 3:2 image container bounding box is hardcoded via aspect-ratio CSS
 * to reserve pixel-perfect space before edge asset delivery.
 * This eliminates Cumulative Layout Shift (CLS) entirely.
 */

import React from 'react';

interface SkeletonCardProps {
  variant?: 'hero' | 'compact';
  isDark: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ variant = 'compact', isDark }) => {
  const base = isDark ? 'bg-white/5' : 'bg-gray-200';
  const card = isDark
    ? 'bg-black/40 border border-white/10'
    : 'bg-white border border-gray-200';

  const SkeletonLine: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div
      className={`${base} rounded-md animate-pulse ${className}`}
      style={{
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s infinite',
      }}
    />
  );

  if (variant === 'hero') {
    return (
      <div className={`${card} rounded-2xl overflow-hidden`} aria-hidden="true">
        {/* Hero Image Skeleton — Strict 3:2 Aspect Ratio */}
        <div className="w-full" style={{ aspectRatio: '3/2' }}>
          <div className={`w-full h-full ${base} animate-pulse`} />
        </div>
        <div className="p-6 space-y-4">
          {/* Breaking badge area */}
          <div className="flex items-center gap-3">
            <SkeletonLine className="h-6 w-16 rounded-full" />
            <SkeletonLine className="h-4 w-24" />
          </div>
          {/* Title lines */}
          <div className="space-y-2">
            <SkeletonLine className="h-7 w-full" />
            <SkeletonLine className="h-7 w-11/12" />
            <SkeletonLine className="h-7 w-4/5" />
          </div>
          {/* Summary points */}
          <div className="space-y-2 pt-2">
            <SkeletonLine className="h-4 w-full" />
            <SkeletonLine className="h-4 w-full" />
            <SkeletonLine className="h-4 w-3/4" />
          </div>
          {/* Source dock */}
          <div className="flex gap-2 pt-2">
            <SkeletonLine className="h-8 w-20 rounded-full" />
            <SkeletonLine className="h-8 w-16 rounded-full" />
            <SkeletonLine className="h-8 w-18 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${card} rounded-xl overflow-hidden`} aria-hidden="true">
      {/* Compact Image — Strict 3:2 Aspect Ratio */}
      <div className="w-full" style={{ aspectRatio: '3/2' }}>
        <div className={`w-full h-full ${base} animate-pulse`} />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <SkeletonLine className="h-5 w-14 rounded-full" />
        </div>
        <div className="space-y-2">
          <SkeletonLine className="h-5 w-full" />
          <SkeletonLine className="h-5 w-5/6" />
        </div>
        <div className="space-y-1">
          <SkeletonLine className="h-3 w-full" />
          <SkeletonLine className="h-3 w-4/5" />
        </div>
        <div className="flex gap-2 pt-1">
          <SkeletonLine className="h-6 w-16 rounded-full" />
          <SkeletonLine className="h-6 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
};
