import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  ShieldCheck,
  Percent,
  SlidersHorizontal,
  ChevronRight,
  ArrowRight,
  Award,
  Building,
  CheckCircle2,
  Calendar,
  Sparkles,
  Scale,
  ExternalLink,
  Info,
  DollarSign,
  MapPin,
  UserCheck,
  FileCheck,
  ShieldAlert,
  HelpCircle,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { BankCategory, BankData, UserPersona } from '../types/bank';
import { calculateYield, formatINR, formatLakhs, getEffectiveRate } from '../utils/calculator';
import { AmortizationModal } from './AmortizationModal';

interface YieldCommandCenterProps {
  persona: UserPersona;
  setPersona: React.Dispatch<React.SetStateAction<UserPersona>>;
  banks: BankData[];
  onInspectBank: (bank: BankData) => void;
  onInvest: (bank: BankData) => void;
  comparedBankIds: string[];
  onToggleCompare: (bank: BankData) => void;
  onNavigateTab: (tab: string) => void;
}

const INDIAN_STATES = [
  'All India (Pan-India)',
  'Maharashtra',
  'Delhi',
  'Karnataka',
  'Tamil Nadu',
  'Gujarat',
  'Uttar Pradesh',
  'Telangana',
  'West Bengal',
  'Rajasthan',
  'Kerala',
  'Goa',
];

export const YieldCommandCenter: React.FC<YieldCommandCenterProps> = ({
  persona,
  setPersona,
  banks,
  onInspectBank,
  onInvest,
  comparedBankIds,
  onToggleCompare,
  onNavigateTab,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BankCategory>('all');
  const [minRatingFilter, setMinRatingFilter] = useState<string>('all');
  const [dicgcOnly, setDicgcOnly] = useState<boolean>(true);
  const [activeModalBank, setActiveModalBank] = useState<BankData | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'donut' | 'trajectory' | 'spread'>('donut');

  // Input amount handler
  const currentAmount = persona.depositType === 'RD' 
    ? (persona.monthlyInstallment ?? (persona.principal > 100000 ? 10000 : persona.principal)) 
    : persona.principal;

  const handleAmountSlider = (val: number) => {
    if (persona.depositType === 'RD') {
      setPersona((prev) => ({ ...prev, monthlyInstallment: val, principal: val }));
    } else {
      setPersona((prev) => ({ ...prev, principal: val }));
    }
  };

  const handleDepositTypeChange = (type: 'FD' | 'RD') => {
    if (type === 'RD' && persona.principal > 100000) {
      setPersona((prev) => ({
        ...prev,
        depositType: 'RD',
        monthlyInstallment: 10000,
        principal: 10000,
      }));
    } else if (type === 'FD' && persona.principal <= 25000) {
      setPersona((prev) => ({
        ...prev,
        depositType: 'FD',
        principal: 500000,
      }));
    } else {
      setPersona((prev) => ({ ...prev, depositType: type }));
    }
  };

  // State filtering logic
  const stateFilteredBanks = useMemo(() => {
    return banks.filter((b) => {
      if (persona.state === 'All India (Pan-India)') return true;
      if (b.isPanIndia) return true;
      if (b.operatingStates && b.operatingStates.includes('ALL')) return true;
      return b.operatingStates ? b.operatingStates.includes(persona.state) : true;
    });
  }, [banks, persona.state]);

  // Category and sub-filter logic
  const filteredAndRankedBanks = useMemo(() => {
    const list = stateFilteredBanks.filter((b) => {
      if (selectedCategory === 'sfb' && b.category !== 'sfb') return false;
      if (selectedCategory === 'private' && b.category !== 'private') return false;
      if (selectedCategory === 'psu' && b.category !== 'psu') return false;
      if (selectedCategory === 'taxsaver' && persona.tenureMonths !== 60 && !b.badge.includes('Tax')) return false;

      if (minRatingFilter === 'AAA' && !b.rating.includes('AAA') && !b.rating.includes('Highest')) return false;
      if (minRatingFilter === 'A+' && !b.rating.includes('AAA') && !b.rating.includes('A+') && !b.rating.includes('Highest')) return false;

      if (dicgcOnly && !b.dicgcCovered) return false;

      return true;
    });

    // Sort by effective rate descending
    return [...list].sort((a, b) => {
      const rateA = getEffectiveRate(a, persona, persona.tenureMonths);
      const rateB = getEffectiveRate(b, persona, persona.tenureMonths);
      return rateB - rateA;
    });
  }, [stateFilteredBanks, selectedCategory, minRatingFilter, dicgcOnly, persona]);

  // Top Yield Bank calculation
  const topBank = filteredAndRankedBanks[0] || banks[0];
  const topRate = getEffectiveRate(topBank, persona, persona.tenureMonths);
  const topCalculation = useMemo(() => {
    return calculateYield(
      currentAmount,
      topRate,
      persona.tenureMonths,
      persona.age,
      persona.form15HSubmitted,
      persona.depositType,
      persona.panLinked
    );
  }, [currentAmount, topRate, persona]);

  // Donut chart data
  const donutData = useMemo(() => {
    return [
      { name: 'Principal Invested', value: topCalculation.totalInvested, color: '#3b82f6' },
      { name: 'Interest Gain', value: topCalculation.totalInterest, color: '#10b981' },
    ];
  }, [topCalculation]);

  // Rate spread comparison data
  const spreadData = useMemo(() => {
    const sfbTop = stateFilteredBanks.filter(b => b.category === 'sfb')[0];
    const pvtTop = stateFilteredBanks.filter(b => b.category === 'private')[0];
    const psuTop = stateFilteredBanks.filter(b => b.category === 'psu')[0];

    return [
      {
        name: 'Top SFB',
        rate: sfbTop ? getEffectiveRate(sfbTop, persona, persona.tenureMonths) : 8.15,
        bank: sfbTop ? sfbTop.name.split(' ')[0] : 'SFB',
      },
      {
        name: 'Top Private',
        rate: pvtTop ? getEffectiveRate(pvtTop, persona, persona.tenureMonths) : 7.25,
        bank: pvtTop ? pvtTop.name.split(' ')[0] : 'Private',
      },
      {
        name: 'Top PSU',
        rate: psuTop ? getEffectiveRate(psuTop, persona, persona.tenureMonths) : 7.10,
        bank: psuTop ? psuTop.name.split(' ')[0] : 'PSU',
      },
      {
        name: 'RBI Repo',
        rate: 6.50,
        bank: 'Benchmark',
      },
    ];
  }, [stateFilteredBanks, persona]);

  // Quick preset chips
  const fdPresets = [50000, 100000, 200000, 500000, 1000000];
  const rdPresets = [2000, 5000, 10000, 25000, 50000];

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-10 gap-8">
      {/* Hero Badge & Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-[#00714e] dark:text-[#a7f3d0] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unified Yield Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Compare Top Fixed & Recurring Deposits
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time RBI-scheduled bank rate analytics, quarterly compounding simulations, and DICGC insurance guarantees.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Live Rates Synced:</span>
          <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            October 2026 Rate Cards
          </span>
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE CALCULATOR CONTROLS */}
      <section className="w-full bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs p-5 sm:p-7 flex flex-col gap-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          {/* Dual-Mode Selector (FD vs RD) */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleDepositTypeChange('FD')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                persona.depositType === 'FD'
                  ? 'bg-white dark:bg-[#1c2128] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wallet className="w-4 h-4 text-[#006c4a] dark:text-[#10b981]" />
              <span>Fixed Deposit (Lump Sum)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDepositTypeChange('RD')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                persona.depositType === 'RD'
                  ? 'bg-white dark:bg-[#1c2128] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Percent className="w-4 h-4 text-[#006c4a] dark:text-[#10b981]" />
              <span>Recurring Deposit (Monthly)</span>
            </button>
          </div>

          {/* Persona Age & Gender Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
              {persona.age >= 80 ? 'Super Senior (80+ yrs)' : persona.age >= 60 ? 'Senior (60–79 yrs)' : 'General (<60 yrs)'}
            </span>
            {persona.gender === 'female' && (
              <span className="px-2.5 py-1 rounded-full bg-pink-100 dark:bg-pink-950/70 font-bold text-pink-700 dark:text-pink-300">
                Women Bonus Active
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 font-bold text-emerald-800 dark:text-emerald-300">
              {persona.state}
            </span>
          </div>
        </div>

        {/* Amount Input & Slider */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                {persona.depositType === 'RD' ? 'Monthly Installment Amount' : 'Principal Deposit Sum'}
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {persona.depositType === 'RD' ? 'Min ₹1,000 / mo' : 'Min ₹10,000'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">
                  ₹
                </span>
                <input
                  type="text"
                  value={formatINR(currentAmount)}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '');
                    const val = parseInt(clean, 10);
                    if (!isNaN(val)) handleAmountSlider(val);
                  }}
                  className="w-full h-12 pl-9 pr-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white text-lg focus:ring-2 focus:ring-[#006c4a] focus:outline-hidden"
                />
              </div>

              <div className="hidden sm:flex flex-col justify-center px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold">In Words</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                  {formatLakhs(currentAmount)}
                </span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={persona.depositType === 'RD' ? 1000 : 10000}
              max={persona.depositType === 'RD' ? 100000 : 2500000}
              step={persona.depositType === 'RD' ? 1000 : 25000}
              value={currentAmount}
              onChange={(e) => handleAmountSlider(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#006c4a] dark:accent-[#10b981]"
              aria-label="Deposit amount slider"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Quick Pick:</span>
              {(persona.depositType === 'RD' ? rdPresets : fdPresets).map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleAmountSlider(amt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    currentAmount === amt
                      ? 'bg-[#006c4a] text-white dark:bg-[#10b981] dark:text-slate-950 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  ₹{formatLakhs(amt)} {persona.depositType === 'RD' ? '/mo' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Summary Pill for RD or FD */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Total Capital Committed:</span>
              <span className="font-extrabold text-slate-900 dark:text-white tabular-nums text-sm">
                ₹{formatINR(topCalculation.totalInvested)}
              </span>
            </div>
            {persona.depositType === 'RD' && (
              <div className="flex justify-between items-center text-slate-500">
                <span>Monthly Schedule:</span>
                <span>{persona.tenureMonths} Monthly Installments of ₹{formatINR(currentAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Selected Horizon:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {persona.tenureMonths} Months ({(persona.tenureMonths / 12).toFixed(1)} Years)
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white">Peak Market Yield:</span>
              <span className="font-extrabold text-[#006c4a] dark:text-[#10b981] text-sm tabular-nums">
                {topRate.toFixed(2)}% p.a.
              </span>
            </div>
          </div>
        </div>

        {/* Tenure Matrix & Horizon Tabs */}
        <div className="flex flex-col gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              Select Tenure Horizon
            </label>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Currently: <strong>{persona.tenureMonths} Months</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { months: 12, label: '1 Year (12M)', badge: 'Short Horizon' },
              { months: 24, label: '2 Years (24M)', badge: 'Balanced' },
              { months: 36, label: '3 Years (36M)', badge: 'Highest Yield' },
              { months: 60, label: '5 Years (60M)', badge: 'Tax Saver 80C' },
              { months: 44, label: 'Special Tenures', badge: '400D - 444D' },
            ].map((t) => (
              <button
                key={t.months}
                type="button"
                onClick={() => setPersona((prev) => ({ ...prev, tenureMonths: t.months === 44 ? 36 : t.months }))}
                className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                  persona.tenureMonths === t.months || (t.months === 44 && persona.tenureMonths === 36)
                    ? 'border-[#006c4a] bg-emerald-50/50 dark:bg-emerald-950/30 text-slate-900 dark:text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xs font-bold">{t.label}</span>
                <span className="text-[10px] text-[#006c4a] dark:text-[#10b981] font-semibold mt-0.5">
                  {t.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Persona Matrix Controls (Age, Gender, State, Form 15H) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Age Tier */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-300">Depositor Age Category</span>
            <select
              value={persona.age >= 80 ? '80' : persona.age >= 60 ? '60' : '35'}
              onChange={(e) => setPersona((prev) => ({ ...prev, age: Number(e.target.value) }))}
              className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden"
            >
              <option value="35">General Citizen (&lt;60 yrs) - Card Rate</option>
              <option value="65">Senior Citizen (60–79 yrs) - +0.50%</option>
              <option value="82">Super Senior (80+ yrs) - +0.75%</option>
            </select>
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-300">Gender Specification</span>
            <select
              value={persona.gender}
              onChange={(e) => setPersona((prev) => ({ ...prev, gender: e.target.value as 'female' | 'male' | 'other' }))}
              className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden"
            >
              <option value="female">Female (Women Bonus +0.15% & MSSC)</option>
              <option value="male">Male (Standard Card)</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* State / Jurisdiction */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-300">State / Bank Jurisdiction</span>
            <select
              value={persona.state}
              onChange={(e) => setPersona((prev) => ({ ...prev, state: e.target.value }))}
              className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden"
            >
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Form 15G/15H Toggle */}
          <div className="flex flex-col justify-center gap-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-300">TDS Exemption (15G / 15H)</span>
            <label className="flex items-center gap-2 cursor-pointer h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                checked={persona.form15HSubmitted}
                onChange={(e) => setPersona((prev) => ({ ...prev, form15HSubmitted: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {persona.form15HSubmitted ? 'Form 15G/H Active (0% TDS)' : 'No Form Submitted'}
              </span>
            </label>
          </div>
        </div>
      </section>

      {/* SECTION 2: INTERACTIVE VISUAL ANALYTICS DASHBOARD */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Summary Metrics & ROI Highlight */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Maturity Projection
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#00714e] dark:text-[#a7f3d0] text-[11px] font-bold">
                {topRate.toFixed(2)}% p.a. Compounded
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Guaranteed Maturity Payout</span>
              <p className="text-3xl font-extrabold text-[#006c4a] dark:text-[#10b981] tabular-nums mt-0.5">
                ₹{formatINR(topCalculation.maturityAmount)}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Net after TDS: ₹{formatINR(topCalculation.netMaturityWithTds)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-500">Total Invested:</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm tabular-nums mt-0.5">
                  ₹{formatINR(topCalculation.totalInvested)}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Wealth Created:</span>
                <p className="font-bold text-[#006c4a] dark:text-[#10b981] text-sm tabular-nums mt-0.5">
                  +₹{formatINR(topCalculation.totalInterest)}
                </p>
              </div>
            </div>

            {/* DICGC Protection Badge */}
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5 text-xs text-[#00714e] dark:text-[#a7f3d0]">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>
                <strong>100% Capital Protection:</strong> Up to ₹5 Lakhs principal + return insured by DICGC (RBI Subsidiary).
              </span>
            </div>

            {/* Quick Action Button */}
            <button
              type="button"
              onClick={() => onInvest(topBank)}
              className="w-full py-3 rounded-xl bg-[#006c4a] hover:bg-[#005137] dark:bg-[#10b981] dark:text-slate-950 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Book with Top Ranker ({topBank.name.split(' ')[0]})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Tabbed Interactive Chart Engine */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Interactive Wealth Growth & Spread Analytics
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Visualized based on your tenure, age category, and monthly contributions
              </span>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 self-start sm:self-auto text-xs">
              <button
                type="button"
                onClick={() => setActiveChartTab('donut')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeChartTab === 'donut'
                    ? 'bg-white dark:bg-[#1c2128] text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PieIcon className="w-3.5 h-3.5" />
                <span>Split</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('trajectory')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeChartTab === 'trajectory'
                    ? 'bg-white dark:bg-[#1c2128] text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LineIcon className="w-3.5 h-3.5" />
                <span>Growth Curve</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('spread')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  activeChartTab === 'spread'
                    ? 'bg-white dark:bg-[#1c2128] text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Rate Spread</span>
              </button>
            </div>
          </div>

          {/* Chart Rendering Area */}
          <div className="w-full h-64 sm:h-72">
            {activeChartTab === 'donut' && (
              <div className="w-full h-full flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="w-56 h-56 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: any) => `₹${formatINR(Number(val) || 0)}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Net Maturity</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      ₹{formatLakhs(topCalculation.maturityAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 text-xs w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">Total Invested:</span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      ₹{formatINR(topCalculation.totalInvested)} (
                      {((topCalculation.totalInvested / topCalculation.maturityAmount) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-slate-600 dark:text-slate-400">Wealth Created (Gain):</span>
                    <span className="font-bold text-[#006c4a] dark:text-[#10b981] tabular-nums">
                      ₹{formatINR(topCalculation.totalInterest)} (
                      {((topCalculation.totalInterest / topCalculation.maturityAmount) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[11px]">
                    Wealth multiplier: <strong>{(topCalculation.maturityAmount / topCalculation.totalInvested).toFixed(2)}x</strong> over {persona.tenureMonths} months.
                  </div>
                </div>
              </div>
            )}

            {activeChartTab === 'trajectory' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={topCalculation.timelineData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `₹${formatLakhs(val)}`}
                  />
                  <RechartsTooltip
                    formatter={(val: any) => `₹${formatINR(Number(val) || 0)}`}
                    labelFormatter={(label) => `Timeline: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    name="Account Balance"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#balanceGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'spread' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spreadData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[5, 10]} tickFormatter={(v) => `${v}%`} />
                  <RechartsTooltip formatter={(val: any) => `${Number(val).toFixed(2)}% p.a.`} />
                  <Bar dataKey="rate" name="Annual Interest Rate (%)" fill="#006c4a" radius={[6, 6, 0, 0]}>
                    {spreadData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#10b981' : index === 3 ? '#94a3b8' : '#3b82f6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3: LIVE REACTIVE BANK LEADERBOARD */}
      <section className="w-full flex flex-col gap-6">
        {/* Category Tabs & Subfilters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Institutions' },
              { id: 'sfb', label: 'Small Finance Banks (Peak Yield)' },
              { id: 'private', label: 'Private Banks (CRISIL AAA)' },
              { id: 'psu', label: 'Public Sector (Sovereign)' },
              { id: 'taxsaver', label: '5-Yr Tax Savers (80C)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id as BankCategory)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  selectedCategory === tab.id
                    ? 'bg-[#006c4a] text-white dark:bg-[#10b981] dark:text-slate-950 shadow-xs'
                    : 'bg-white dark:bg-[#161b22] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Subfilters */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Min Rating:</span>
              <select
                value={minRatingFilter}
                onChange={(e) => setMinRatingFilter(e.target.value)}
                className="h-8 px-2 rounded-lg bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden"
              >
                <option value="all">All Ratings</option>
                <option value="AAA">CRISIL AAA Only</option>
                <option value="A+">CARE / ICRA A+ &amp; above</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={dicgcOnly}
                onChange={(e) => setDicgcOnly(e.target.checked)}
                className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                DICGC Insured Only (₹5L)
              </span>
            </label>
          </div>
        </div>

        {/* Bank List Cards */}
        <div className="flex flex-col gap-4">
          {filteredAndRankedBanks.map((bank, index) => {
            const effectiveRate = getEffectiveRate(bank, persona, persona.tenureMonths);
            const calc = calculateYield(
              currentAmount,
              effectiveRate,
              persona.tenureMonths,
              persona.age,
              persona.form15HSubmitted,
              persona.depositType,
              persona.panLinked
            );
            const isCompared = comparedBankIds.includes(bank.id);

            return (
              <div
                key={bank.id}
                className="w-full bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800/80 rounded-2xl shadow-xs p-5 sm:p-6 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
              >
                {/* Left: Rank, Logo, Name & Badges */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-extrabold text-sm shrink-0">
                    #{index + 1}
                  </div>

                  <img
                    src={bank.logoUrl}
                    alt={`${bank.name} logo`}
                    className="w-12 h-12 object-contain rounded-xl border border-slate-100 dark:border-slate-800 p-1 bg-white shrink-0"
                    loading="lazy"
                  />

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {bank.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {bank.categoryTag}
                      </span>
                      {bank.badge && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#00714e] dark:text-[#a7f3d0] text-[11px] font-bold">
                          {bank.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {bank.subTitle}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1 flex-wrap">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {bank.ratingAgency}: <strong>{bank.rating}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> DICGC Insured up to ₹5L
                      </span>
                      <span>•</span>
                      <span>Min Deposit: ₹{formatINR(bank.minDeposit)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Yield, Maturity Value & Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Applied Rate</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-[#006c4a] dark:text-[#10b981] tabular-nums">
                      {effectiveRate.toFixed(2)}% p.a.
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Maturity: <strong className="text-slate-900 dark:text-white">₹{formatINR(calc.maturityAmount)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModalBank(bank)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                      title="Inspect Amortization Schedule"
                    >
                      Schedule
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleCompare(bank)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        isCompared
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isCompared ? 'Compared' : 'Compare'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onInvest(bank)}
                      className="px-4 py-2 rounded-xl bg-[#006c4a] hover:bg-[#005137] dark:bg-[#10b981] dark:text-slate-950 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
                    >
                      <span>Book Online</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Amortization Modal */}
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
