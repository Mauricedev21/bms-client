/**
 * PWA helpers: service-worker registration + install prompt plumbing.
 *
 * The service worker (public/sw.js) makes the app installable on phone/PC and
 * gives it an offline app-shell fallback. API responses are never cached by the
 * worker — all data still comes fresh from the network.
 *
 * Updates are applied passively: a new worker activates as soon as possible,
 * but the page is NEVER force-reloaded — a reload in the middle of a manager
 * typing a transaction or loan would lose their data. The current single-bundle
 * build keeps working regardless of which worker version controls it.
 */
import { useEffect, useState, useCallback } from 'react';

/** Register the service worker. Safe to call multiple times (no-ops if already registered). */
export function registerServiceWorker(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  // Never register in dev — a worker would serve stale modules over HMR.
  if (import.meta.env.DEV) return;

  const register = () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* PWA is a progressive enhancement — never break the app over it. */
    });
  };

  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

/** Minimal shape of the non-standard beforeinstallprompt event. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// iPhone/iPad UA (including Chrome/Firefox on iOS — they can all be installed
// from the Share sheet). iPadOS 13+ masquerades as a Mac with touch support.
const IS_IOS =
  typeof navigator !== 'undefined' &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1));

const IS_STANDALONE =
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    // iOS Safari / added-to-home-screen
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

/**
 * Tracks whether the app can be installed right now and exposes an `install()`
 * action. The button shows until the app is running standalone, so every
 * platform gets a discovery path:
 * - Android/desktop Chrome & Edge: one-tap native prompt when available.
 * - iOS: Share → Add to Home Screen instructions.
 * - Other desktop browsers: a hint pointing at the browser's install menu.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(IS_STANDALONE);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // suppress the mini-infobar; we render our own button
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferred) return 'unavailable';
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null); // the event can only be used once
    if (choice.outcome === 'accepted') setInstalled(true);
    return choice.outcome;
  }, [deferred]);

  return {
    /**
     * Show the install affordance while the app isn't running standalone.
     * Hidden in dev, where the service worker is intentionally off so the
     * browser's install criteria can never be met (a dead button helps no one).
     */
    canInstall: !installed && !import.meta.env.DEV,
    /** True when the native one-tap prompt is available (Chrome/Edge desktop & Android). */
    hasNativePrompt: Boolean(deferred),
    /** True on iOS where the user must use Share → Add to Home Screen. */
    isIOS: IS_IOS,
    isInstalled: installed,
    install,
  };
}
