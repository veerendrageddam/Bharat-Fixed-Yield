/**
 * Resilient HTTP Client for Bank Rate Disclosure Endpoints
 */

export const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'Upgrade-Insecure-Requests': '1',
};

export interface FetchOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  fallbackUrls?: string[];
}

export async function fetchWithResilience(
  url: string,
  options: FetchOptions = {}
): Promise<{ ok: boolean; status: number; text: string; error?: string; resolvedUrl?: string }> {
  const { headers = {}, timeoutMs = 12000, retries = 1, fallbackUrls = [] } = options;
  const urlsToTry = [url, ...fallbackUrls];

  let lastError = '';

  for (const currentUrl of urlsToTry) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(currentUrl, {
          headers: { ...DEFAULT_HEADERS, ...headers },
          signal: controller.signal,
          redirect: 'follow',
        });
        clearTimeout(timeout);

        if (!response.ok) {
          lastError = `HTTP ${response.status}: ${response.statusText}`;
          if (response.status === 403 || response.status === 404) {
            // Break from retrying current URL, but proceed to try fallbackUrls if available
            break;
          }
          continue;
        }

        const text = await response.text();
        return { ok: true, status: response.status, text, resolvedUrl: currentUrl };
      } catch (err: any) {
        clearTimeout(timeout);
        lastError = err.name === 'AbortError' ? `Timeout after ${timeoutMs}ms` : err.message;
        if (attempt < retries) {
          // Exponential backoff wait (e.g. 500ms)
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        }
      }
    }
  }

  return { ok: false, status: 0, text: '', error: lastError };
}

