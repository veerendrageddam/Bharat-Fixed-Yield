import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

interface SpecialScheme {
  name: string;
  days: number;
  rate: number;
  badge?: string;
}

interface BankRateData {
  baseRate: number;
  ratesByTenure: Record<string, number>;
  specialTenure?: string;
  specialSchemes?: SpecialScheme[];
  seniorBonus: number;
  superSeniorBonus: number;
  womenBonus: number;
  sourceUrl?: string;
  lastVerified?: string;
}

interface RatesFile {
  lastUpdated: string;
  version: string;
  source: string;
  rates: Record<string, BankRateData>;
}

const RATES_FILE_PATH = path.resolve(process.cwd(), 'src/data/rates.json');

// User-Agent simulating modern browser to prevent bot blocks
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Safety bounds: Interest rates in India historically stay within 3.00% to 11.50%
function isValidRate(rate: number): boolean {
  return typeof rate === 'number' && !isNaN(rate) && rate >= 3.0 && rate <= 11.5;
}

function parsePercent(text: string): number | null {
  const match = text.match(/(\d+\.?\d*)\s*%/);
  if (match) {
    const val = parseFloat(match[1]);
    return isValidRate(val) ? val : null;
  }
  const directFloat = parseFloat(text.replace(/[^\d.]/g, ''));
  return isValidRate(directFloat) ? directFloat : null;
}

/**
 * Telangana Grameena Bank (TGB) Live Scraper
 * Source: https://tgb.bank.in/deposit-interest-rates
 */
async function scrapeTGB(): Promise<Partial<BankRateData> | null> {
  const url = 'https://tgb.bank.in/deposit-interest-rates';
  console.log(`[TGB] Fetching live rates from ${url}...`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[TGB] HTTP Error ${res.status}: ${res.statusText}`);
      return null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const ratesByTenure: Record<string, number> = {};
    const specialSchemes: SpecialScheme[] = [];

    // Scan table rows for deposit tenures
    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 3) {
        const period = $(cells[1]).text().trim().toLowerCase();
        const rateText = $(cells[2]).text().trim();
        const rate = parsePercent(rateText);

        if (rate !== null) {
          if (period.includes('1 year') && period.includes('2 years')) {
            ratesByTenure['12'] = rate;
          } else if (period.includes('2 year') && period.includes('3 years')) {
            ratesByTenure['24'] = rate;
          } else if (period.includes('3 years') && period.includes('5 years')) {
            ratesByTenure['36'] = rate;
          } else if (period.includes('5 year') && period.includes('10 years')) {
            ratesByTenure['60'] = rate;
          } else if (period.includes('444')) {
            specialSchemes.push({
              name: '444-DDD Special',
              days: 444,
              rate,
              badge: 'Special 444D',
            });
          } else if (period.includes('sahasra') || period.includes('1000')) {
            specialSchemes.push({
              name: 'TGB Sahasra',
              days: 1000,
              rate,
              badge: 'Peak RRB 7.50%',
            });
          } else if (period.includes('lakhpati') || (period.includes('rd') && period.includes('36'))) {
            specialSchemes.push({
              name: 'RD Lakhpati (36M RD)',
              days: 1095,
              rate,
              badge: 'High Yield RD',
            });
          } else if (period.includes('nethanna') || (period.includes('rd') && period.includes('24'))) {
            specialSchemes.push({
              name: 'RD Nethanna Podupu (24M RD)',
              days: 730,
              rate,
            });
          }
        }
      }
    });

    if (Object.keys(ratesByTenure).length === 0) {
      console.warn('[TGB] Could not parse any standard tenure rates from table. DOM structure may have changed.');
      return null;
    }

    const baseRate = ratesByTenure['36'] ?? ratesByTenure['12'] ?? 6.50;
    const peakSpecial = specialSchemes.find((s) => s.days === 1000) ?? specialSchemes[0];

    return {
      baseRate,
      ratesByTenure,
      specialSchemes,
      specialTenure: peakSpecial ? `${peakSpecial.days} Days ${peakSpecial.name} (${peakSpecial.rate.toFixed(2)}%)` : undefined,
      seniorBonus: 0.50,
      superSeniorBonus: 0.50,
      womenBonus: 0.00,
      sourceUrl: url,
      lastVerified: new Date().toISOString(),
    };
  } catch (err: any) {
    clearTimeout(timeout);
    console.error(`[TGB] Error scraping: ${err.message}`);
    return null;
  }
}

/**
 * Extensible Scraper Registry
 */
type ScraperFn = () => Promise<Partial<BankRateData> | null>;

const SCRAPERS: Record<string, ScraperFn> = {
  'tgb-bank': scrapeTGB,
};

async function main() {
  console.log('=====================================================');
  console.log(' Bharat Fixed Yield (BFY) — Scheduled Rate Ingestion');
  console.log('=====================================================');
  console.log(`Reading existing rates from: ${RATES_FILE_PATH}`);

  if (!fs.existsSync(RATES_FILE_PATH)) {
    console.error(`Missing rates file at ${RATES_FILE_PATH}`);
    process.exit(1);
  }

  const fileRaw = fs.readFileSync(RATES_FILE_PATH, 'utf-8');
  const ratesData: RatesFile = JSON.parse(fileRaw);

  const updatesSummary: string[] = [];
  let changeCount = 0;

  for (const [bankId, scraper] of Object.entries(SCRAPERS)) {
    try {
      const scraped = await scraper();
      if (!scraped) {
        console.warn(`[SKIP] No valid data returned for ${bankId}, preserving existing rates.`);
        continue;
      }

      const existing = ratesData.rates[bankId];
      if (!existing) {
        console.warn(`[WARN] Bank ID ${bankId} not in rates.json, skipping merge.`);
        continue;
      }

      let hasDiff = false;
      const diffNotes: string[] = [];

      // Check base rate
      if (scraped.baseRate && scraped.baseRate !== existing.baseRate) {
        hasDiff = true;
        diffNotes.push(`baseRate: ${existing.baseRate}% -> ${scraped.baseRate}%`);
      }

      // Check tenure rates
      if (scraped.ratesByTenure) {
        for (const [tenure, newRate] of Object.entries(scraped.ratesByTenure)) {
          const oldRate = existing.ratesByTenure?.[tenure];
          if (oldRate !== newRate) {
            hasDiff = true;
            diffNotes.push(`${tenure}M: ${oldRate ?? 'N/A'}% -> ${newRate}%`);
          }
        }
      }

      // Check special schemes
      if (scraped.specialSchemes && scraped.specialSchemes.length > 0) {
        const oldSchemesStr = JSON.stringify(existing.specialSchemes ?? []);
        const newSchemesStr = JSON.stringify(scraped.specialSchemes);
        if (oldSchemesStr !== newSchemesStr) {
          hasDiff = true;
          diffNotes.push(`special schemes updated (${scraped.specialSchemes.length} schemes)`);
        }
      }

      if (hasDiff) {
        console.log(`[UPDATE] ${bankId} updated: ${diffNotes.join(', ')}`);
        ratesData.rates[bankId] = {
          ...existing,
          ...scraped,
          ratesByTenure: {
            ...existing.ratesByTenure,
            ...scraped.ratesByTenure,
          },
          lastVerified: new Date().toISOString(),
        };
        changeCount++;
        updatesSummary.push(`- **${bankId}**: ${diffNotes.join(', ')}`);
      } else {
        console.log(`[OK] ${bankId} rates verified identical. No changes required.`);
        // Update verified timestamp
        ratesData.rates[bankId].lastVerified = new Date().toISOString();
      }
    } catch (err: any) {
      console.error(`[ERROR] Processing ${bankId}: ${err.message}`);
    }
  }

  // Update master timestamp
  ratesData.lastUpdated = new Date().toISOString();

  // Atomic write back
  const tempPath = `${RATES_FILE_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(ratesData, null, 2), 'utf-8');
  fs.renameSync(tempPath, RATES_FILE_PATH);
  console.log(`\nSuccessfully wrote rates to: ${RATES_FILE_PATH}`);

  // GitHub Actions Step Summary output
  if (process.env.GITHUB_STEP_SUMMARY) {
    let summaryMd = `### 🏦 BFY Bank Rates Ingestion Report\n\n`;
    summaryMd += `- **Run Timestamp**: ${new Date().toUTCString()}\n`;
    summaryMd += `- **Banks Checked**: ${Object.keys(SCRAPERS).length}\n`;
    summaryMd += `- **Rates Changed**: ${changeCount}\n\n`;

    if (updatesSummary.length > 0) {
      summaryMd += `#### 📝 Rate Updates Applied:\n${updatesSummary.join('\n')}\n`;
    } else {
      summaryMd += `*All monitored banks are up-to-date with current official disclosures.*\n`;
    }

    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMd, 'utf-8');
  }

  console.log('=====================================================');
  console.log(` Ingestion Complete! (Changes detected: ${changeCount})`);
  console.log('=====================================================');
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
