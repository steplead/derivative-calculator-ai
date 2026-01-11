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
  const [widgetId, setWidgetId] = useState<string | null>(null);

  // Load Turnstile script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[Turnstile] Loading script...');

    // Check if already loaded
    if (window.turnstile) {
      console.log('[Turnstile] Script already loaded');
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
      // Don't remove script
    };
  }, []);

  // Render widget when script is loaded
  useEffect(() => {
    if (!isLoaded || !window.turnstile) {
      console.log('[Turnstile] Waiting for script...', { isLoaded, hasTurnstile: !!window.turnstile });
      return;
    }

    console.log('[Turnstile] Initializing widget...');

    // Create container
    const containerId = 'turnstile-container';
    let container = document.getElementById(containerId);

    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.position = 'fixed';
      container.style.bottom = '0';
      container.style.right = '0';
      container.style.zIndex = '-9999';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }

    // Clear previous widget
    if (widgetId && window.turnstile) {
      try {
        window.turnstile.remove(widgetId);
        console.log('[Turnstile] Previous widget removed');
      } catch (e) {
        console.error('[Turnstile] Error removing previous widget:', e);
      }
    }

    // Render new widget
    try {
      const newWidgetId = window.turnstile.render(container, {
        sitekey: SITE_KEY,
        theme: 'auto',
        callback: (newToken: string) => {
          console.log('[Turnstile] ✓ Token received');
          setToken(newToken);
        },
        'error-callback': (error: any) => {
          console.error('[Turnstile] ✗ Token generation failed:', error);
          setToken(null);
        },
        'expired-callback': () => {
          console.log('[Turnstile] Token expired');
          setToken(null);
        },
      });

      setWidgetId(newWidgetId);
      console.log('[Turnstile] Widget rendered, ID:', newWidgetId);

      // Try to get token immediately
      setTimeout(() => {
        try {
          if (window.turnstile && newWidgetId) {
            console.log('[Turnstile] Attempting to get response...');
            const response = window.turnstile.getResponse(newWidgetId);
            if (response) {
              console.log('[Turnstile] ✓ Got immediate response');
              setToken(response);
            } else {
              console.log('[Turnstile] No immediate response available (need interaction)');
            }
          }
        } catch (e) {
          console.error('[Turnstile] Error getting response:', e);
        }
      }, 500);

    } catch (e) {
      console.error('[Turnstile] Widget render error:', e);
    }

    // Cleanup
    return () => {
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
          console.log('[Turnstile] Widget cleaned up');
        } catch (e) {
          console.error('[Turnstile] Cleanup error:', e);
        }
      }
    };
  }, [isLoaded]);

  const refreshTokens = () => {
    console.log('[Turnstile] Refreshing token...');
    setToken(null);

    if (widgetId && window.turnstile) {
      try {
        window.turnstile.reset(widgetId);
        console.log('[Turnstile] Widget reset');
      } catch (e) {
        console.error('[Turnstile] Reset error:', e);
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
  // Only log when token changes, not on every render
  useEffect(() => {
    console.log('[Turnstile] Current token state:', context.token ? 'EXISTS' : 'NULL');
  }, [context.token]);
  return context;
}

// Helper function to add token to URL
export function addTokenToUrl(url: string, token: string | null): string {
  if (!token) {
    console.log('[Turnstile] No token available');
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  const result = `${url}${separator}turnstile_token=${encodeURIComponent(token)}`;
  console.log('[Turnstile] Token added to URL');
  return result;
}
