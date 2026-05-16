/**
 * =============================================================================
 * El-Kholasa DZ — Application Entry Point
 * Registers Service Worker, sets up React root, initializes PWA features
 * =============================================================================
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// ── Mount React Application ────────────────────────────────────────────────
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('[El-Kholasa] Root element #root not found in DOM');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// ── Service Worker Registration ────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Always check for SW updates
      });

      console.log('[SW] Registered with scope:', registration.scope);

      // Check for updates every 30 minutes
      setInterval(() => {
        registration.update().catch(() => {});
      }, 30 * 60 * 1000);

      // Notify user when new SW is available
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            console.log('[SW] New version available — reload to update');
            // In production: show a toast notification to the user
          }
        });
      });

      // Trigger initial background sync for top 20 clusters
      if (registration.active) {
        registration.active.postMessage({ type: 'FORCE_SYNC' });
      }
    } catch (error) {
      console.warn('[SW] Registration failed:', error);
    }
  });
}

// ── PWA Install Prompt Capture ─────────────────────────────────────────────
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e as BeforeInstallPromptEvent;
  // Dispatch custom event so App can show install UI
  window.dispatchEvent(
    new CustomEvent('pwaInstallReady', { detail: { prompt: e } })
  );
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  console.log('[PWA] Application installed successfully');
});

// Export for use in components
export { deferredInstallPrompt };

// ── TypeScript interface for BeforeInstallPromptEvent ─────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ── Inline JSON-LD for the Application (Homepage SEO) ─────────────────────
const appJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'الخلاصة الجزائرية',
  alternateName: 'El-Kholasa DZ',
  url: 'https://elkholasa.dz',
  description: 'منصة ذكاء اصطناعي لتجميع وتلخيص أخبار الجزائر من مصادر موثوقة متعددة',
  inLanguage: 'ar',
  applicationCategory: 'NewsApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'DZD',
  },
  publisher: {
    '@type': 'Organization',
    name: 'الخلاصة الجزائرية',
    url: 'https://elkholasa.dz',
  },
};

// Inject JSON-LD into <head>
const jsonLdScript = document.createElement('script');
jsonLdScript.type = 'application/ld+json';
jsonLdScript.textContent = JSON.stringify(appJsonLd);
document.head.appendChild(jsonLdScript);
