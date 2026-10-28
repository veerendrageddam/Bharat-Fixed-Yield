import { BankRateAdapter } from '../types';
import { tgbAdapter } from './rrb/tgbAdapter';
import { apgbAdapter } from './rrb/apgbAdapter';
import { unitySfbAdapter } from './sfb/unitySfbAdapter';
import { suryodaySfbAdapter } from './sfb/suryodaySfbAdapter';
import { utkarshSfbAdapter } from './sfb/utkarshSfbAdapter';
import { equitasSfbAdapter } from './sfb/equitasSfbAdapter';
import { auSfbAdapter } from './sfb/auSfbAdapter';
import { ujjivanSfbAdapter } from './sfb/ujjivanSfbAdapter';
import { postOfficePotdAdapter, postOfficePordAdapter } from './postOfficeAdapter';
import { axisBankAdapter } from './commercial/axisBankAdapter';
import { hdfcBankAdapter } from './commercial/hdfcBankAdapter';
import { iciciBankAdapter } from './commercial/iciciBankAdapter';
import { sbiBankAdapter } from './commercial/sbiBankAdapter';

/**
 * Open-Closed Principle (OCP):
 * New bank adapters can be registered by adding them to this array
 * without modifying the core ingestion engine or diffing logic.
 */
export const ACTIVE_BANK_ADAPTERS: BankRateAdapter[] = [
  // High-Yield Small Finance Banks (SFBs)
  unitySfbAdapter,
  suryodaySfbAdapter,
  utkarshSfbAdapter,
  equitasSfbAdapter,
  auSfbAdapter,
  ujjivanSfbAdapter,
  // Premier Commercial Private & PSU Banks
  axisBankAdapter,
  hdfcBankAdapter,
  iciciBankAdapter,
  sbiBankAdapter,
  // Sovereign Small Savings Schemes
  postOfficePotdAdapter,
  postOfficePordAdapter,
  // Regional Rural Banks (RRBs)
  tgbAdapter,
  apgbAdapter,
];

