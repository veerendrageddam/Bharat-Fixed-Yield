import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  PiggyBank,
  Gavel,
  SlidersHorizontal,
  ShieldCheck,
  ChevronRight,
  BookmarkCheck,
  Bookmark,
  ExternalLink,
  ArrowRight,
  Shield,
  Star,
  Scale
} from 'lucide-react';
import { BankCategory, BankData, UserPersona } from '../types/bank';
import { calculateYield, formatINR, getEffectiveRate } from '../utils/calculator';
import { AmortizationModal } from './AmortizationModal';

interface LeaderboardScreenProps {
  persona: UserPersona;
  banks: BankData[];
  onEditParameters: () => void;
  onInspectBank: (bank: BankData) => void;
  onInvest: (bank: BankData) => void;
  comparedBankIds: string[];
  onToggleCompare: (bank: BankData) => void;
  onNavigateTab: (tab: string) => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  persona,
  banks,
  onEditParameters,
  onInspectBank,
  onInvest,
  comparedBankIds,
  onToggleCompare,
  onNavigateTab,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BankCategory>('sfb');
  const [minRatingFilter, setMinRatingFilter] = useState<string>('all');
  const [dicgcOnly, setDicgcOnly] = useState<boolean>(true);
  const [payoutMode, setPayoutMode] = useState<'cumulative' | 'monthly'>('cumulative');
  const [activeModalBank, setActiveModalBank] = useState<BankData | null>(null);

  // Filter banks based on category & sub-filters
  const filteredBanks = banks.filter((b) => {
    if (selectedCategory === 'sfb' && b.category !== 'sfb') return false;
    if (selectedCategory === 'private' && b.category !== 'private') return false;
    if (selectedCategory === 'psu' && b.category !== 'psu') return false;
    if (selectedCategory === 'taxsaver' && b.tenureMonths !== 60 && !b.badge.includes('Tax')) return false;

    if (minRatingFilter === 'AAA' && !b.rating.includes('AAA') && !b.rating.includes('Highest')) return false;
    if (minRatingFilter === 'A+' && !b.rating.includes('AAA') && !b.rating.includes('A+') && !b.rating.includes('Highest')) return false;

    if (dicgcOnly && !b.dicgcCovered) return false;

    return true;
  });

  // Calculate highest yield bank
  const topBank = banks.reduce((max, b) => {
    const rateA = getEffectiveRate(b, persona);
    const rateMax = getEffectiveRate(max, persona);
    return rateA > rateMax ? b : max;
  }, banks[0]);

  const topRate = getEffectiveRate(topBank, persona);
  const topCalculation = calculateYield(persona.principal, topRate, persona.tenureMonths, persona.age, persona.form15HSubmitted);

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-10 gap-8 sm:gap-10">
      {/* Top Active Persona Bar */}
      <div className="w-full flex flex-col gap-4">
        <div className="w-full p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-[#00714e] dark:text-[#a7f3d0] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Active Persona
            </span>
            <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              {persona.age >= 60 ? `Senior Citizen (Age ${persona.age})` : `General Depositor (Age ${persona.age})`}
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              ₹{formatINR(persona.principal)} Principal
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {persona.tenureMonths / 12} Years ({persona.tenureMonths} Mo)
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 capitalize">
              {persona.compounding} Compounding
            </span>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {persona.state} Jurisdiction
            </span>
          </div>

          <button
            onClick={onEditParameters}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Edit Parameters</span>
          </button>
        </div>

        {/* 4 Key Metric Cards Hierarchy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Principal Invested */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Principal Invested
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                ₹{formatINR(persona.principal)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {persona.principal <= 500000 ? '100% DICGC Insurable allocation' : 'Exceeds single-bank ₹5L limit'}
              </p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
              <div
                className="bg-slate-900 dark:bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (persona.principal / 500000) * 100)}%` }}
              />
            </div>
          </div>

          {/* Metric 2: Max Interest Earnable */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#006c4a] dark:text-[#10b981]">
                Max Interest Earnable
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#00714e] dark:text-[#a7f3d0]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#006c4a] dark:text-[#10b981] tracking-tight tabular-nums">
                ₹{formatINR(topCalculation.totalInterest)}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-[#00714e] dark:text-[#a7f3d0] text-[11px] font-bold tabular-nums">
                  Peak {topRate.toFixed(2)}% p.a.
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {persona.age >= 60 ? '+0.50% Sr. Bonus' : 'Standard Rate'}
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
              <div
                className="bg-[#006c4a] dark:bg-[#10b981] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (topCalculation.totalInterest / persona.principal) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Metric 3: Peak Maturity Value */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Peak Maturity Value
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                ₹{formatINR(topCalculation.maturityAmount)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Effective Yield: <span className="font-semibold text-slate-800 dark:text-slate-200">{topCalculation.effectiveAnnualYield}%</span> (Compounded)
              </p>
            </div>
            {/* SVG Trend Sparkline */}
            <div className="w-full mt-3 pt-1">
              <svg className="w-full h-4 text-[#006c4a] dark:text-[#10b981]" fill="none" viewBox="0 0 100 20">
                <path
                  d="M0 18 Q 30 15, 55 10 T 100 2"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </div>

          {/* Metric 4: TDS Section 194A Notice */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#2f1500] dark:bg-[#201004] text-amber-100 border border-amber-900/60 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Gavel className="w-4 h-4 text-amber-300" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  TDS Section 194A
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 text-[10px] font-bold">
                {persona.age >= 60 ? 'Form 15H' : 'Form 15G'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-sm text-white">TDS Impact Advisory</span>
              <p className="text-xs text-amber-200/90 leading-snug">
                TDS Applicable (10% without 15H: ~₹{formatINR(topCalculation.estimatedTdsYear3 || 4715)}/yr). Form 15H eligible if total taxable income &lt; exemption limit (₹3,00,000).
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('tax-guide')}
              className="mt-3 text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1 transition-colors group"
            >
              <span>Download Form 15H Guidance</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard Section & Filters */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Scheduled Bank Leaderboard
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Live verified annual yield tables compliant with RBI Interest Rate Circulars
            </p>
          </div>

          {/* Live Monitored Count Badge */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-[#006c4a] dark:bg-[#10b981] animate-pulse" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              34 Scheduled Banks Monitored Daily
            </span>
          </div>
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-2 sm:p-2.5 bg-slate-100 dark:bg-slate-850/80 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          {/* Main Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5" id="categoryPillGroup">
            <button
              onClick={() => setSelectedCategory('sfb')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                selectedCategory === 'sfb'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span>⚡</span>
              <span>Highest Return (SFBs)</span>
            </button>
            <button
              onClick={() => setSelectedCategory('private')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                selectedCategory === 'private'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span>🏢</span>
              <span>Top Scheduled Commercial (HDFC/ICICI)</span>
            </button>
            <button
              onClick={() => setSelectedCategory('psu')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                selectedCategory === 'psu'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span>🏛️</span>
              <span>Public Sector Giants (SBI/PNB/BoB)</span>
            </button>
            <button
              onClick={() => setSelectedCategory('taxsaver')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                selectedCategory === 'taxsaver'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span>🛡️</span>
              <span>Tax Saver (5-Yr Section 80C)</span>
            </button>
          </div>

          {/* Sub Filters */}
          <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-auto pt-2 lg:pt-0">
            {/* Min Rating Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-2xs border border-slate-200/80 dark:border-slate-700">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Min Rating:</span>
              <select
                value={minRatingFilter}
                onChange={(e) => setMinRatingFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="all" className="dark:bg-slate-800">All Ratings</option>
                <option value="AAA" className="dark:bg-slate-800">AAA / Stable</option>
                <option value="A+" className="dark:bg-slate-800">A+ and Above</option>
              </select>
            </div>

            {/* DICGC Checkbox Toggle */}
            <label className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dicgcOnly}
                onChange={(e) => setDicgcOnly(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 accent-[#006c4a] focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-bold text-[#00714e] dark:text-[#a7f3d0]">
                DICGC Only
              </span>
            </label>

            {/* Payout Frequency */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-2xs border border-slate-200/80 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Payout:</span>
              <select
                value={payoutMode}
                onChange={(e) => setPayoutMode(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="cumulative" className="dark:bg-slate-800">Cumulative</option>
                <option value="monthly" className="dark:bg-slate-800">Monthly</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Ranked Bank Cards List */}
      <div className="flex flex-col gap-6" id="bankComparisonList">
        {filteredBanks.map((bank, index) => {
          const effectiveRate = getEffectiveRate(bank, persona);
          const tenureMonths = selectedCategory === 'taxsaver' ? 60 : persona.tenureMonths;
          const calc = calculateYield(persona.principal, effectiveRate, tenureMonths, persona.age, persona.form15HSubmitted);
          const isRank1 = index === 0;
          const isCompared = comparedBankIds.includes(bank.id);

          return (
            <div
              key={bank.id}
              className="bank-card p-5 sm:p-7 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col gap-5 relative overflow-hidden"
            >
              {/* Visual Accent Tag on Left Edge */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  isRank1 ? 'bg-[#006c4a] dark:bg-[#10b981]' : index === 1 ? 'bg-emerald-400' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />

              {/* Top Header & Badges */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
                  {/* Rank Marker */}
                  <div
                    className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold ${
                      isRank1
                        ? 'bg-[#006c4a] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] uppercase leading-none opacity-80">Rank</span>
                    <span className="text-base leading-none mt-0.5">#{index + 1}</span>
                  </div>

                  {/* Bank Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                      <img
                        className="w-full h-full object-contain"
                        alt={`${bank.name} logo`}
                        src={bank.logoUrl}
                        onError={(e) => {
                          // Fallback styled emblem if image fails
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                          {bank.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-semibold">
                          {bank.categoryTag}
                        </span>
                        {bank.badge && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-[#00714e] dark:text-[#a7f3d0] text-[11px] font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            {bank.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {bank.subTitle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rating Chip */}
                <div className="flex items-center gap-2 self-start lg:self-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {bank.ratingAgency} Rating:
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold border border-slate-200/80 dark:border-slate-700">
                    {bank.rating}
                  </span>
                </div>
              </div>

              {/* 3-Column Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                {/* Stat 1: Applied Rate */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Applied Interest Rate
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-[#006c4a] dark:text-[#10b981] tabular-nums">
                      {effectiveRate.toFixed(2)}%
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">p.a.</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {persona.age >= 60 ? (
                      <>
                        Includes <span className="font-bold text-slate-900 dark:text-white">+{bank.seniorBonus.toFixed(2)}% Senior Citizen</span> bonus. Regular: {bank.baseRate.toFixed(2)}% p.a.
                      </>
                    ) : (
                      <>
                        General depositor rate. Senior bonus: +{bank.seniorBonus.toFixed(2)}% p.a.
                      </>
                    )}
                  </p>
                </div>

                {/* Stat 2: Maturity Amount */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Maturity Amount ({tenureMonths} Mo)
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                      ₹{formatINR(calc.maturityAmount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Total Interest:</span>
                    <span className="font-bold text-[#006c4a] dark:text-[#10b981] tabular-nums">
                      ₹{formatINR(calc.totalInterest)}
                    </span>
                  </div>
                </div>

                {/* Stat 3: Effective Annual Yield */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Effective Annual Yield
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {calc.effectiveAnnualYield}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Due to quarterly compounding under RBI Master Circular rules.
                  </p>
                </div>
              </div>

              {/* Safety & Note Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#006c4a] dark:text-[#10b981] shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white">DICGC Insured up to ₹5 Lakhs per depositor.</strong>{' '}
                    {bank.notes}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#006c4a] dark:text-[#10b981] uppercase tracking-wider shrink-0">
                  Safe Allocation Match
                </span>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <button
                  onClick={() => onInspectBank(bank)}
                  className="text-xs sm:text-sm font-bold text-[#006c4a] dark:text-[#10b981] hover:underline flex items-center gap-1 self-start sm:self-auto transition-colors"
                >
                  <span>View Interest Schedule & TDS Matrix</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => onToggleCompare(bank)}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                      isCompared
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-[#00714e] dark:text-[#a7f3d0] border border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isCompared ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    <span>{isCompared ? 'Compared' : 'Compare'}</span>
                  </button>

                  <button
                    onClick={() => onInvest(bank)}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#006c4a] hover:bg-[#005137] dark:bg-[#10b981] dark:text-slate-950 dark:hover:bg-[#059669] text-white text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>Invest / Open FD</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Statutory DICGC Guidance Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-[#00714e] dark:text-[#a7f3d0] flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                DICGC Safety & Capital Allocation Advisory
              </h4>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                RBI Subsidiary Guarantee
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-4xl leading-relaxed">
              Under the Deposit Insurance and Credit Guarantee Corporation (DICGC) Act, deposits up to{' '}
              <strong className="text-slate-900 dark:text-white">₹5,00,000 (Rupees Five Lakh)</strong> encompassing both
              cumulative principal and accrued interest across all accounts of each depositor in each commercial and small
              finance bank are 100% legally secured. For portfolios exceeding ₹5 Lakhs, distribute deposits across separate
              scheduled banking entities to guarantee comprehensive protection.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('dicgc-index')}
          className="shrink-0 px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-bold transition-colors flex items-center gap-2"
        >
          <span>Learn Multi-Bank Split Strategy</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Quick Amortization Modal */}
      {activeModalBank && (
        <AmortizationModal
          bank={activeModalBank}
          persona={persona}
          onClose={() => setActiveModalBank(null)}
          onInvest={onInvest}
        />
      )}
    </div>
  );
};
