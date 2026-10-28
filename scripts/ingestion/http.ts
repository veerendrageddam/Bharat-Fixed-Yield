/**
 * Resilient HTTP Client for Bank Rate Disclosure Endpoints
 */

export const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
};

export interface FetchOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
}

export async function fetchWithResilience(
  url: string,
  options: FetchOptions = {}
): Promise<{ ok: boolean; status: number; text: string; error?: string }> {
  const { headers = {}, timeoutMs = 12000, retries = 1 } = options;

  let lastError = '';

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: { ...DEFAULT_HEADERS, ...headers },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        lastError = `HTTP ${response.status}: ${response.statusText}`;
        if (response.status === 403 || response.status === 404) {
          // Do not retry hard authorization blocks or 404s
          return { ok: false, status: response.status, text: '', error: lastError };
        }
        continue;
      }

      const text = await response.text();
      return { ok: true, status: response.status, text };
    } catch (err: any) {
      clearTimeout(timeout);
      lastError = err.name === 'AbortError' ? `Timeout after ${timeoutMs}ms` : err.message;
      if (attempt < retries) {
        // Exponential backoff wait (e.g. 500ms)
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }

  return { ok: false, status: 0, text: '', error: lastError };
}

