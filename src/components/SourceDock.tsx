/**
 * SourceDock — Elegant multi-source attribution interface
 * Renders distinct labeled buttons for each original Algerian press outlet
 * that reported the event, with brand accent colors and click-through links
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { SourceAttribution } from '../types';
import { formatDistanceToNow } from '../utils/dateUtils';

interface SourceDockProps {
  sources: SourceAttribution[];
  isDark: boolean;
}

export const SourceDock: React.FC<SourceDockProps> = ({ sources, isDark }) => {
  if (sources.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4
        className={`text-xs font-semibold tracking-widest uppercase ${
          isDark ? 'text-white/40' : 'text-gray-400'
        }`}
        style={{ fontFamily: "'Cairo', sans-serif", letterSpacing: '0.12em' }}
      >
        اقرأ التغطية الكاملة
      </h4>
      <div className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <SourceButton key={source.source_slug} source={source} isDark={isDark} />
        ))}
      </div>
    </div>
  );
};

interface SourceButtonProps {
  source: SourceAttribution;
  isDark: boolean;
}

const SourceButton: React.FC<SourceButtonProps> = ({ source, isDark }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(source.article_url, '_blank', 'noopener,noreferrer');
  };

  const timeAgo = source.published_at
    ? formatDistanceToNow(new Date(source.published_at))
    : '';

  return (
    <button
      onClick={handleClick}
      className={`
        group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
        border transition-all duration-200 hover:scale-105 active:scale-95
        ${isDark
          ? 'border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white'
          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900'
        }
      `}
      style={{ fontFamily: "'Cairo', sans-serif" }}
      title={`اقرأ في ${source.name_ar}${timeAgo ? ` — ${timeAgo}` : ''}`}
    >
      {/* Brand color indicator dot */}
      <span
        className="w-2 h-2 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
        style={{ backgroundColor: source.accent_color }}
        aria-hidden="true"
      />
      {/* Source name */}
      <span>{source.name_ar}</span>
      {/* External link icon */}
      <ExternalLink
        size={9}
        className={`flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity ${
          isDark ? 'text-white/60' : 'text-gray-400'
        }`}
      />
    </button>
  );
};
