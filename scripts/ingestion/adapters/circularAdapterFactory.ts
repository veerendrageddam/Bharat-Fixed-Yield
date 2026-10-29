/**
 * Bharat Fixed Yield (BFY) — Circular Adapter Factory
 * 
 * Factory that provisions resilient BankRateAdapters backed by verified ALCO circular disclosures.
 * Satisfies the Strategy and Factory patterns under SOLID principles:
 * - Attempts a live HTTP signature / table fetch against the official bank rate URL.
 * - If the live DOM table is readable (>= 2 tenures), dynamically updates the card.
 * - If protected by Cloudflare/Akamai WAF or rendered via client-side SPAs, transparently
 *   serves the verified ALCO circular baseline with full audit metadata (effectiveDate, circularUrl).
 */

import * as cheerio from 'cheerio';
import { BankRateAdapter, ScrapedRateResult } from '../types';
import { MASTER_BANK_REGISTRY } from '../masterRegistry';
import { AUDITED_CIRCULAR_BASELINES } from '../circularEngine';
import { fetchWithResilience } from '../http';
import { extractStandardTenureRates } from './cheerioHelper';

export function createCircularBankAdapter(bankId: string): BankRateAdapter {
  const masterDef = MASTER_BANK_REGISTRY[bankId];
  if (!masterDef) {
    throw new Error(`Cannot provision circular adapter for unregistered institution: '${bankId}'`);
  }

  const baseline = AUDITED_CIRCULAR_BASELINES.find((b) => b.bankId === bankId);

  return {
    bankId,
    bankName: masterDef.name,
    sourceUrl: baseline?.circularUrl ?? masterDef.sourceUrl ?? masterDef.portalUrl,
    category: masterDef.category,

    async fetchRates(): Promise<ScrapedRateResult | null> {
      let liveRatesExtracted = false;
      let ratesByTenure: Record<string, number> = {};
      let seniorBonus = masterDef.seniorBonus ?? 0.50;
      let superSeniorBonus = masterDef.superSeniorBonus ?? 0.75;

      try {
        const res = await fetchWithResilience(this.sourceUrl, {
          timeoutMs: 8000,
          retries: 1,
        });

        if (res.ok && res.text) {
          const $ = cheerio.load(res.text);
          const parsed = extractStandardTenureRates($);
          if (Object.keys(parsed.ratesByTenure).length >= 2) {
            ratesByTenure = parsed.ratesByTenure;
            seniorBonus = parsed.seniorBonus || seniorBonus;
            superSeniorBonus = parsed.superSeniorBonus || superSeniorBonus;
            liveRatesExtracted = true;
          }
        }
      } catch {
        // Fallback to verified ALCO circular disclosure
      }

      // If genuine live DOM extraction succeeded, mark as live_synced
      if (liveRatesExtracted && baseline) {
        return {
          baseRate: ratesByTenure['36'] ?? ratesByTenure['12'] ?? baseline.baseRate,
          ratesByTenure: { ...baseline.ratesByTenure, ...ratesByTenure },
          specialTenure: baseline.specialTenure,
          specialSchemes: baseline.specialSchemes,
          seniorBonus,
          superSeniorBonus,
          womenBonus: baseline.womenBonus ?? 0.00,
          effectiveDate: baseline.effectiveDate,
          circularUrl: this.sourceUrl,
          lastVerified: new Date().toISOString(),
          verificationStatus: 'live_synced',
        };
      }

      // Fallback: return verified ALCO circular with full audit trail
      if (baseline) {
        return {
          baseRate: baseline.baseRate ?? masterDef.baseRate,
          ratesByTenure: baseline.ratesByTenure,
          rdRatesByTenure: baseline.rdRatesByTenure,
          specialTenure: baseline.specialTenure,
          specialSchemes: baseline.specialSchemes,
          seniorBonus: baseline.seniorBonus ?? masterDef.seniorBonus,
          superSeniorBonus: baseline.superSeniorBonus ?? masterDef.superSeniorBonus,
          womenBonus: baseline.womenBonus ?? masterDef.womenBonus,
          effectiveDate: baseline.effectiveDate,
          circularUrl: baseline.circularUrl,
          callable: baseline.callable ?? true,
          retailCapCr: baseline.retailCapCr ?? 3,
          sourceUrl: this.sourceUrl,
          lastVerified: new Date().toISOString(),
          verificationStatus: 'circular_verified',
        };
      }

      return null;
    },
  };
}

