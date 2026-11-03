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

export function isIgnorableBrowserNoise(
  message?: string,
  stack?: string,
  filename?: string
): boolean {
  const msgLower = String(message || '').toLowerCase();
  const stackLower = String(stack || '').toLowerCase();
  const fileLower = String(filename || '').toLowerCase();

  return (
    fileLower.includes('chrome-extension://') ||
    fileLower.includes('moz-extension://') ||
    fileLower.includes('safari-web-extension://') ||
    fileLower.includes('safari-extension://') ||
    stackLower.includes('chrome-extension://') ||
    stackLower.includes('moz-extension://') ||
    stackLower.includes('safari-web-extension://') ||
    stackLower.includes('safari-extension://') ||
    stackLower.includes('_postmessagetomp') ||
    msgLower.includes('_postmessagetomp') ||
    msgLower.includes("reading 'miniprogram'") ||
    msgLower.includes('cannot redefine property: ethereum') ||
    msgLower.includes('cannot redefine property: binancechain') ||
    msgLower.includes('websocket closed without opened') ||
    msgLower.includes('@vite/client') ||
    msgLower.includes("failed to construct 'websocket'") ||
    msgLower.includes('script error.') ||
    msgLower.includes('resizeobserver loop') ||
    msgLower.includes('blocked a frame with origin') ||
    msgLower.includes("failed to read a named property '$$typeof'") ||
    msgLower.includes('should not already be working') ||
    stackLower.includes('@vite/client') ||
    stackLower.includes('addobjecttoproperties')
  );
}

export function resetClientErrorRateLimitForTests() {
  errorCountInWindow = 0;
  if (windowResetTimer) {
    clearTimeout(windowResetTimer);
    windowResetTimer = null;
  }
}

export function reportClientError(error: unknown, extraContext: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error);

  const stack =
    error instanceof Error
      ? error.stack
      : typeof error === 'object' && error !== null && 'stack' in error
        ? String((error as { stack: unknown }).stack)
        : undefined;

  const filename = typeof extraContext.filename === 'string' ? extraContext.filename : undefined;

  // Ignore benign development / browser extension noise before counting against rate limit
  if (isIgnorableBrowserNoise(message, stack, filename)) {
    return;
  }

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
    const errStack = event.error && typeof event.error === 'object' && 'stack' in event.error
      ? String(event.error.stack)
      : undefined;
    if (isIgnorableBrowserNoise(event.message, errStack, event.filename)) return;

    reportClientError(event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg =
      reason && typeof reason === 'object' && 'message' in reason
        ? String(reason.message)
        : String(reason || '');
    const stk =
      reason && typeof reason === 'object' && 'stack' in reason
        ? String(reason.stack)
        : undefined;
    const file =
      reason && typeof reason === 'object' && ('fileName' in reason || 'sourceURL' in reason)
        ? String((reason as any).fileName || (reason as any).sourceURL || '')
        : undefined;

    if (isIgnorableBrowserNoise(msg, stk, file)) return;

    reportClientError(reason || 'Unhandled Promise Rejection', {
      type: 'UNHANDLED_PROMISE_REJECTION',
    });
  });

  console.info('[AKIRAQU Telemetry] Client error logging initialized');
}
