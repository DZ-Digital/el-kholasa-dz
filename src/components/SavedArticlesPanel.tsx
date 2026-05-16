/**
 * SavedArticlesPanel — Slide-in panel for offline bookmarked articles
 * Reads from IndexedDB/localStorage for full offline access
 */

import React from 'react';
import { X, Bookmark, Trash2, WifiOff } from 'lucide-react';
import type { SavedArticle } from '../types';
import { formatDistanceToNow } from '../utils/dateUtils';

interface SavedArticlesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  saved: SavedArticle[];
  onRemove: (clusterId: number) => void;
  isDark: boolean;
}

export const SavedArticlesPanel: React.FC<SavedArticlesPanelProps> = ({
  isOpen,
  onClose,
  saved,
  onRemove,
  isDark,
}) => {
  const panelBg = isDark
    ? 'bg-black/95 border-r border-white/10 backdrop-blur-2xl'
    : 'bg-white border-r border-gray-200';

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        className={`
          fixed left-0 top-0 h-full w-80 max-w-[90vw]
          ${panelBg}
          z-50 transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
        role="dialog"
        aria-modal="true"
        aria-label="المقالات المحفوظة"
        dir="rtl"
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-white/8' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2">
            <Bookmark size={18} className={isDark ? 'text-amber-400' : 'text-amber-500'} />
            <h2
              className={`text-base font-bold ${isDark ? 'text-[#F5F5F7]' : 'text-gray-900'}`}
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              المحفوظات
            </h2>
            {saved.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/8 text-white/50' : 'bg-gray-100 text-gray-500'}`}>
                {saved.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-white/40 hover:text-white/70 hover:bg-white/8' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Offline mode badge */}
        <div className={`px-4 py-2 border-b ${isDark ? 'border-white/5' : 'border-gray-50'}`}>
          <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
            <WifiOff size={11} />
            <span style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
              متاح للقراءة بدون إنترنت
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {saved.length === 0 ? (
            <EmptyState isDark={isDark} />
          ) : (
            <ul className="p-3 space-y-2">
              {saved.map((article) => (
                <SavedArticleItem
                  key={article.clusterId}
                  article={article}
                  onRemove={onRemove}
                  isDark={isDark}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

const EmptyState: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
    <div className="text-5xl opacity-30">🔖</div>
    <div>
      <p
        className={`text-base font-semibold ${isDark ? 'text-white/40' : 'text-gray-400'}`}
        style={{ fontFamily: "'Cairo', sans-serif" }}
      >
        لا توجد مقالات محفوظة
      </p>
      <p
        className={`text-sm mt-1 ${isDark ? 'text-white/25' : 'text-gray-300'}`}
        style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
      >
        اضغط على أيقونة الإشارة المرجعية لحفظ مقالة للقراءة لاحقاً
      </p>
    </div>
  </div>
);

interface SavedArticleItemProps {
  article: SavedArticle;
  onRemove: (id: number) => void;
  isDark: boolean;
}

const SavedArticleItem: React.FC<SavedArticleItemProps> = ({ article, onRemove, isDark }) => {
  const timeAgo = formatDistanceToNow(new Date(article.savedAt));

  return (
    <li
      className={`
        rounded-xl overflow-hidden border transition-all duration-200
        ${isDark ? 'border-white/8 bg-white/4 hover:bg-white/6' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}
      `}
    >
      {/* Thumbnail — strict 3:2 ratio */}
      {article.hero_image_url && (
        <div style={{ aspectRatio: '3/2' }}>
          <img
            src={article.hero_image_url}
            alt={article.title_ar}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-3 space-y-2">
        {/* Title */}
        <h3
          className={`text-sm font-semibold leading-relaxed ${isDark ? 'text-[#F5F5F7]' : 'text-gray-900'}`}
          style={{ fontFamily: "'Cairo', sans-serif", lineHeight: '1.7' }}
        >
          {article.title_ar}
        </h3>

        {/* First summary point preview */}
        {article.summary_points.length > 0 && (
          <p
            className={`text-xs leading-relaxed ${isDark ? 'text-white/45' : 'text-gray-500'}`}
            style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", lineHeight: '1.6' }}
          >
            • {article.summary_points[0].point.substring(0, 100)}...
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className={`text-xs ${isDark ? 'text-white/25' : 'text-gray-400'}`}>
            {timeAgo}
          </span>
          <button
            onClick={() => onRemove(article.clusterId)}
            className={`p-1 rounded-md transition-colors ${isDark ? 'text-white/25 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}
            aria-label="حذف من المحفوظات"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </li>
  );
};
