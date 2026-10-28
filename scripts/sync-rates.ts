#!/usr/bin/env tsx
/**
 * Bharat Fixed Yield (BFY) — Scheduled Rate Ingestion Entry Point
 * Executes the decoupled multi-tier ingestion engine.
 */

import { runIngestionEngine } from './ingestion/engine';

runIngestionEngine().catch((err) => {
  console.error('Fatal execution error during bank rate ingestion:', err);
  process.exit(1);
});
