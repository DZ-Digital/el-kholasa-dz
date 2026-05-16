/**
 * AudioWaveform — Inline SVG micro-audio waveform animation
 * Renders an animated waveform that shifts color tokens based on theme and playback state
 * Implemented as pure CSS animations for zero JS overhead during playback
 */

import React from 'react';
import type { AudioState } from '../types';

interface AudioWaveformProps {
  state: AudioState;
  isDark: boolean;
  size?: 'sm' | 'md';
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ state, isDark, size = 'sm' }) => {
  const isAnimating = state === 'playing';
  const isPaused = state === 'paused';

  // Color tokens: shifts based on theme
  const color = isDark
    ? (isAnimating ? '#34d399' : isPaused ? '#fbbf24' : '#6b7280')
    : (isAnimating ? '#059669' : isPaused ? '#d97706' : '#9ca3af');

  const dims = size === 'sm' ? { w: 28, h: 16, bars: 5, barW: 3 } : { w: 36, h: 20, bars: 7, barW: 3 };
  const { w, h, bars, barW } = dims;
  const gap = (w - bars * barW) / (bars + 1);

  // Staggered heights for a realistic waveform look
  const barHeights = [0.4, 0.8, 1.0, 0.7, 0.5, 0.9, 0.6].slice(0, bars);

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="inline-block align-middle flex-shrink-0"
      aria-hidden="true"
      role="presentation"
    >
      <style>{`
        @keyframes elkholasa-wave-1 { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
        @keyframes elkholasa-wave-2 { 0%, 100% { transform: scaleY(0.7); } 50% { transform: scaleY(0.2); } }
        @keyframes elkholasa-wave-3 { 0%, 100% { transform: scaleY(1); }   50% { transform: scaleY(0.4); } }
        @keyframes elkholasa-wave-4 { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(0.9); } }
        @keyframes elkholasa-wave-5 { 0%, 100% { transform: scaleY(0.6); } 50% { transform: scaleY(0.3); } }
      `}</style>
      {barHeights.map((heightRatio, i) => {
        const barH = h * heightRatio;
        const x = gap + i * (barW + gap);
        const y = (h - barH) / 2;
        const animName = `elkholasa-wave-${(i % 5) + 1}`;
        const delay = `${i * 0.1}s`;

        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={barW / 2}
            fill={color}
            style={{
              transformOrigin: `${x + barW / 2}px ${h / 2}px`,
              animation: isAnimating
                ? `${animName} ${0.6 + i * 0.1}s ease-in-out ${delay} infinite`
                : 'none',
              opacity: isPaused ? 0.5 : 1,
              transition: 'fill 0.3s ease, opacity 0.3s ease',
            }}
          />
        );
      })}
    </svg>
  );
};
