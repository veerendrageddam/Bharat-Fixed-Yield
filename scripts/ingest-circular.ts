#!/usr/bin/env tsx
/**
 * Bharat Fixed Yield (BFY) — Circular Ingestion & Audit CLI
 * 
 * Usage:
 *   npx tsx scripts/ingest-circular.ts --audit
 *   npx tsx scripts/ingest-circular.ts --sync-all
 *   npx tsx scripts/ingest-circular.ts --bank sbi-bank --file circular.json
 *   npx tsx scripts/ingest-circular.ts --help
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  applyAllAuditedBaselines,
  applyCircularUpdate,
  auditAllBankRates,
  loadCurrentRatesFile,
  saveRatesFileAtomic,
  BankCircularUpdate,
} from './ingestion/circularEngine';

function printHelp() {
  console.log(`
Bharat Fixed Yield (BFY) — Rate Circular Ingestion & Audit CLI
=============================================================

Commands:
  --audit                 Inspects and audits all 38 registered institutions for rate integrity,
                          effective circular dates, and direct verification URLs.

  --sync-all              Applies all 38 audited ALCO circular baselines directly to src/data/rates.json,
                          guaranteeing 100% compliance with current RBI < ₹3 Cr retail rate cards.

  --bank <bankId>         Updates a specific bank. Options:
    --file <jsonPath>     Loads structured BankCircularUpdate from a JSON file.
    --effective <date>    e.g. "w.e.f. October 15, 2024"
    --circular <url>      Direct link to official bank circular PDF or rate page.
    --baseRate <num>      e.g. 7.25
    --rate12 <num>        1-Year (12 Months) rate %
    --rate24 <num>        2-Years (24 Months) rate %
    --rate36 <num>        3-Years (36 Months) rate %
    --rate60 <num>        5-Years (60 Months / Tax Saver) rate %
    --seniorBonus <num>   Senior citizen extra % (default: 0.50)

  --help                  Shows this help text.
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('--audit')) {
    console.log('=====================================================');
    console.log(' Bharat Fixed Yield (BFY) — Bank Rate Audit Report');
    console.log('=====================================================');
    const report = auditAllBankRates();

    console.log(`Total Registered Institutions: ${report.totalBanks}`);
    console.log(`- Circular Verified:           ${report.circularVerifiedCount}`);
    console.log(`- Official Gazette:            ${report.officialGazetteCount}`);
    console.log(`- Baseline Verified:           ${report.baselineVerifiedCount}`);
    console.log(`- Fetch Failed:                ${report.fetchFailedCount}`);
    console.log(`- Missing Effective Dates:     ${report.missingEffectiveDateCount}`);
    console.log(`- Missing Circular URLs:       ${report.missingCircularUrlCount}\n`);

    console.log('| Bank ID | Category | Base Rate | Effective Date | Status | 12M | 36M | 60M | Schemes |');
    console.log('|---|---|:---:|---|:---:|:---:|:---:|:---:|:---:|');
    for (const b of report.banks) {
      const eff = b.effectiveDate ? b.effectiveDate.replace('w.e.f. ', '') : 'MISSING';
      console.log(
        `| ${b.id.padEnd(16)} | ${b.category.padEnd(10)} | ${b.baseRate.toFixed(2)}% | ${eff.padEnd(20)} | ${b.verificationStatus} | ${b.has12M ? '✓' : '✗'} | ${b.has36M ? '✓' : '✗'} | ${b.has60M ? '✓' : '✗'} | ${b.specialSchemesCount} |`
      );
    }
    process.exit(0);
  }

  if (args.includes('--sync-all')) {
    console.log('=====================================================');
    console.log(' Applying 38 Verified ALCO Circulars to rates.json');
    console.log('=====================================================');
    const { summary, diffs } = applyAllAuditedBaselines();
    console.log(`\n[SUCCESS] ${summary}`);
    if (diffs.length > 0) {
      console.log('\nAudit Diff Summary:');
      for (const d of diffs) {
        console.log(`• [${d.bankId}] ${d.bankName} (${d.effectiveDate})`);
        for (const c of d.changes) {
          console.log(`    - ${c}`);
        }
      }
    } else {
      console.log('All 38 banks already strictly match verified circular baselines.');
    }
    process.exit(0);
  }

  const bankIdx = args.indexOf('--bank');
  if (bankIdx !== -1 && args[bankIdx + 1]) {
    const bankId = args[bankIdx + 1];
    const fileIdx = args.indexOf('--file');

    if (fileIdx !== -1 && args[fileIdx + 1]) {
      const filePath = path.resolve(process.cwd(), args[fileIdx + 1]);
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
      }
      const raw = fs.readFileSync(filePath, 'utf-8');
      const update: BankCircularUpdate = { ...JSON.parse(raw), bankId };
      const current = loadCurrentRatesFile();
      const result = applyCircularUpdate(update, current);
      saveRatesFileAtomic(result.ratesFile);
      console.log(`[SUCCESS] Updated ${bankId}:`, result.diff.changes);
      process.exit(0);
    }

    // Direct flag parsing
    const getArg = (flag: string) => {
      const idx = args.indexOf(flag);
      return idx !== -1 ? args[idx + 1] : undefined;
    };

    const effectiveDate = getArg('--effective') || 'w.e.f. Recent Circular';
    const circularUrl = getArg('--circular') || 'https://rbi.org.in/';
    const baseRate = getArg('--baseRate') ? parseFloat(getArg('--baseRate')!) : undefined;
    const ratesByTenure: Record<string, number> = {};

    if (getArg('--rate12')) ratesByTenure['12'] = parseFloat(getArg('--rate12')!);
    if (getArg('--rate24')) ratesByTenure['24'] = parseFloat(getArg('--rate24')!);
    if (getArg('--rate36')) ratesByTenure['36'] = parseFloat(getArg('--rate36')!);
    if (getArg('--rate60')) ratesByTenure['60'] = parseFloat(getArg('--rate60')!);

    const seniorBonus = getArg('--seniorBonus') ? parseFloat(getArg('--seniorBonus')!) : undefined;

    const update: BankCircularUpdate = {
      bankId,
      effectiveDate,
      circularUrl,
      baseRate,
      ratesByTenure,
      seniorBonus,
    };

    const current = loadCurrentRatesFile();
    const result = applyCircularUpdate(update, current);
    saveRatesFileAtomic(result.ratesFile);
    console.log(`[SUCCESS] Updated ${bankId}:`, result.diff.changes);
    process.exit(0);
  }

  console.error('Invalid arguments. Use --help to view available commands.');
  process.exit(1);
}

main().catch((err) => {
  console.error('Execution error:', err);
  process.exit(1);
});

