'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

declare global {
  interface Window {
    turnstile: any;
  }
}

interface TurnstileContextType {
  token: string | null;
  refreshTokens: () => void;
  isLoaded: boolean;
}

const TurnstileContext = createContext<TurnstileContextType>({
  token: null,
  refreshTokens: () => {},
  isLoaded: false,
});

const SITE_KEY = '0x4AAAAAACLw2qsqlvg_5lIN'; // Your Turnstile Site Key

export function TurnstileProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Turnstile script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if (window.turnstile) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
      console.log('[Turnstile] Script loaded');
    };

    script.onerror = () => {
      console.error('[Turnstile] Failed to load script');
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove script as other components might need it
    };
  }, []);

  // Get token when loaded
  useEffect(() => {
    if (!isLoaded || !window.turnstile) return;

    // Invisible widget - get token automatically
    try {
      // Create invisible container
      const containerId = 'turnstile-invisible-container';
      let container = document.getElementById(containerId);

      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.position = 'absolute';
        container.style.visibility = 'hidden';
        document.body.appendChild(container);
      }

      // Clear previous widget if exists
      if (window.turnstile?.getWidget(container)) {
        window.turnstile.remove(window.turnstile.getWidget(container));
      }

      // Render invisible widget
      const widgetId = window.turnstile.render(container, {
        sitekey: SITE_KEY,
        theme: 'auto',
        size: 'invisible',
        callback: (token: string) => {
          console.log('[Turnstile] Token received');
          setToken(token);
        },
        'error-callback': (): void => {
          console.error('[Turnstile] Token generation failed');
          setToken(null);
        },
        'expired-callback': (): void => {
          console.log('[Turnstile] Token expired');
          setToken(null);
        },
      });

      console.log('[Turnstile] Widget rendered:', widgetId);

      // Cleanup
      return () => {
        try {
          if (window.turnstile && container) {
            const wid = window.turnstile.getWidget(container);
            if (wid) {
              window.turnstile.remove(wid);
            }
          }
        } catch (e) {
          console.error('[Turnstile] Cleanup error:', e);
        }
      };
    } catch (e) {
      console.error('[Turnstile] Initialization error:', e);
    }
  }, [isLoaded]);

  const refreshTokens = () => {
    setToken(null);
    // Force re-render of widget
    if (window.turnstile) {
      const container = document.getElementById('turnstile-invisible-container');
      if (container) {
        try {
          window.turnstile.reset(window.turnstile.getWidget(container));
        } catch (e) {
          console.error('[Turnstile] Reset error:', e);
        }
      }
    }
  };

  return (
    <TurnstileContext.Provider value={{ token, refreshTokens, isLoaded }}>
      {children}
    </TurnstileContext.Provider>
  );
}

export function useTurnstile() {
  return useContext(TurnstileContext);
}

// Helper function to add token to URL
export function addTokenToUrl(url: string, token: string | null): string {
  if (!token) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}turnstile_token=${encodeURIComponent(token)}`;
}
