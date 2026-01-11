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

    console.log('[Turnstile] Loading...');

    // Check if already loaded
    if (window.turnstile) {
      console.log('[Turnstile] Already loaded');
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('[Turnstile] Script loaded successfully');
      setIsLoaded(true);
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
    if (!isLoaded) {
      console.log('[Turnstile] Waiting for script to load...');
      return;
    }

    if (!window.turnstile) {
      console.error('[Turnstile] Script loaded but window.turnstile not available');
      return;
    }

    console.log('[Turnstile] Initializing widget...');

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
        container.style.zIndex = '-1';
        document.body.appendChild(container);
      }

      // Clear previous widget if exists
      if (window.turnstile?.getWidget(container)) {
        window.turnstile.remove(window.turnstile.getWidget(container));
      }

      // Render invisible widget with explicit execution
      const widgetId = window.turnstile.render(container, {
        sitekey: SITE_KEY,
        theme: 'auto',
        size: 'invisible',
        callback: (newToken: string) => {
          console.log('[Turnstile] Token received:', newToken ? 'YES' : 'NO');
          setToken(newToken);
        },
        'error-callback': (error: any): void => {
          console.error('[Turnstile] Token generation failed:', error);
          setToken(null);
        },
        'expired-callback': (): void => {
          console.log('[Turnstile] Token expired');
          setToken(null);
        },
      });

      console.log('[Turnstile] Widget rendered, ID:', widgetId);

      // Try to execute immediately to get token
      setTimeout(() => {
        try {
          if (window.turnstile && container) {
            const wid = window.turnstile.getWidget(container);
            if (wid) {
              console.log('[Turnstile] Executing widget...');
              window.turnstile.execute(wid);
            }
          }
        } catch (e) {
          console.error('[Turnstile] Execute error:', e);
        }
      }, 500);

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
    console.log('[Turnstile] Refreshing token...');
    setToken(null);
    // Force re-render of widget
    if (window.turnstile) {
      const container = document.getElementById('turnstile-invisible-container');
      if (container) {
        try {
          const wid = window.turnstile.getWidget(container);
          if (wid) {
            window.turnstile.reset(wid);
            setTimeout(() => window.turnstile.execute(wid), 100);
          }
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
  const context = useContext(TurnstileContext);
  console.log('[Turnstile] useTurnstile called, token:', context.token ? 'EXISTS' : 'NULL');
  return context;
}

// Helper function to add token to URL
export function addTokenToUrl(url: string, token: string | null): string {
  if (!token) {
    console.log('[Turnstile] No token to add to URL');
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  const result = `${url}${separator}turnstile_token=${encodeURIComponent(token)}`;
  console.log('[Turnstile] Token added to URL');
  return result;
}
