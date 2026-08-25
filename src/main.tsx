// Ensure window.fetch is safely configurable with both getter and setter to prevent TypeError: Cannot set property fetch of #<Window> which has only a getter
try {
  if (typeof window !== 'undefined') {
    let currentFetch = window.fetch ? window.fetch.bind(window) : undefined;
    const proto = Object.getPrototypeOf(window);
    if (proto) {
      try {
        Object.defineProperty(proto, 'fetch', {
          get() {
            return currentFetch;
          },
          set(v) {
            currentFetch = v;
          },
          configurable: true,
          enumerable: true,
        });
      } catch {
        // ignore
      }
    }
    try {
      Object.defineProperty(window, 'fetch', {
        get() {
          return currentFetch;
        },
        set(v) {
          currentFetch = v;
        },
        configurable: true,
        enumerable: true,
      });
    } catch {
      // ignore
    }
  }
} catch {
  // ignore
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
