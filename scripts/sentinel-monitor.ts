#!/usr/bin/env tsx
/**
 * Bharat Fixed Yield (BFY) — Sentinel Rate-Change Monitor
 * 
 * Production Best Practice:
 * Instead of scraping dynamic HTML tables with fragile DOM selectors,
 * the Sentinel monitor observes HTTP response signatures (ETag, Last-Modified,
 * and normalized content hashes) on official bank disclosure URLs.
 * 
 * When an ALCO circular revision occurs upstream, the Sentinel triggers an alert
 * for structured circular review and ingestion.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { MASTER_BANK_REGISTRY } from './ingestion/masterRegistry';
import { fetchWithResilience } from './ingestion/http';

export const CACHE_FILE_PATH = path.resolve(process.cwd(), 'scripts/ingestion/.sentinel-cache.json');
export const ALERTS_FILE_PATH = path.resolve(process.cwd(), 'scripts/ingestion/.sentinel-alerts.json');

export interface SentinelCacheEntry {
  bankId: string;
  sourceUrl: string;
  lastChecked: string;
  etag?: string;
  lastModified?: string;
  contentHash?: string;
  status: 'unchanged' | 'modified' | 'unreachable';
  consecutiveFailures?: number;
}

  export function loadCache(): Record<string, SentinelCacheEntry> {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      try {
        return JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf-8'));
      } catch {
        return {};
      }
    }
    return {};
  }

    export function saveCache(cache: Record<string, SentinelCacheEntry>): void {
      fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
    }

      /**
       * Normalizes raw HTML into comparable content for change detection:
       * 1. Strips HTML comments, <script>, <style>, <svg>, <noscript> blocks containing dynamic noise.
       * 2. Strips all HTML tags to leave clean text content.
       * 3. Normalizes whitespace and HTML entities.
       * 4. Extracts up to 50,000 characters to capture substantive deposit rate tables deep in the document.
       */
      export function extractComparableContent(html: string): string {
        if (!html || typeof html !== 'string') return '';

        return html
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
          .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/&quot;/gi, '"')
          .replace(/&#39;/gi, "'")
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 50000);
      }

      export interface SentinelRunResult {
        totalMonitored: number;
        verifiedCount: number;
        modifiedBanks: { bankId: string; name: string; url: string; reason: string }[];
        unreachableBanks: { bankId: string; name: string; url: string; error: string }[];
      }

      export async function runSentinelMonitor(options?: {
        timeoutMs?: number;
        strict?: boolean;
      }): Promise<SentinelRunResult> {
        console.log('=====================================================');
        console.log(' Bharat Fixed Yield (BFY) — Sentinel Rate Monitor');
        console.log('=====================================================');

        const cache = loadCache();
        const modifiedBanks: { bankId: string; name: string; url: string; reason: string }[] = [];
        const unreachableBanks: { bankId: string; name: string; url: string; error: string }[] = [];

        // Dynamically monitor all registered institutions across SFB, Private, PSU, Post Office, and RRBs
        const monitoredBankIds = Object.keys(MASTER_BANK_REGISTRY);
        const timeoutMs = options?.timeoutMs ?? 12000;

        for (const bankId of monitoredBankIds) {
          const bank = MASTER_BANK_REGISTRY[bankId];
          if (!bank || !bank.sourceUrl) continue;

          console.log(`[CHECK] Inspecting ${bank.name} (${bank.sourceUrl})...`);
          const prev = cache[bankId];

          try {
            const fallbackUrls = (bank as any).fallbackUrls ?? [];
            const res = await fetchWithResilience(bank.sourceUrl, {
              timeoutMs,
              retries: 1,
              fallbackUrls,
            });

            if (!res.ok) {
              const errorMsg = res.error || `HTTP ${res.status || 'unknown'}`;
              console.warn(`  ↳ ⚠️ [UNREACHABLE] ${bank.name}: ${errorMsg}`);
              unreachableBanks.push({
                bankId,
                name: bank.name,
                url: bank.sourceUrl,
                error: errorMsg,
              });

              // Record unreachability while preserving existing baseline hash
              cache[bankId] = {
                bankId,
                sourceUrl: bank.sourceUrl,
                lastChecked: new Date().toISOString(),
                contentHash: prev?.contentHash,
                status: 'unreachable',
                consecutiveFailures: (prev?.consecutiveFailures ?? 0) + 1,
              };
              continue;
            }

            // Compute normalized content hash on body text
            const cleanContent = extractComparableContent(res.text);
            const hash = crypto.createHash('sha256').update(cleanContent).digest('hex').slice(0, 16);
            const isFirstRun = !prev || !prev.contentHash;

            if (!isFirstRun && prev.contentHash !== hash) {
              console.log(`  ↳ 🚨 [ALERT] Potential rate change detected for ${bank.name}!`);
              modifiedBanks.push({
                bankId,
                name: bank.name,
                url: res.resolvedUrl || bank.sourceUrl,
                reason: `Content signature changed (${prev.contentHash} -> ${hash})`,
              });
            }

            cache[bankId] = {
              bankId,
              sourceUrl: res.resolvedUrl || bank.sourceUrl,
              lastChecked: new Date().toISOString(),
              contentHash: hash,
              status: isFirstRun ? 'unchanged' : prev.contentHash !== hash ? 'modified' : 'unchanged',
              consecutiveFailures: 0,
            };
          } catch (e: any) {
            const errorMsg = e.message || 'Unknown network error';
            console.warn(`  ↳ ⚠️ [EXCEPTION] ${bank.name}: ${errorMsg}`);
            unreachableBanks.push({ bankId, name: bank.name, url: bank.sourceUrl, error: errorMsg });

            cache[bankId] = {
              bankId,
              sourceUrl: bank.sourceUrl,
              lastChecked: new Date().toISOString(),
              contentHash: prev?.contentHash,
              status: 'unreachable',
              consecutiveFailures: (prev?.consecutiveFailures ?? 0) + 1,
            };
          }
        }

        saveCache(cache);

        // Write alerts file for downstream automation (e.g. LLM extraction or GHA alerts)
        fs.writeFileSync(ALERTS_FILE_PATH, JSON.stringify(modifiedBanks, null, 2), 'utf-8');

        const verifiedCount = monitoredBankIds.length - unreachableBanks.length;

        console.log('\n=====================================================');
        console.log(' Sentinel Ingestion Inspection Summary');
        console.log('=====================================================');
        console.log(`Total Monitored Endpoints: ${monitoredBankIds.length}`);
        console.log(`- Verified Active Endpoints: ${verifiedCount}`);
        console.log(`- Potential Updates Detected: ${modifiedBanks.length}`);
        console.log(`- Unreachable / Blind Spots:  ${unreachableBanks.length}`);

        if (modifiedBanks.length > 0) {
          console.log('\n⚠️ RATE CHANGE ALERTS (Action Required - Inspect Official Circular):');
          for (const m of modifiedBanks) {
            console.log(`• [${m.bankId}] ${m.name}: ${m.reason}\n  Link: ${m.url}`);
          }
        }

        if (unreachableBanks.length > 0) {
          console.log('\n🚨 UNREACHABLE BLIND SPOTS (WAF / Network / DNS Failure):');
          for (const u of unreachableBanks) {
            console.log(`• [${u.bankId}] ${u.name}: ${u.error}\n  Target: ${u.url}`);
          }
        }

        if (modifiedBanks.length === 0 && unreachableBanks.length === 0) {
          console.log('\n✅ 100% Verified: All monitored bank disclosure signatures match cached baselines.');
        } else if (modifiedBanks.length === 0 && unreachableBanks.length > 0) {
          console.log(
            `\n⚠️ DEGRADED RUN: 0 rate changes detected among reachable endpoints, but ${unreachableBanks.length} endpoint(s) were UNREACHABLE (Blind spots).`
          );
        }

        // GitHub Actions Step Summary reporting
        if (process.env.GITHUB_STEP_SUMMARY) {
          let summary = `## 🛡️ Sentinel Rate-Change Monitor Report\n\n`;
          summary += `- **Timestamp**: \`${new Date().toISOString()}\`\n`;
          summary += `- **Total Monitored Endpoints**: **${monitoredBankIds.length}**\n`;
          summary += `- **Verified Active Endpoints**: **${verifiedCount}**\n`;
          summary += `- **Potential Updates Detected**: **${modifiedBanks.length}**\n`;
          summary += `- **Unreachable / Blind Spots**: **${unreachableBanks.length}**\n\n`;

          if (modifiedBanks.length > 0) {
            summary += `### ⚠️ Detected Upstream Revisions\n\n`;
            summary += `| Bank ID | Institution Name | Detection Reason | Action Link |\n`;
            summary += `|---|---|---|---|\n`;
            for (const m of modifiedBanks) {
              summary += `| \`${m.bankId}\` | **${m.name}** | ${m.reason} | [Inspect Circular](${m.url}) |\n`;
            }
            summary += `\n*Automated review triggered: Check official ALCO circular or run \`npm run extract:circular\`.*\n\n`;
          }

          if (unreachableBanks.length > 0) {
            summary += `### 🚨 Unreachable Endpoints / Blind Spots\n\n`;
            summary += `| Bank ID | Institution Name | Error Reason | Disclosure URL |\n`;
            summary += `|---|---|---|---|\n`;
            for (const u of unreachableBanks) {
              summary += `| \`${u.bankId}\` | **${u.name}** | \`${u.error}\` | [Target Link](${u.url}) |\n`;
            }
            summary += `\n> ⚠️ *Note: Unreachable endpoints represent monitoring blind spots. Check domain firewalls or WAF challenges.*\n\n`;
          }

          if (modifiedBanks.length === 0 && unreachableBanks.length === 0) {
            summary += `> ✅ **All 38 institution rate card signatures are unchanged and verified against cache.**\n`;
          }

          try {
            fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary, 'utf-8');
          } catch {
            // Ignore if step summary path is inaccessible
          }
        }

        const isStrict = options?.strict || process.env.SENTINEL_STRICT === '1';
        if (isStrict && unreachableBanks.length / monitoredBankIds.length > 0.15) {
          throw new Error(
            `Sentinel strict mode failure: ${unreachableBanks.length}/${monitoredBankIds.length} endpoints were unreachable.`
          );
        }

        return {
          totalMonitored: monitoredBankIds.length,
          verifiedCount,
          modifiedBanks,
          unreachableBanks,
        };
      }

      // Only execute when run directly from CLI
      if (
        process.argv[1]?.endsWith('sentinel-monitor.ts') ||
        process.argv[1]?.includes('sentinel-monitor')
      ) {
        runSentinelMonitor().catch((err) => {
          console.error('Sentinel Monitor execution error:', err.message);
          process.exit(1);
        });
      }
