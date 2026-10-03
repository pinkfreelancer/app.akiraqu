/**
 * Client-Side Error Reporting & Telemetry Utility for AKIRAQU
 * 
 * Captures unhandled JavaScript exceptions, SVG NaN rendering glitches,
 * and promise rejections on client devices (e.g. mobile Safari / Chrome)
 * and streams them to the centralized backend /api/v1/log-client-error.
 */

let errorCountInWindow = 0;
let windowResetTimer: any = null;
const MAX_ERRORS_PER_MINUTE = 5;

export function reportClientError(error: Error | string, extraContext: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;

  // Rate-limiting on client side to avoid network flooding
  if (!windowResetTimer) {
    windowResetTimer = setTimeout(() => {
      errorCountInWindow = 0;
      windowResetTimer = null;
    }, 60000);
  }

  if (errorCountInWindow >= MAX_ERRORS_PER_MINUTE) {
    return;
  }

  errorCountInWindow++;

  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : (typeof error === 'object' && error && 'stack' in error ? String((error as any).stack) : undefined);

  // Ignore benign development / browser noise, including Vite HMR WebSocket disconnects
  // and cross-origin iframe DevTools/React inspect exceptions in sandbox
  const msgLower = (message || '').toLowerCase();
  const stackLower = (stack || '').toLowerCase();
  if (
    msgLower.includes('websocket closed without opened') ||
    msgLower.includes('@vite/client') ||
    msgLower.includes('failed to construct \'websocket\'') ||
    msgLower.includes('script error.') ||
    msgLower.includes('resizeobserver loop') ||
    msgLower.includes('blocked a frame with origin') ||
    msgLower.includes('failed to read a named property \'$$typeof\'') ||
    msgLower.includes('should not already be working') ||
    stackLower.includes('@vite/client') ||
    stackLower.includes('addobjecttoproperties')
  ) {
    return;
  }

  const payload = {
    message,
    stack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    ...extraContext,
  };

  try {
    fetch('/api/v1/log-client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Silently ignore reporting delivery errors
    });
  } catch (_e) {
    // Ignore fetch issues
  }
}

/**
 * Initializes global browser error listeners on app startup
 */
export function initClientErrorLogger() {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    // Ignore benign cross-origin script error noise
    if (event.message === 'Script error.') return;
    reportClientError(event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportClientError(event.reason || 'Unhandled Promise Rejection', {
      type: 'UNHANDLED_PROMISE_REJECTION',
    });
  });

  console.info('[AKIRAQU Telemetry] Client error logging initialized');
}
