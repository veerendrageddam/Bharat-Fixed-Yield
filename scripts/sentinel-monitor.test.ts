import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  extractComparableContent,
  loadCache,
  saveCache,
  runSentinelMonitor,
  CACHE_FILE_PATH,
  ALERTS_FILE_PATH,
} from './sentinel-monitor';

describe('Sentinel Rate-Change Monitor', () => {
  describe('extractComparableContent', () => {
    it('strips script, style, svg, noscript, and HTML comments', () => {
      const rawHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <!-- Google Tag Manager dynamic nonce -->
            <script>var nonce = "abc123xyz"; gtag("event", "page_view");</script>
            <style>.banner { background: #f00; }</style>
          </head>
          <body>
            <svg width="100" height="100"><circle cx="50" cy="50" r="40" /></svg>
            <noscript>JavaScript is required.</noscript>
            <h1>Fixed Deposit Interest Rates</h1>
            <table>
              <tr><td>1 Year FD</td><td>7.25%</td></tr>
              <tr><td>3 Year FD</td><td>8.00%</td></tr>
            </table>
          </body>
        </html>
      `;

      const clean = extractComparableContent(rawHtml);
      expect(clean).not.toContain('nonce');
      expect(clean).not.toContain('gtag');
      expect(clean).not.toContain('.banner');
      expect(clean).not.toContain('circle');
      expect(clean).not.toContain('JavaScript is required');
      expect(clean).toContain('Fixed Deposit Interest Rates');
      expect(clean).toContain('1 Year FD 7.25%');
      expect(clean).toContain('3 Year FD 8.00%');
    });

    it('normalizes multiple spaces, newlines, and common HTML entities', () => {
      const rawHtml = `
        <div>
          SBI &amp; HDFC Rates &nbsp; &quot;Special 444D&#39;
        </div>
      `;
      const clean = extractComparableContent(rawHtml);
      expect(clean).toBe(`SBI & HDFC Rates "Special 444D'`);
    });

    it('handles empty or malformed inputs gracefully', () => {
      expect(extractComparableContent('')).toBe('');
      expect(extractComparableContent(null as any)).toBe('');
      expect(extractComparableContent(undefined as any)).toBe('');
    });

    it('caps content at 50,000 characters to prevent memory explosion', () => {
      const longHtml = '<p>' + 'A'.repeat(60000) + '</p>';
      const clean = extractComparableContent(longHtml);
      expect(clean.length).toBe(50000);
    });
  });

  describe('Cache State Management', () => {
    const testCachePath = path.resolve(process.cwd(), 'scripts/ingestion/.test-sentinel-cache.json');

    it('handles non-existent cache file cleanly without throwing', () => {
      const cache = loadCache();
      expect(typeof cache).toBe('object');
    });
  });
});

