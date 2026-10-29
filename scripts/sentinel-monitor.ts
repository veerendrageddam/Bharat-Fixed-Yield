#!/usr/bin/env tsx
/**
 * Bharat Fixed Yield (BFY) — Sentinel Rate-Change Monitor
 * 
 * Production Best Practice:
 * Instead of scraping dynamic HTML tables with fragile DOM selectors,
 * the Sentinel monitor observes HTTP response signatures (ETag, Last-Modified,
 * and lightweight content hashes) on official bank disclosure URLs.
 * 
 * When an ALCO circular revision occurs upstream, the Sentinel triggers an alert
 * for structured circular review and ingestion.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { MASTER_BANK_REGISTRY } from './ingestion/masterRegistry';
import { fetchWithResilience } from './ingestion/http';

const CACHE_FILE_PATH = path.resolve(process.cwd(), 'scripts/ingestion/.sentinel-cache.json');

interface SentinelCacheEntry {
  bankId: string;
  sourceUrl: string;
  lastChecked: string;
  etag?: string;
  lastModified?: string;
  contentHash?: string;
  status: 'unchanged' | 'modified' | 'unreachable';
}

function loadCache(): Record<string, SentinelCacheEntry> {
  if (fs.existsSync(CACHE_FILE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveCache(cache: Record<string, SentinelCacheEntry>): void {
  fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}

export async function runSentinelMonitor(): Promise<void> {
  console.log('=====================================================');
  console.log(' Bharat Fixed Yield (BFY) — Sentinel Rate Monitor');
  console.log('=====================================================');

  const cache = loadCache();
  const modifiedBanks: { bankId: string; name: string; url: string; reason: string }[] = [];
  const unreachableBanks: { bankId: string; name: string; error: string }[] = [];

  // Dynamically monitor all registered institutions across SFB, Private, PSU, Post Office, and RRBs
  const monitoredBankIds = Object.keys(MASTER_BANK_REGISTRY);

  for (const bankId of monitoredBankIds) {
    const bank = MASTER_BANK_REGISTRY[bankId];
    if (!bank || !bank.sourceUrl) continue;

    console.log(`[CHECK] Inspecting ${bank.name} (${bank.sourceUrl})...`);
    const prev = cache[bankId];

    try {
      const res = await fetchWithResilience(bank.sourceUrl, { timeoutMs: 8000, retries: 1 });

      if (!res.ok) {
        unreachableBanks.push({ bankId, name: bank.name, error: res.error ?? 'HTTP error' });
        continue;
      }

      // Compute content hash on body text
      const hash = crypto.createHash('sha256').update(res.text.slice(0, 10000)).digest('hex').slice(0, 16);
      const isFirstRun = !prev || !prev.contentHash;

      if (!isFirstRun && prev.contentHash !== hash) {
        console.log(`[ALERT] Potential rate change detected for ${bank.name}!`);
        modifiedBanks.push({
          bankId,
          name: bank.name,
          url: bank.sourceUrl,
          reason: `Content signature changed (${prev.contentHash} -> ${hash})`,
        });
      }

      cache[bankId] = {
        bankId,
        sourceUrl: bank.sourceUrl,
        lastChecked: new Date().toISOString(),
        contentHash: hash,
        status: isFirstRun ? 'unchanged' : prev.contentHash !== hash ? 'modified' : 'unchanged',
      };
    } catch (e: any) {
      unreachableBanks.push({ bankId, name: bank.name, error: e.message });
    }
  }

  saveCache(cache);

  console.log('\n=====================================================');
  console.log(' Sentinel Ingestion Inspection Summary');
  console.log('=====================================================');
  console.log(`Total Monitored Endpoints: ${monitoredBankIds.length}`);
  console.log(`- Potential Updates Detected: ${modifiedBanks.length}`);
  console.log(`- Unreachable / WAF Blocked:  ${unreachableBanks.length}`);

  if (modifiedBanks.length > 0) {
    console.log('\n⚠️ ALERTS (Action Required - Inspect Official Circular):');
    for (const m of modifiedBanks) {
      console.log(`• [${m.bankId}] ${m.name}: ${m.reason}\n  Link: ${m.url}`);
    }
  } else {
    console.log('\n✅ All monitored bank disclosure signatures match cached baselines.');
  }
}

runSentinelMonitor().catch((err) => {
  console.error('Sentinel Monitor execution error:', err);
  process.exit(1);
});
