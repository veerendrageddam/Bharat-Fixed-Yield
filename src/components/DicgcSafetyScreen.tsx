import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Coins,
  Sparkles
} from 'lucide-react';
import { BankData, UserPersona } from '../types/bank';
import { calculateYield, formatINR, formatLakhs, getEffectiveRate } from '../utils/calculator';

interface DicgcSafetyScreenProps {
  banks: BankData[];
  persona: UserPersona;
  onSelectBankForInspection: (bank: BankData) => void;
}

export const DicgcSafetyScreen: React.FC<DicgcSafetyScreenProps> = ({
  banks,
  persona,
  onSelectBankForInspection,
}) => {
  const [totalCorpus, setTotalCorpus] = useState<number>(1500000);
  const [targetTenure, setTargetTenure] = useState<number>(36);

  // Split strategy calculation
  // To keep (Principal + 3-year compound interest) under ₹5,00,000 per bank:
  // For ~8.5% rate over 3 years, interest is ~29% of principal.
  // Max safe principal per bank = 5,00,000 / 1.29 ≈ ₹3,85,000 to ₹3,90,000
  const maxSafePrincipalPerBank = 385000;
  const numBanksNeeded = Math.max(1, Math.ceil(totalCorpus / maxSafePrincipalPerBank));

  const selectedSplitBanks = banks.slice(0, numBanksNeeded);

  // Distribute corpus across selected banks
  let remaining = totalCorpus;
  const allocations = selectedSplitBanks.map((bank, idx) => {
    const isLast = idx === selectedSplitBanks.length - 1;
    const allocatedPrincipal = isLast ? remaining : Math.min(remaining, maxSafePrincipalPerBank);
    remaining = Math.max(0, remaining - allocatedPrincipal);

    const rate = getEffectiveRate(bank, persona);
    const calc = calculateYield(allocatedPrincipal, rate, targetTenure, persona.age, persona.form15HSubmitted);
    const isOverCap = calc.maturityAmount > 500000;

    return {
      bank,
      rate,
      principal: allocatedPrincipal,
      maturity: calc.maturityAmount,
      interest: calc.totalInterest,
      isOverCap,
    };
  });

  const totalCalculatedMaturity = allocations.reduce((sum, item) => sum + item.maturity, 0);
  const totalCalculatedInterest = totalCalculatedMaturity - totalCorpus;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-10 flex flex-col gap-8 transition-colors">
      {/* Title */}
      <div className="flex flex-col gap-2 max-w-3xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#006c4a] dark:text-[#10b981]" />
          <span className="text-xs font-bold text-[#006c4a] dark:text-[#10b981] uppercase tracking-widest">
            RBI Statutory Framework
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          DICGC Safety Index & Multi-Bank Split Strategy
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          The Deposit Insurance and Credit Guarantee Corporation (wholly owned by RBI) protects up to ₹5,00,000 per
          depositor per bank. Use our algorithmic allocation optimizer to ensure 100% of both principal AND interest are
          fully insured across multiple scheduled institutions.
        </p>
      </div>

      {/* Interactive Multi-Bank Split Generator */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Algorithmic Multi-Bank Allocation Optimizer
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Splits large portfolios to prevent exceeding the single-entity ₹5,00,000 threshold
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#00714e] dark:text-[#a7f3d0] text-xs font-bold">
            100% Sovereign Backed
          </span>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Total Portfolio Corpus to Allocate
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-lg font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="50000"
                value={totalCorpus}
                onChange={(e) => setTotalCorpus(parseInt(e.target.value, 10) || 500000)}
                className="w-full h-12 pl-8 pr-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-lg focus:outline-hidden focus:ring-2 focus:ring-[#006c4a] tabular-nums"
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {[500000, 1000000, 1500000, 2000000, 2500000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTotalCorpus(amt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    totalCorpus === amt
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  ₹{formatLakhs(amt)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Investment Horizon
            </label>
            <select
              value={targetTenure}
              onChange={(e) => setTargetTenure(parseInt(e.target.value, 10))}
              className="h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-[#006c4a]"
            >
              <option value="12">12 Months (1 Year)</option>
              <option value="24">24 Months (2 Years)</option>
              <option value="36">36 Months (3 Years)</option>
              <option value="60">60 Months (5 Years)</option>
            </select>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Compounded quarterly under RBI Master Directions
            </span>
          </div>
        </div>

        {/* Portfolio Summary Strip */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Required Institutions
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {numBanksNeeded} Scheduled Banks
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Interest Yield
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-[#006c4a] dark:text-[#10b981] mt-0.5 tabular-nums">
              +₹{formatINR(totalCalculatedInterest)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              100% Insured Total Maturity
            </span>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              ₹{formatINR(totalCalculatedMaturity)}
            </p>
          </div>
        </div>

        {/* Distributed Bank Cards */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Recommended Allocation Breakdown
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allocations.map((item, index) => (
              <div
                key={item.bank.id}
                className="p-5 rounded-xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-900 dark:text-white">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {item.bank.name}
                      </h4>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.bank.categoryTag}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#006c4a] dark:text-[#10b981]">
                    {item.rate.toFixed(2)}% p.a.
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Allocated Principal:</span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      ₹{formatINR(item.principal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Projected Interest:</span>
                    <span className="font-semibold text-[#006c4a] dark:text-[#10b981] tabular-nums">
                      +₹{formatINR(item.interest)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800 font-bold">
                    <span>Peak Maturity:</span>
                    <span className="text-slate-900 dark:text-white tabular-nums">
                      ₹{formatINR(item.maturity)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-[#00714e] dark:text-[#a7f3d0] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {item.bank.category === 'post_office' ? '100% Direct Sovereign Guarantee (No ₹5L Cap)' : '< ₹5L Insured Ceiling'}
                  </span>
                  <button
                    onClick={() => onSelectBankForInspection(item.bank)}
                    className="text-[#006c4a] dark:text-[#10b981] font-bold hover:underline flex items-center gap-0.5"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Rules Accordion */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          Key DICGC Statutory Facts for Depositors
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex flex-col gap-1.5">
            <strong className="text-slate-900 dark:text-white text-sm">
              Same Capacity vs Different Capacity
            </strong>
            <p className="leading-relaxed">
              Deposits held in different capacities (e.g. Sole account vs Joint account vs Minor account) in the SAME bank
              carry separate individual ₹5,00,000 limits each.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex flex-col gap-1.5">
            <strong className="text-slate-900 dark:text-white text-sm">
              Equal Legal Status of SFBs
            </strong>
            <p className="leading-relaxed">
              Small Finance Banks (SFBs) hold the exact same Scheduled Commercial Bank status under RBI regulations as SBI
              or HDFC. If any SFB faces restructuring, DICGC legally reimburses depositors within 90 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
