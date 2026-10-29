#!/usr/bin/env tsx
/**
 * Bharat Fixed Yield (BFY) — Multimodal & LLM Circular Extraction Agent
 * 
 * Production Best Practice:
 * Ingests unstructured bank rate notices, circular PDFs, and ALCO disclosure tables
 * into strictly typed, financially validated BankCircularUpdate objects.
 * 
 * Powered by Gemini 2.0 Flash via @google/genai with strict JSON schema validation,
 * bounds checking (3.00% to 11.50%), and Human-in-the-Loop (HITL) audit diffs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { MASTER_BANK_REGISTRY } from './ingestion/masterRegistry';
import { fetchWithResilience } from './ingestion/http';
import {
  applyCircularUpdate,
  BankCircularUpdate,
  CircularDiff,
  loadCurrentRatesFile,
  saveRatesFileAtomic,
  validateCircularUpdate,
} from './ingestion/circularEngine';

export interface ExtractionOptions {
  bankId: string;
  circularUrl?: string;
  rawContent: string;
  apiKey?: string;
}

export interface ExtractionResult {
  success: boolean;
  update?: BankCircularUpdate;
  diff?: CircularDiff;
  errors: string[];
  rawLLMOutput?: string;
}

const SYSTEM_INSTRUCTION = `
You are an expert Indian Banking Regulatory Auditor and Fixed Deposit Yield Analyst.
Your task is to parse official bank ALCO (Asset-Liability Committee) deposit rate circulars,
disclosures, or website tables into a strict JSON object conforming to the BankCircularUpdate schema.

Domain Rules:
1. Scope: Standard Domestic Retail Callable Fixed Deposits (< ₹3 Crore / ₹2 Crore per RBI guidelines).
   Exclude NRE/NRO, Bulk/Wholesale (>= ₹3 Crore), and Non-callable / Tax-Saver (unless specified).
2. General Citizen Card Rates: Extract rates across core tenure buckets in months:
   - "12" (1 Year)
   - "24" (2 Years)
   - "36" (3 Years)
   - "60" (5 Years)
   Optionally include "1", "3", "6" if present in the text.
3. Special Schemes / Odd Days: Extract promotional buckets like 400D, 444D, 555D, 777D, 1001D:
   - name: e.g. "Amrit Vrishti", "Sahasra", "Uttam"
   - days: numeric integer (e.g. 444)
   - rate: general citizen rate in percent (e.g. 7.25)
   - seniorRate: senior citizen rate in percent (e.g. 7.75)
4. Premium / Bonuses:
   - seniorBonus: differential percentage above general rate (typically 0.50)
   - superSeniorBonus: differential for 80+ years (e.g. 0.75 or 0.80)
   - womenBonus: if specified (e.g. 0.15)
5. Effective Date: The "w.e.f." date the circular is effective (e.g. "October 15, 2024" or "2024-10-15").
6. Verification Status: Set to "circular_verified".
`;

const CIRCULAR_JSON_SCHEMA = {
  type: 'object',
  properties: {
    bankId: { type: 'string' },
    effectiveDate: { type: 'string' },
    circularUrl: { type: 'string' },
    baseRate: { type: 'number' },
    ratesByTenure: {
      type: 'object',
      description: 'Mapping of tenure in months (e.g. "12", "24", "36", "60") to percentage rates',
    },
    rdRatesByTenure: {
      type: 'object',
      description: 'Optional recurring deposit rates mapping',
    },
    specialTenure: { type: 'string' },
    specialSchemes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          days: { type: 'number' },
          rate: { type: 'number' },
          seniorBonus: { type: 'number' },
        },
        required: ['name', 'days', 'rate'],
      },
    },
    seniorBonus: { type: 'number' },
    superSeniorBonus: { type: 'number' },
    womenBonus: { type: 'number' },
    callable: { type: 'boolean' },
    retailCapCr: { type: 'number' },
  },
  required: ['bankId', 'effectiveDate', 'ratesByTenure'],
};

/**
 * Extracts structured deposit rates from raw text using Gemini 2.0 Flash.
 */
export async function extractCircularWithLLM(options: ExtractionOptions): Promise<ExtractionResult> {
  const { bankId, rawContent, apiKey = process.env.GEMINI_API_KEY } = options;
  const master = MASTER_BANK_REGISTRY[bankId];

  if (!master) {
    return {
      success: false,
      errors: [`Unknown bankId: '${bankId}'. Must be registered in MASTER_BANK_REGISTRY.`],
    };
  }

  const circularUrl = options.circularUrl || master.sourceUrl || 'https://www.rbi.org.in';

  if (!apiKey) {
    return {
      success: false,
      errors: [
        'GEMINI_API_KEY environment variable is required to run LLM extraction.',
        'Please export GEMINI_API_KEY="your-api-key" or pass apiKey in options.',
      ],
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const userPrompt = `
Bank ID: ${bankId}
Institution Name: ${master.name}
Category: ${master.category}
Source Circular URL: ${circularUrl}

Raw Circular Text / HTML Table Content:
"""
${rawContent.slice(0, 25000)}
"""

Extract the structured deposit rate information strictly adhering to the schema.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: CIRCULAR_JSON_SCHEMA as any,
        temperature: 0.1, // High determinism for financial rate auditing
      },
    });

    const textOutput = response.text?.trim() ?? '';
    if (!textOutput) {
      return {
        success: false,
        errors: ['Gemini 2.0 Flash returned an empty response.'],
      };
    }

    // Clean any markdown wrapper if returned
    const cleanedJson = textOutput.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleanedJson) as BankCircularUpdate;

    // Guarantee bankId and circularUrl consistency
    parsed.bankId = bankId;
    parsed.circularUrl = parsed.circularUrl || circularUrl;
    parsed.verificationStatus = 'circular_verified';
    parsed.callable = parsed.callable ?? true;
    parsed.retailCapCr = parsed.retailCapCr ?? 3;

    // Validate using BFY domain engine
    const validation = validateCircularUpdate(parsed);
    if (!validation.valid) {
      return {
        success: false,
        update: parsed,
        errors: validation.errors,
        rawLLMOutput: textOutput,
      };
    }

    // Dry-run diff calculation
    const ratesFile = loadCurrentRatesFile();
    const { diff } = applyCircularUpdate(parsed, ratesFile);

    return {
      success: true,
      update: parsed,
      diff,
      errors: [],
      rawLLMOutput: textOutput,
    };
  } catch (err: any) {
    return {
      success: false,
      errors: [`LLM extraction execution failed: ${err.message}`],
    };
  }
}

/**
 * Deterministic regex fallback extractor for test suites or offline environments.
 */
export function extractCircularOffline(options: ExtractionOptions): ExtractionResult {
  const { bankId, rawContent, circularUrl } = options;
  const master = MASTER_BANK_REGISTRY[bankId];

  if (!master) {
    return {
      success: false,
      errors: [`Unknown bankId: '${bankId}'.`],
    };
  }

  // Regex extract effective date (e.g. w.e.f. October 15, 2024 or 15/10/2024)
  const dateMatch = rawContent.match(/(?:w\.?e\.?f\.?|effective from|effective date)[\s:]*([A-Za-z0-9,./ -]+?(?:\d{4}))/i);
  const effectiveDate = dateMatch ? dateMatch[1].trim() : 'w.e.f. Recent Circular';

  // Extract tenures & rates row-by-row to prevent cross-row phrase collision (e.g. "1 Year to less than 2 Years")
  const ratesByTenure: Record<string, number> = {};
  
  // Split by HTML table rows or line breaks
  const rows = rawContent.split(/<\/tr>|\n|\r\n/i);

  for (const row of rows) {
    const text = row.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) continue;

    // Look for first rate percentage in this row
    const rateMatch = text.match(/(\d+\.\d+)\s*%/);
    if (!rateMatch) continue;

    const rate = parseFloat(rateMatch[1]);
    if (rate < 3.0 || rate > 11.5) continue;

    // Detect tenure bucket based on starting tenure in this row
    if (/^\s*(?:1\s*year|12\s*months?)\b/i.test(text) || /\b(?:1\s*year\s+to|12\s*months?\s+to)\b/i.test(text)) {
      if (!ratesByTenure['12']) ratesByTenure['12'] = rate;
    } else if (/^\s*(?:2\s*years?|24\s*months?)\b/i.test(text) || /\b(?:2\s*years?\s+to|24\s*months?\s+to)\b/i.test(text)) {
      if (!ratesByTenure['24']) ratesByTenure['24'] = rate;
    } else if (/^\s*(?:3\s*years?|36\s*months?)\b/i.test(text) || /\b(?:3\s*years?\s+to|36\s*months?\s+to)\b/i.test(text)) {
      if (!ratesByTenure['36']) ratesByTenure['36'] = rate;
    } else if (/^\s*(?:5\s*years?|60\s*months?)\b/i.test(text) || /\b(?:5\s*years?\s+to|5\s*years?\s+and|60\s*months?\s+to)\b/i.test(text)) {
      if (!ratesByTenure['60']) ratesByTenure['60'] = rate;
    }
  }

  if (Object.keys(ratesByTenure).length === 0) {
    return {
      success: false,
      errors: ['No valid tenure rates found in raw content using offline parser.'],
    };
  }

  const update: BankCircularUpdate = {
    bankId,
    effectiveDate,
    circularUrl: circularUrl || master.sourceUrl || 'https://www.rbi.org.in',
    ratesByTenure,
    baseRate: ratesByTenure['36'] ?? ratesByTenure['12'],
    seniorBonus: master.seniorBonus ?? 0.50,
    superSeniorBonus: master.superSeniorBonus,
    womenBonus: master.womenBonus,
    verificationStatus: 'circular_verified',
    callable: true,
    retailCapCr: 3,
  };

  const validation = validateCircularUpdate(update);
  if (!validation.valid) {
    return {
      success: false,
      update,
      errors: validation.errors,
    };
  }

  const ratesFile = loadCurrentRatesFile();
  const { diff } = applyCircularUpdate(update, ratesFile);

  return {
    success: true,
    update,
    diff,
    errors: [],
  };
}

// -------------------------------------------------------------
// CLI Execution Handler
// -------------------------------------------------------------
async function runCli(): Promise<void> {
  const args = process.argv.slice(2);
  const bankIndex = args.indexOf('--bank');
  const fileIndex = args.indexOf('--file');
  const urlIndex = args.indexOf('--url');
  const shouldApply = args.includes('--apply');
  const isOffline = args.includes('--offline');

  if (bankIndex === -1 || !args[bankIndex + 1]) {
    console.log(`
Usage:
  npx tsx scripts/extract-circular-llm.ts --bank <bankId> [--file <path> | --url <url>] [--apply] [--offline]

Examples:
  npx tsx scripts/extract-circular-llm.ts --bank sbi-bank --file circular.html
  npx tsx scripts/extract-circular-llm.ts --bank unity-sfb --url https://theunitybank.com/
  npx tsx scripts/extract-circular-llm.ts --bank hdfc-bank --offline --file hdfc-rates.txt
`);
    process.exit(1);
  }

  const bankId = args[bankIndex + 1];
  const master = MASTER_BANK_REGISTRY[bankId];

  if (!master) {
    console.error(`❌ Unknown bankId: '${bankId}'`);
    process.exit(1);
  }

  let rawContent = '';
  let circularUrl = master.sourceUrl;

  if (fileIndex !== -1 && args[fileIndex + 1]) {
    const filePath = path.resolve(process.cwd(), args[fileIndex + 1]);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }
    rawContent = fs.readFileSync(filePath, 'utf-8');
    console.log(`[INFO] Loaded ${rawContent.length} bytes from file: ${filePath}`);
  } else if (urlIndex !== -1 && args[urlIndex + 1]) {
    circularUrl = args[urlIndex + 1];
    console.log(`[INFO] Fetching disclosure from URL: ${circularUrl}...`);
    const res = await fetchWithResilience(circularUrl);
    if (!res.ok) {
      console.error(`❌ Failed to fetch content from ${circularUrl}: ${res.error}`);
      process.exit(1);
    }
    rawContent = res.text;
  } else if (master.sourceUrl) {
    console.log(`[INFO] Fetching default disclosure from registered URL: ${master.sourceUrl}...`);
    const res = await fetchWithResilience(master.sourceUrl);
    if (!res.ok) {
      console.error(`❌ Failed to fetch content from ${master.sourceUrl}: ${res.error}`);
      process.exit(1);
    }
    rawContent = res.text;
  } else {
    console.error(`❌ No input source provided. Specify --file <path> or --url <url>.`);
    process.exit(1);
  }

  console.log(`\n=====================================================`);
  console.log(` BFY Circular Extractor Agent: ${master.name} (${bankId})`);
  console.log(`=====================================================`);

  let result: ExtractionResult;
  if (isOffline || !process.env.GEMINI_API_KEY) {
    if (!process.env.GEMINI_API_KEY && !isOffline) {
      console.log(`[WARN] GEMINI_API_KEY not set. Falling back to offline regulatory regex parser.`);
    }
    result = extractCircularOffline({ bankId, circularUrl, rawContent });
  } else {
    console.log(`[INFO] Initiating Gemini 2.0 Flash Extraction Agent...`);
    result = await extractCircularWithLLM({ bankId, circularUrl, rawContent });
  }

  if (!result.success || !result.update) {
    console.error(`\n❌ Extraction Failed:`);
    for (const e of result.errors) {
      console.error(`  • ${e}`);
    }
    process.exit(1);
  }

  console.log(`\n✅ Extraction Successful!`);
  console.log(`- Effective Date: ${result.update.effectiveDate}`);
  console.log(`- Circular URL:   ${result.update.circularUrl}`);
  console.log(`- Base Rate:       ${result.update.baseRate}%`);
  console.log(`- Tenure Rates:   ${JSON.stringify(result.update.ratesByTenure)}`);
  if (result.update.specialSchemes && result.update.specialSchemes.length > 0) {
    console.log(`- Special Schemes:`);
    for (const s of result.update.specialSchemes) {
      console.log(`  • ${s.name}: ${s.days} Days @ ${s.rate}% (Senior Bonus: +${s.seniorBonus ?? 0.50}%)`);
    }
  }

  if (result.diff) {
    console.log(`\n📋 Audit Diff (vs rates.json):`);
    if (result.diff.changes.length === 0) {
      console.log(`  (Identical rates — no changes detected)`);
    } else {
      for (const ch of result.diff.changes) {
        console.log(`  • ${ch}`);
      }
    }
  }

  if (shouldApply) {
    const ratesFile = loadCurrentRatesFile();
    applyCircularUpdate(result.update, ratesFile);
    saveRatesFileAtomic(ratesFile);
    console.log(`\n💾 Successfully applied verified update to src/data/rates.json!`);
  } else {
    console.log(`\nℹ️ Dry-run mode: Pass --apply to write changes to src/data/rates.json`);
  }
}

// Run CLI when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCli().catch((err) => {
    console.error('Extraction script error:', err);
    process.exit(1);
  });
}
