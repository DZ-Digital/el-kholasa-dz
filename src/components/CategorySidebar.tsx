/**
 * CategorySidebar — Left-rail category filter navigation
 * Features Arabic RTL layout, animated selection state, cluster counts
 */

import React from 'react';
import { X } from 'lucide-react';
import type { Category } from '../types';

interface CategorySidebarProps {
  categories: Category[];
  activeCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  isDark,
  isOpen,
  onClose,
}) => {
  const sidebarBg = isDark
    ? 'bg-black/90 border-l border-white/10 backdrop-blur-2xl'
    : 'bg-white/95 border-l border-gray-200 backdrop-blur-xl';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <nav
        className={`
          ${sidebarBg}
          fixed md:sticky top-16 right-0 md:right-auto
          h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]
          w-64 md:w-56
          z-40 md:z-auto
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          overflow-y-auto
          flex flex-col
        `}
        aria-label="فئات الأخبار"
        dir="rtl"
      >
        {/* Mobile close button */}
        <div className={`flex items-center justify-between p-4 md:hidden border-b ${isDark ? 'border-white/8' : 'border-gray-100'}`}>
          <span
            className={`text-sm font-bold ${isDark ? 'text-[#F5F5F7]' : 'text-gray-900'}`}
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            الفئات
          </span>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg ${isDark ? 'text-white/40 hover:text-white/70 hover:bg-white/8' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-3 space-y-1 flex-1">
          {/* "All News" entry */}
          <CategoryItem
            icon="🗞️"
            label="كل الأخبار"
            count={categories.reduce((sum, c) => sum + c.cluster_count, 0)}
            isActive={activeCategory === null}
            onClick={() => { onSelectCategory(null); onClose(); }}
            isDark={isDark}
          />

          {/* Separator */}
          <div className={`my-2 h-px ${isDark ? 'bg-white/8' : 'bg-gray-100'}`} />

          {/* Category items */}
          {categories.map((cat) => (
            <CategoryItem
              key={cat.slug}
              icon={cat.icon}
              label={cat.name_ar}
              count={cat.cluster_count}
              isActive={activeCategory === cat.slug}
              onClick={() => { onSelectCategory(cat.slug); onClose(); }}
              isDark={isDark}
              isBreaking={cat.slug === 'breaking'}
            />
          ))}
        </div>

        {/* Footer branding */}
        <div className={`p-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
          <p
            className={`text-xs text-center ${isDark ? 'text-white/20' : 'text-gray-300'}`}
            style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
          >
            مدعوم بالذكاء الاصطناعي
          </p>
          <p
            className={`text-xs text-center mt-0.5 ${isDark ? 'text-white/15' : 'text-gray-200'}`}
            style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
          >
            Cloudflare Workers AI
          </p>
        </div>
      </nav>
    </>
  );
};

interface CategoryItemProps {
  icon: string;
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  isDark: boolean;
  isBreaking?: boolean;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  icon, label, count, isActive, onClick, isDark, isBreaking
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl
        text-sm transition-all duration-200
        ${isActive
          ? isDark
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : isDark
            ? 'text-white/60 hover:text-white/85 hover:bg-white/6 border border-transparent'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
        }
      `}
      dir="rtl"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-base flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
        <span
          className={`font-semibold truncate ${isActive ? '' : ''}`}
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >
          {label}
        </span>
        {isBreaking && (
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
        )}
      </div>

      {count > 0 && (
        <span
          className={`
            text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 font-mono
            ${isActive
              ? isDark
                ? 'bg-emerald-500/30 text-emerald-400'
                : 'bg-emerald-100 text-emerald-700'
              : isDark
                ? 'bg-white/8 text-white/35'
                : 'bg-gray-100 text-gray-400'
            }
          `}
        >
          {count}
        </span>
      )}
    </button>
  );
};
