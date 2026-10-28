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

/**
 * Open-Closed Principle (OCP):
 * New bank adapters can be registered by adding them to this array
 * without modifying the core ingestion engine or diffing logic.
 */
export const ACTIVE_BANK_ADAPTERS: BankRateAdapter[] = [
  tgbAdapter,
  apgbAdapter,
  unitySfbAdapter,
  suryodaySfbAdapter,
  utkarshSfbAdapter,
  equitasSfbAdapter,
  auSfbAdapter,
  ujjivanSfbAdapter,
  postOfficePotdAdapter,
  postOfficePordAdapter,
];

