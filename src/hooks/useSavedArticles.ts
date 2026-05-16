import { useState, useEffect, useCallback } from 'react';
import type { SavedArticle, NewsCluster } from '../types';

const SAVED_KEY = 'elkholasa-saved';

export function useSavedArticles() {
  const [saved, setSaved] = useState<SavedArticle[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    } catch { /* Storage quota exceeded */ }
  }, [saved]);

  const saveArticle = useCallback((cluster: NewsCluster) => {
    setSaved(prev => {
      const exists = prev.some(s => s.clusterId === cluster.id);
      if (exists) return prev;
      return [
        {
          clusterId: cluster.id,
          slug: cluster.slug,
          title_ar: cluster.title_ar,
          summary_points: cluster.summary_points,
          hero_image_url: cluster.hero_image_url,
          seo_description: cluster.seo_description,
          savedAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  }, []);

  const removeArticle = useCallback((clusterId: number) => {
    setSaved(prev => prev.filter(s => s.clusterId !== clusterId));
  }, []);

  const isSaved = useCallback(
    (clusterId: number) => saved.some(s => s.clusterId === clusterId),
    [saved]
  );

  const toggleSave = useCallback(
    (cluster: NewsCluster) => {
      if (isSaved(cluster.id)) {
        removeArticle(cluster.id);
      } else {
        saveArticle(cluster);
      }
    },
    [isSaved, removeArticle, saveArticle]
  );

  return { saved, saveArticle, removeArticle, isSaved, toggleSave };
}
