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
import { createCircularBankAdapter } from './circularAdapterFactory';

/**
 * Open-Closed Principle (OCP):
 * All 38 registered institutions across India (SFB, Private, PSU, Post Office, and RRBs)
 * are monitored and tracked with uniform contracts.
 */
export const ACTIVE_BANK_ADAPTERS: BankRateAdapter[] = [
  // High-Yield Small Finance Banks (SFBs)
  unitySfbAdapter,
  suryodaySfbAdapter,
  utkarshSfbAdapter,
  equitasSfbAdapter,
  auSfbAdapter,
  ujjivanSfbAdapter,

  // Premier Commercial Private Banks
  hdfcBankAdapter,
  iciciBankAdapter,
  axisBankAdapter,
  createCircularBankAdapter('kotak-bank'),
  createCircularBankAdapter('idfc-first-bank'),
  createCircularBankAdapter('indusind-bank'),
  createCircularBankAdapter('yes-bank'),
  createCircularBankAdapter('federal-bank'),

  // Public Sector Banks & State Cooperative Banks (PSUs)
  sbiBankAdapter,
  createCircularBankAdapter('bank-of-baroda'),
  createCircularBankAdapter('pnb-bank'),
  createCircularBankAdapter('union-bank'),
  createCircularBankAdapter('canara-bank'),
  createCircularBankAdapter('bank-of-india'),
  createCircularBankAdapter('saraswat-bank'),

  // Sovereign Small Savings Schemes (India Post)
  postOfficePotdAdapter,
  postOfficePordAdapter,

  // Regional Rural Banks (RRBs) - Pan-Bharat Coverage
  apgbAdapter,
  tgbAdapter,
  createCircularBankAdapter('kgb-bank'),
  createCircularBankAdapter('kagb-bank'),
  createCircularBankAdapter('mgb-bank'),
  createCircularBankAdapter('bggb-bank'),
  createCircularBankAdapter('aryavart-bank'),
  createCircularBankAdapter('jkgb-bank'),
  createCircularBankAdapter('dbgb-bank'),
  createCircularBankAdapter('ogb-bank'),
  createCircularBankAdapter('rmgb-bank'),
  createCircularBankAdapter('bgvb-bank'),
  createCircularBankAdapter('agvb-bank'),
  createCircularBankAdapter('tngb-bank'),
  createCircularBankAdapter('mgb-mp-bank'),
];

