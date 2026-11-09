import * as cheerio from 'cheerio';
import { parsePercent } from '../validator';

export interface ExtractedRatesSummary {
  ratesByTenure: Record<string, number>;
  seniorBonus: number;
  superSeniorBonus: number;
}

const EXCLUDED_TABLE_KEYWORDS = [
  'mclr',
  'marginal cost',
  'lending rate',
  'lending',
  'bplr',
  'eblr',
  'rllr',
  'home loan',
  'personal loan',
  'vehicle loan',
  'car loan',
  'gold loan',
  'education loan',
  'advances',
  'forex',
  'credit card',
  'service charges',
  'locker',
];

/**
 * Standardizes bank tenure label matching for the 4 core buckets:
 * 12M (1 Year), 24M (2 Years), 36M (3 Years), 60M (5 Years / Tax Saver)
 * 
 * Production Guardrail:
 * Verifies that tables belong to Fixed/Term Deposits and excludes lending/MCLR tables.
 */
export function extractStandardTenureRates(
  $: cheerio.CheerioAPI,
  tableSelector: string = 'table',
  category?: string
): ExtractedRatesSummary {
  const ratesByTenure: Record<string, number> = {};
  let seniorBonus = 0.50;
  let superSeniorBonus = 0.75;

  $(tableSelector).each((_, tbl) => {
    const $tbl = $(tbl);
    
    // Check preceding headings, caption, or table summary for lending/MCLR keywords
    const captionText = $tbl.find('caption').text().toLowerCase();
    const prevHeading = $tbl.prevAll('h1, h2, h3, h4, h5, h6, p').first().text().toLowerCase();
    const tableHeaderText = $tbl.find('thead, tr:first-child').text().toLowerCase();
    const tableContext = `${captionText} ${prevHeading} ${tableHeaderText}`;

    const isLendingTable = EXCLUDED_TABLE_KEYWORDS.some((kw) => tableContext.includes(kw));
    if (isLendingTable) {
      return; // Skip non-deposit table
    }

    $tbl.find('tr').each((_, row) => {
      const cells = $(row).find('td, th');
      if (cells.length < 2) return;

      const period = $(cells[0]).text().trim().toLowerCase();
      const rateText = $(cells[1]).text().trim();

      // Skip row if it references lending benchmarks
      if (
        period.includes('mclr') ||
        period.includes('eblr') ||
        period.includes('rllr') ||
        period.includes('lending') ||
        period.includes('loan')
      ) {
        return;
      }

      const rate = parsePercent(rateText, category);

      if (rate !== null) {
        if ((period.includes('1 year') && !period.includes('above') && !period.includes('to')) || period.includes('12 month') || period.includes('365 day')) {
          ratesByTenure['12'] = rate;
        } else if (period.includes('2 year') || period.includes('24 month') || period.includes('730 day')) {
          ratesByTenure['24'] = rate;
        } else if (period.includes('3 year') || period.includes('36 month') || period.includes('1095 day')) {
          ratesByTenure['36'] = rate;
        } else if (period.includes('5 year') || period.includes('60 month') || period.includes('tax saver')) {
          ratesByTenure['60'] = rate;
        }
      }

      // Check for senior bonus row
      if (period.includes('senior citizen') && !period.includes('super')) {
        const bonusMatch = rateText.match(/(\d+\.?\d*)\s*%/);
        if (bonusMatch) {
          const bonus = parseFloat(bonusMatch[1]);
          if (bonus > 0 && bonus <= 2.0) seniorBonus = bonus;
        }
      } else if (period.includes('super senior')) {
        const bonusMatch = rateText.match(/(\d+\.?\d*)\s*%/);
        if (bonusMatch) {
          const bonus = parseFloat(bonusMatch[1]);
          if (bonus > 0 && bonus <= 2.0) superSeniorBonus = bonus;
        }
      }
    });
  });

  return { ratesByTenure, seniorBonus, superSeniorBonus };
}

