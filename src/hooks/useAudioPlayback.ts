import { useState, useCallback, useRef, useEffect } from 'react';
import type { AudioPlaybackState } from '../types';
import type { SummaryPoint } from '../types';

export function useAudioPlayback() {
  const [audioState, setAudioState] = useState<AudioPlaybackState>({
    clusterId: null,
    state: 'idle',
  });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /**
   * Builds the Arabic text string from summary points for TTS synthesis
   */
  const buildTtsText = (title: string, points: SummaryPoint[]): string => {
    const pointsText = points
      .map((p, i) => `النقطة ${i + 1}: ${p.point}`)
      .join('. ');
    return `${title}. الملخص: ${pointsText}`;
  };

  /**
   * Gets the best available Arabic voice from the system
   * Falls back to first available voice if no Arabic voice is found
   */
  const getArabicVoice = (): SpeechSynthesisVoice | null => {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find(v => v.lang === 'ar-SA' || v.lang === 'ar-EG' || v.lang.startsWith('ar')) ||
      voices.find(v => v.default) ||
      voices[0] ||
      null
    );
  };

  const speak = useCallback((clusterId: number, title: string, summaryPoints: SummaryPoint[]) => {
    if (!window.speechSynthesis) {
      console.warn('[TTS] Web Speech API not supported in this browser');
      return;
    }

    // If already playing this cluster, pause
    if (audioState.clusterId === clusterId && audioState.state === 'playing') {
      window.speechSynthesis.pause();
      setAudioState({ clusterId, state: 'paused' });
      return;
    }

    // If paused on this cluster, resume
    if (audioState.clusterId === clusterId && audioState.state === 'paused') {
      window.speechSynthesis.resume();
      setAudioState({ clusterId, state: 'playing' });
      return;
    }

    // Cancel any in-progress speech
    window.speechSynthesis.cancel();

    const text = buildTtsText(title, summaryPoints);
    const utterance = new SpeechSynthesisUtterance(text);

    // Configure Arabic speech parameters
    utterance.lang = 'ar-SA';
    utterance.rate = 0.9;   // Slightly slower for comprehension
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use an Arabic voice
    const voice = getArabicVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      setAudioState({ clusterId, state: 'playing' });
    };

    utterance.onpause = () => {
      setAudioState({ clusterId, state: 'paused' });
    };

    utterance.onresume = () => {
      setAudioState({ clusterId, state: 'playing' });
    };

    utterance.onend = () => {
      setAudioState({ clusterId: null, state: 'idle' });
    };

    utterance.onerror = () => {
      setAudioState({ clusterId: null, state: 'idle' });
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [audioState]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setAudioState({ clusterId: null, state: 'idle' });
  }, []);

  const isPlaying = useCallback(
    (clusterId: number) =>
      audioState.clusterId === clusterId && audioState.state === 'playing',
    [audioState]
  );

  const isPaused = useCallback(
    (clusterId: number) =>
      audioState.clusterId === clusterId && audioState.state === 'paused',
    [audioState]
  );

  const isActive = useCallback(
    (clusterId: number) => audioState.clusterId === clusterId,
    [audioState]
  );

  return { audioState, speak, stop, isPlaying, isPaused, isActive };
}
