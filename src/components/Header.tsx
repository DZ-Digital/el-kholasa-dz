/**
 * Header — El-Kholasa DZ Application Header
 * Features: Glassmorphism surface, theme toggle, notification bell,
 * saved articles count, search affordance, Arabic RTL typography
 */

import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Bell,
  Bookmark,
  Search,
  X,
  Wifi,
  WifiOff,
  Menu,
} from 'lucide-react';
import type { Theme } from '../types';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  savedCount: number;
  onShowSaved: () => void;
  isOnline: boolean;
  onSearch: (query: string) => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  savedCount,
  onShowSaved,
  isOnline,
  onSearch,
  onToggleSidebar,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isDark = theme === 'dark';

  const headerBg = isDark
    ? 'bg-black/80 border-b border-white/8 backdrop-blur-2xl'
    : 'bg-white/80 border-b border-gray-200/60 backdrop-blur-xl';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) {
      onSearch(e.target.value.trim());
    } else {
      onSearch('');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
    setShowSearch(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 ${headerBg} transition-all duration-300`}
      role="banner"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* ── Right: Logo & Brand ──────────────────────────────── */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={onToggleSidebar}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isDark ? 'text-white/50 hover:text-white/80 hover:bg-white/8' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="القائمة"
            >
              <Menu size={20} />
            </button>

            {/* Logo mark */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, #059669, #0d9488)'
                    : 'linear-gradient(135deg, #10b981, #14b8a6)',
                  boxShadow: isDark
                    ? '0 0 20px rgba(5,150,105,0.4)'
                    : '0 4px 12px rgba(5,150,105,0.3)',
                }}
                aria-hidden="true"
              >
                خ
              </div>
              <div className="hidden sm:block">
                <h1
                  className={`text-base font-black leading-none ${isDark ? 'text-[#F5F5F7]' : 'text-gray-900'}`}
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                >
                  الخلاصة الجزائرية
                </h1>
                <p
                  className={`text-xs leading-none mt-0.5 ${isDark ? 'text-white/35' : 'text-gray-400'}`}
                  style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                >
                  El-Kholasa DZ
                </p>
              </div>
            </div>
          </div>

          {/* ── Center: Search Bar (expandable) ──────────────────── */}
          <div className="flex-1 max-w-md">
            {showSearch ? (
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="ابحث في الأخبار..."
                  autoFocus
                  className={`
                    w-full py-2 pr-4 pl-10 rounded-xl text-sm outline-none
                    transition-all duration-200
                    ${isDark
                      ? 'bg-white/8 border border-white/12 text-[#F5F5F7] placeholder-white/30 focus:border-white/25 focus:bg-white/12'
                      : 'bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300 focus:bg-white'
                    }
                  `}
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                  dir="rtl"
                />
                <button
                  type="button"
                  onClick={clearSearch}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                    isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <X size={15} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className={`
                  hidden sm:flex items-center gap-2 w-full py-2 pr-4 pl-4 rounded-xl text-sm
                  border transition-all duration-200 cursor-text
                  ${isDark
                    ? 'bg-white/5 border-white/10 text-white/30 hover:bg-white/8 hover:border-white/15'
                    : 'bg-gray-100 border-gray-200 text-gray-400 hover:bg-gray-50 hover:border-gray-300'
                  }
                `}
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                <Search size={14} className="flex-shrink-0" />
                <span>ابحث في الأخبار...</span>
              </button>
            )}
          </div>

          {/* ── Left: Action Buttons ──────────────────────────────── */}
          <div className="flex items-center gap-1.5 flex-shrink-0">

            {/* Search toggle (mobile) */}
            <button
              onClick={() => setShowSearch(v => !v)}
              className={`sm:hidden p-2 rounded-lg transition-colors ${
                isDark ? 'text-white/50 hover:text-white/80 hover:bg-white/8' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="بحث"
            >
              <Search size={18} />
            </button>

            {/* Online/Offline indicator */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                isOnline
                  ? isDark ? 'text-emerald-400/60' : 'text-emerald-600/70'
                  : isDark ? 'text-red-400/70' : 'text-red-500'
              }`}
              title={isOnline ? 'متصل بالإنترنت' : 'غير متصل — وضع التخزين المؤقت'}
            >
              {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
              <span style={{ fontFamily: "'Cairo', sans-serif" }}>
                {isOnline ? 'متصل' : 'غير متصل'}
              </span>
            </div>

            {/* Saved Articles Button */}
            <button
              onClick={onShowSaved}
              className={`
                relative p-2 rounded-lg transition-colors
                ${isDark
                  ? 'text-white/50 hover:text-amber-400 hover:bg-white/8'
                  : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100'
                }
              `}
              aria-label={`المحفوظات (${savedCount})`}
              title="المحفوظات"
            >
              <Bookmark size={18} />
              {savedCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 w-4 h-4 bg-amber-500 rounded-full text-white text-xs flex items-center justify-center font-bold leading-none">
                  {savedCount > 9 ? '9+' : savedCount}
                </span>
              )}
            </button>

            {/* Notifications Bell */}
            <button
              className={`
                relative p-2 rounded-lg transition-colors
                ${isDark
                  ? 'text-white/50 hover:text-white/80 hover:bg-white/8'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }
              `}
              aria-label="الإشعارات"
              title="إشعارات الأخبار العاجلة"
              onClick={() => {
                if ('Notification' in window) {
                  Notification.requestPermission();
                }
              }}
            >
              <Bell size={18} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className={`
                p-2 rounded-lg transition-all duration-300
                ${isDark
                  ? 'text-amber-400 hover:text-amber-300 hover:bg-white/8'
                  : 'text-gray-600 hover:text-amber-500 hover:bg-gray-100'
                }
              `}
              aria-label={isDark ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
              title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
