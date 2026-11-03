import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isIgnorableBrowserNoise,
  reportClientError,
  resetClientErrorRateLimitForTests,
} from './clientErrorLogger';

describe('clientErrorLogger browser extension filtering', () => {
  const originalWindow = globalThis.window;
  const originalNavigator = globalThis.navigator;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    resetClientErrorRateLimitForTests();
    vi.stubGlobal('window', {
      location: { href: 'http://localhost:3000/' },
      addEventListener: vi.fn(),
    });
    vi.stubGlobal('navigator', {
      userAgent: 'Vitest-Agent',
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      globalThis.window = originalWindow;
    }
    if (originalNavigator === undefined) {
      delete (globalThis as any).navigator;
    } else {
      globalThis.navigator = originalNavigator;
    }
    globalThis.fetch = originalFetch;
  });

  it('identifies Binance Wallet chrome-extension miniProgram errors and promise rejections as ignorable noise', () => {
    const syncStack = `TypeError: Cannot read properties of undefined (reading 'miniProgram')
    at s.Fl [as _postMessageToMp] (chrome-extension://cadiboklkpojfamcoggejbbdjcoiljjk/inpage.js:257:5516)
    at s.value (chrome-extension://cadiboklkpojfamcoggejbbdjcoiljjk/inpage.js:257:16243)
    at chrome-extension://cadiboklkpojfamcoggejbbdjcoiljjk/inpage.js:804:11137`;

    const asyncRejectionStack = `TypeError: Cannot read properties of undefined (reading 'miniProgram')
    at s.Fl [as _postMessageToMp] (chrome-extension://cadiboklkpojfamcoggejbbdjcoiljjk/inpage.js:257:5516)
    at chrome-extension://cadiboklkpojfamcoggejbbdjcoiljjk/inpage.js:257:15306
    at new Promise (<anonymous>)`;

    expect(
      isIgnorableBrowserNoise(
        "Uncaught TypeError: Cannot read properties of undefined (reading 'miniProgram')",
        syncStack,
        'chrome-extension://cadiboklkpojfamcoggejbbdjcoiljjk/inpage.js'
      )
    ).toBe(true);

    expect(
      isIgnorableBrowserNoise(
        "Cannot read properties of undefined (reading 'miniProgram')",
        asyncRejectionStack
      )
    ).toBe(true);
  });

  it('does not send telemetry or consume rate-limit quota for extension errors, while still reporting real app errors', () => {
    for (let i = 0; i < 10; i++) {
      const extError = new TypeError("Cannot read properties of undefined (reading 'miniProgram')");
      extError.stack =
        'TypeError: Cannot read properties of undefined (reading \'miniProgram\')\n    at s.Fl [as _postMessageToMp] (chrome-extension://cadiboklkpojfamcoggejbbdjcoiljjk/inpage.js:257:5516)';
      reportClientError(extError, {
        filename: 'chrome-extension://cadiboklkpojfamcoggejbbdjcoiljjk/inpage.js',
      });
    }

    expect(globalThis.fetch).not.toHaveBeenCalled();

    const realAppError = new Error('Orderbook calculation invariant failed');
    reportClientError(realAppError, { filename: 'http://localhost:3000/src/App.tsx' });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
