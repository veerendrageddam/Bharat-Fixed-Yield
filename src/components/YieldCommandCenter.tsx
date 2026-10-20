import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  ShieldCheck,
  Percent,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
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
  LineChart as LineIcon,
  Target,
  Clock,
  Zap,
  Flame,
  Check,
  Search,
  X
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
import { INDIAN_STATES, UNION_TERRITORIES, PAN_INDIA_OPTION } from '../data/jurisdictions';
import { LATEST_RATES_METADATA, MERGED_BANKS_REGISTRY } from '../data/bankData';
import { AmortizationModal } from './AmortizationModal';

const BankLogo: React.FC<{ src: string; name: string }> = ({ src, name }) => {
  const [hasError, setHasError] = useState(false);
  if (hasError || !src) {
    return (
      <div className="w-12 h-12 rounded-xl border border-slate-100 dark:border-slate-800 p-1 bg-emerald-50 dark:bg-emerald-950/40 text-[#006c4a] dark:text-[#10b981] flex items-center justify-center shrink-0">
        <Building className="w-6 h-6" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={`${name} logo`}
      className="w-12 h-12 object-contain rounded-xl border border-slate-100 dark:border-slate-800 p-1 bg-white shrink-0"
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

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
  const [searchQuery, setSearchQuery] = useState('');

  // Check if search query matches any merged bank
  const activeMergerNotice = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    for (const merged of Object.values(MERGED_BANKS_REGISTRY)) {
      if (
        merged.id.toLowerCase().includes(q) ||
        merged.name.toLowerCase().includes(q) ||
        q.includes('apgvb') ||
        q.includes('vikas')
      ) {
        return merged;
      }
    }
    return null;
  }, [searchQuery]);

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
      // If user is searching specifically, don't restrict to selected state
      if (searchQuery.trim()) return true;
      if (persona.state === PAN_INDIA_OPTION.name || persona.state === 'All India (Pan-India)') return true;
      if (b.isPanIndia) return true;
      if (b.operatingStates && b.operatingStates.includes('ALL')) return true;
      return b.operatingStates ? b.operatingStates.includes(persona.state) : true;
    });
  }, [banks, persona.state, searchQuery]);

  // Category and sub-filter logic
  const filteredAndRankedBanks = useMemo(() => {
    const list = stateFilteredBanks.filter((b) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.subTitle.toLowerCase().includes(q);
        const matchesMergerSuccessor = activeMergerNotice && activeMergerNotice.successorBankIds.includes(b.id);
        if (!matchesName && !matchesMergerSuccessor) return false;
      }

      // Check deposit type compatibility (FD vs RD)
      if (persona.depositType === 'RD' && b.rdSupported === false) return false;
      if (persona.depositType === 'FD' && b.fdSupported === false) return false;

      if (selectedCategory === 'sfb' && b.category !== 'sfb') return false;
      if (selectedCategory === 'rrb' && b.category !== 'rrb') return false;
      if (selectedCategory === 'private' && b.category !== 'private') return false;
      if (selectedCategory === 'psu' && b.category !== 'psu' && b.category !== 'post_office') return false;
      if (selectedCategory === 'post_office' && b.category !== 'post_office') return false;
      if (selectedCategory === 'taxsaver' && persona.tenureMonths !== 60 && !b.badge.includes('Tax')) return false;

      if (minRatingFilter === 'AAA' && !b.rating.includes('AAA') && !b.rating.includes('Highest')) return false;
      if (minRatingFilter === 'A+' && !b.rating.includes('AAA') && !b.rating.includes('A+') && !b.rating.includes('Highest')) return false;

      if (dicgcOnly && !b.dicgcCovered) return false;

      return true;
    });

    // Sort by actual offered bank rate descending (unbiased by custom rate)
    return [...list].sort((a, b) => {
      const tenureDays = persona.tenureUnit === 'days' ? (persona.tenureDays || 444) : undefined;
      const rateA = getEffectiveRate(a, { ...persona, useCustomRate: false }, persona.tenureMonths, tenureDays);
      const rateB = getEffectiveRate(b, { ...persona, useCustomRate: false }, persona.tenureMonths, tenureDays);
      return rateB - rateA;
    });
  }, [stateFilteredBanks, selectedCategory, minRatingFilter, dicgcOnly, persona, searchQuery, activeMergerNotice]);

  // Tenure Days resolution
  const activeTenureDays = persona.tenureUnit === 'days' ? (persona.tenureDays || 444) : undefined;

  // Top Yield Bank calculation
  const topBank = filteredAndRankedBanks[0] || banks[0];
  const peakMarketRate = topBank 
    ? getEffectiveRate(topBank, { ...persona, useCustomRate: false }, persona.tenureMonths, activeTenureDays) 
    : 8.40;

  // Active Simulation Rate: driven by custom rate if enabled, else peak market rate
  const activeSimulationRate = persona.useCustomRate && persona.customRate !== undefined
    ? persona.customRate
    : peakMarketRate;

  const topCalculation = useMemo(() => {
    return calculateYield(
      currentAmount,
      activeSimulationRate,
      persona.tenureMonths,
      persona.age,
      persona.form15HSubmitted,
      persona.depositType,
      persona.panLinked,
      activeTenureDays
    );
  }, [currentAmount, activeSimulationRate, persona.tenureMonths, persona.age, persona.form15HSubmitted, persona.depositType, persona.panLinked, activeTenureDays]);

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
    const postTop = stateFilteredBanks.filter(b => b.category === 'post_office')[0];

    const data: Array<{ name: string; rate: number; bank: string }> = [];

    if (persona.useCustomRate && persona.customRate !== undefined) {
      data.push({
        name: 'Your Target',
        rate: persona.customRate,
        bank: 'Custom %',
      });
    }

    data.push(
      {
        name: 'Top SFB',
        rate: sfbTop ? getEffectiveRate(sfbTop, { ...persona, useCustomRate: false }, persona.tenureMonths, activeTenureDays) : 8.15,
        bank: sfbTop ? sfbTop.name.split(' ')[0] : 'SFB',
      },
      {
        name: 'Top Private',
        rate: pvtTop ? getEffectiveRate(pvtTop, { ...persona, useCustomRate: false }, persona.tenureMonths, activeTenureDays) : 7.75,
        bank: pvtTop ? pvtTop.name.split(' ')[0] : 'Private',
      },
      {
        name: 'Top PSU',
        rate: psuTop ? getEffectiveRate(psuTop, { ...persona, useCustomRate: false }, persona.tenureMonths, activeTenureDays) : 7.40,
        bank: psuTop ? psuTop.name.split(' ')[0] : 'PSU',
      },
      {
        name: 'India Post',
        rate: postTop ? getEffectiveRate(postTop, { ...persona, useCustomRate: false }, persona.tenureMonths, activeTenureDays) : 7.10,
        bank: 'Sovereign PO',
      },
      {
        name: 'RBI Repo',
        rate: 6.50,
        bank: 'Benchmark',
      }
    );

    return data;
  }, [stateFilteredBanks, persona, activeTenureDays]);

  // Quick preset chips
  const fdPresets = [50000, 100000, 200000, 500000, 1000000];
  const rdPresets = [2000, 5000, 10000, 25000, 50000];
  const customRateQuickPicks = [7.00, 7.50, 8.00, 8.25, 8.40, 8.75, 9.00];

  // Number of banks beating custom rate
  const banksMeetingTargetCount = useMemo(() => {
    if (!persona.useCustomRate || persona.customRate === undefined) return 0;
    return filteredAndRankedBanks.filter(b => {
      const rate = getEffectiveRate(b, { ...persona, useCustomRate: false }, persona.tenureMonths, activeTenureDays);
      return rate >= (persona.customRate ?? 0);
    }).length;
  }, [filteredAndRankedBanks, persona, activeTenureDays]);

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
                {persona.tenureUnit === 'days'
                  ? `${activeTenureDays} Days (${((activeTenureDays || 444) / 365).toFixed(2)} Years)`
                  : `${persona.tenureMonths} Months (${(persona.tenureMonths / 12).toFixed(1)} Years)`}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-white">Active Simulation Yield:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  persona.useCustomRate 
                    ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300' 
                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                }`}>
                  {persona.useCustomRate ? 'Custom Target' : 'Peak Market Rate'}
                </span>
              </div>
              <span className="font-extrabold text-[#006c4a] dark:text-[#10b981] text-sm tabular-nums">
                {activeSimulationRate.toFixed(2)}% p.a.
              </span>
            </div>
          </div>
        </div>

        {/* TENURE SELECTOR: STANDARD MONTHS VS SPECIAL ODD-DAY SCHEMES */}
        <div className="flex flex-col gap-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#006c4a] dark:text-[#10b981]" />
              <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Tenure Horizon & Special Bank Schemes
              </label>
            </div>

            {/* Toggle: Standard Months vs Special Odd-Day Schemes */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPersona((prev) => ({ ...prev, tenureUnit: 'months' }))}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  persona.tenureUnit !== 'days'
                    ? 'bg-white dark:bg-[#1c2128] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Standard (Months)
              </button>
              <button
                type="button"
                onClick={() => setPersona((prev) => ({ 
                  ...prev, 
                  tenureUnit: 'days',
                  tenureDays: prev.tenureDays || 444
                }))}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  persona.tenureUnit === 'days'
                    ? 'bg-white dark:bg-[#1c2128] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Special Schemes (Odd Days)</span>
              </button>
            </div>
          </div>

          {/* Standard Months Selector */}
          {persona.tenureUnit !== 'days' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { months: 12, label: '1 Year (12M)', badge: 'Short Horizon' },
                { months: 24, label: '2 Years (24M)', badge: 'Balanced Growth' },
                { months: 36, label: '3 Years (36M)', badge: 'Highest Regular Yield' },
                { months: 60, label: '5 Years (60M)', badge: 'Tax Saver 80C' },
              ].map((t) => (
                <button
                  key={t.months}
                  type="button"
                  onClick={() => setPersona((prev) => ({ ...prev, tenureMonths: t.months }))}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                    persona.tenureMonths === t.months
                      ? 'border-[#006c4a] bg-emerald-50/60 dark:bg-emerald-950/40 text-slate-900 dark:text-white shadow-xs'
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
          ) : (
            /* Special Bank Schemes (Odd Days) Grid & Custom Days Input */
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {[
                  { days: 222, label: '222 Days', badge: 'Short Sprint' },
                  { days: 333, label: '333 Days', badge: 'Special Fest' },
                  { days: 399, label: '399 Days', badge: 'BoB Tiranga (7.25%)' },
                  { days: 400, label: '400 Days', badge: 'SBI Kalash (7.10%)' },
                  { days: 444, label: '444 Days', badge: 'SBI Vrishti / APGB' },
                  { days: 555, label: '555 Days', badge: 'Sovereign High' },
                  { days: 777, label: '777 Days', badge: 'Utkarsh (8.15%)' },
                  { days: 1001, label: '1001 Days', badge: 'Unity Peak (8.40%)' },
                ].map((s) => (
                  <button
                    key={s.days}
                    type="button"
                    onClick={() => setPersona((prev) => ({
                      ...prev,
                      tenureUnit: 'days',
                      tenureDays: s.days,
                      tenureMonths: Math.round(s.days / 30.416)
                    }))}
                    className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                      activeTenureDays === s.days
                        ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-slate-900 dark:text-white ring-1 ring-amber-500 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-extrabold">{s.label}</span>
                    <span className="text-[9px] text-amber-700 dark:text-amber-300 font-semibold mt-0.5 truncate w-full">
                      {s.badge}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Odd-Days Direct Input */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Custom Days Input:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPersona((prev) => ({
                        ...prev,
                        tenureDays: Math.max(30, (prev.tenureDays || 444) - 15),
                        tenureMonths: Math.round(Math.max(30, (prev.tenureDays || 444) - 15) / 30.416)
                      }))}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    >
                      -15D
                    </button>
                    <input
                      type="number"
                      min={7}
                      max={3650}
                      value={activeTenureDays || 444}
                      onChange={(e) => {
                        const days = parseInt(e.target.value, 10);
                        if (!isNaN(days) && days > 0) {
                          setPersona((prev) => ({
                            ...prev,
                            tenureDays: days,
                            tenureMonths: Math.round(days / 30.416)
                          }));
                        }
                      }}
                      className="w-24 h-9 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-extrabold text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#006c4a]"
                    />
                    <button
                      type="button"
                      onClick={() => setPersona((prev) => ({
                        ...prev,
                        tenureDays: (prev.tenureDays || 444) + 15,
                        tenureMonths: Math.round(((prev.tenureDays || 444) + 15) / 30.416)
                      }))}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    >
                      +15D
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Days ({( (activeTenureDays || 444) / 365).toFixed(2)} Years)</span>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Compounding: <strong>Quarterly (Fractional Quarters)</strong> as per RBI Master Directions
                </div>
              </div>

              {/* Informational Callout on ALM */}
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <p>
                  <strong>Why Odd Days (222D, 399D, 444D, 555D, 777D, 1001D)?</strong> Banks launch non-standard tenures for Asset-Liability Management (ALM) to match commercial loan maturities and festive liquidity without raising card rates across standard 1Y–5Y tenures. For odd days D, interest compounds every 90 days via A = P(1 + r/400)^(4 × D / 365).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CUSTOM RATE MODELING MODULE */}
        <div className="flex flex-col gap-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Interest Rate Modeling: Live Market vs Custom Target (%)
              </label>
            </div>

            {/* Toggle: Best Market Rate vs Custom Rate */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPersona((prev) => ({ ...prev, useCustomRate: false }))}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  !persona.useCustomRate
                    ? 'bg-white dark:bg-[#1c2128] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>Auto-Sync Best Market Rate ({peakMarketRate.toFixed(2)}%)</span>
              </button>
              <button
                type="button"
                onClick={() => setPersona((prev) => ({
                  ...prev,
                  useCustomRate: true,
                  customRate: prev.customRate || 8.00
                }))}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  persona.useCustomRate
                    ? 'bg-white dark:bg-[#1c2128] text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-purple-500" />
                <span>Custom Target Rate (%)</span>
              </button>
            </div>
          </div>

          {/* Custom Rate Interactive Panel */}
          {persona.useCustomRate && (
            <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Your Target Interest Rate:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPersona((prev) => ({
                        ...prev,
                        customRate: Math.max(3.0, Number(((prev.customRate || 8.0) - 0.10).toFixed(2)))
                      }))}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    >
                      -0.10%
                    </button>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.05"
                        min="3.0"
                        max="15.0"
                        value={persona.customRate ?? 8.0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            setPersona((prev) => ({ ...prev, customRate: val }));
                          }
                        }}
                        className="w-24 h-9 pl-3 pr-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-extrabold text-sm text-purple-700 dark:text-purple-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        %
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPersona((prev) => ({
                        ...prev,
                        customRate: Math.min(15.0, Number(((prev.customRate || 8.0) + 0.10).toFixed(2)))
                      }))}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    >
                      +0.10%
                    </button>
                  </div>
                </div>

                {/* Quick rate chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-medium">Quick Target:</span>
                  {customRateQuickPicks.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setPersona((prev) => ({ ...prev, customRate: rate }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        persona.customRate === rate
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {rate.toFixed(2)}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider for smooth dragging */}
              <input
                type="range"
                min="4.00"
                max="12.00"
                step="0.05"
                value={persona.customRate ?? 8.0}
                onChange={(e) => setPersona((prev) => ({ ...prev, customRate: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-purple-200 dark:bg-purple-900/60 rounded-lg appearance-none cursor-pointer accent-purple-600"
                aria-label="Custom percentage rate slider"
              />

              {/* Live Target Analysis readout */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-600 dark:text-slate-300">
                  {banksMeetingTargetCount > 0 ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> {banksMeetingTargetCount} bank(s) offer rates meeting or beating your {(persona.customRate ?? 8.0).toFixed(2)}% target!
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> Highest bank offer is {peakMarketRate.toFixed(2)}% (Unity SFB). Your {(persona.customRate ?? 8.0).toFixed(2)}% target exceeds market offers.
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Directly drives all maturity growth simulations and timeline charts
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Persona Matrix Controls (Age, Gender, State, Form 15H) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Age Tier */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="persona-age-select" className="font-bold text-slate-700 dark:text-slate-300">
              Depositor Age Category
            </label>
            <div className="relative">
              <select
                id="persona-age-select"
                aria-label="Depositor Age Category"
                value={persona.age >= 80 ? '80' : persona.age >= 60 ? '60' : '35'}
                onChange={(e) => setPersona((prev) => ({ ...prev, age: Number(e.target.value) }))}
                className="w-full h-10 pl-3 pr-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold appearance-none cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#006c4a] dark:focus-visible:ring-[#10b981]"
              >
                <option value="35">General Citizen (&lt;60 yrs) - Card Rate</option>
                <option value="65">Senior Citizen (60–79 yrs) - +0.50%</option>
                <option value="82">Super Senior (80+ yrs) - +0.75%</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="persona-gender-select" className="font-bold text-slate-700 dark:text-slate-300">
              Gender Specification
            </label>
            <div className="relative">
              <select
                id="persona-gender-select"
                aria-label="Gender Specification"
                value={persona.gender}
                onChange={(e) => setPersona((prev) => ({ ...prev, gender: e.target.value as 'female' | 'male' | 'other' }))}
                className="w-full h-10 pl-3 pr-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold appearance-none cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#006c4a] dark:focus-visible:ring-[#10b981]"
              >
                <option value="female">Female (Women Bonus +0.15% & MSSC)</option>
                <option value="male">Male (Standard Card)</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* State / Jurisdiction */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="persona-state-select" className="font-bold text-slate-700 dark:text-slate-300">
              State / Bank Jurisdiction
            </label>
            <div className="relative">
              <select
                id="persona-state-select"
                aria-label="State and Bank Jurisdiction"
                value={persona.state}
                onChange={(e) => setPersona((prev) => ({ ...prev, state: e.target.value }))}
                className="w-full h-10 pl-3 pr-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold appearance-none cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#006c4a] dark:focus-visible:ring-[#10b981]"
              >
                <optgroup label="Pan-India">
                  <option value={PAN_INDIA_OPTION.name}>{PAN_INDIA_OPTION.name}</option>
                </optgroup>
                <optgroup label="28 States">
                  {INDIAN_STATES.map((st) => (
                    <option key={st.id} value={st.name}>
                      {st.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="8 Union Territories">
                  {UNION_TERRITORIES.map((ut) => (
                    <option key={ut.id} value={ut.name}>
                      {ut.name} (UT)
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
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
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                persona.useCustomRate
                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-[#00714e] dark:text-[#a7f3d0]'
              }`}>
                {activeSimulationRate.toFixed(2)}% p.a. {persona.useCustomRate ? '(Custom Target)' : 'Compounded'}
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
        {/* Verification Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 sm:p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Live RBI & Scheduled Bank Rate Cards
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Automated weekly sync pipeline actively tracks official circulars & rate revisions
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-[#161b22] px-3 py-1.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[#006c4a] dark:text-[#10b981]" />
            <span>Verified: {new Date(LATEST_RATES_METADATA.lastUpdated).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Search & Merger Resolution Bar */}
        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="bank-search-input"
              aria-label="Search banks or erstwhile merged entities"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bank name or erstwhile merged entities (e.g., APGVB, APGB, TGB, SBI, HDFC)..."
              className="w-full h-11 pl-10 pr-9 rounded-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Smart Amalgamation / Merger Guidance Banner */}
          {activeMergerNotice && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 flex items-start gap-3 transition-all">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1.5 text-xs sm:text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-amber-900 dark:text-amber-200">
                    {activeMergerNotice.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-extrabold text-[10px] tracking-wider uppercase">
                    Amalgamated / Restructured
                  </span>
                </div>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                  {activeMergerNotice.notice}
                </p>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="font-semibold text-amber-900 dark:text-amber-200 text-xs">
                    Successor Banks:
                  </span>
                  {activeMergerNotice.successorBankNames.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white dark:bg-[#161b22] text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold text-xs shadow-2xs"
                    >
                      ✓ {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category Tabs & Subfilters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Institutions' },
              { id: 'sfb', label: 'Small Finance Banks (Peak Yield)' },
              { id: 'private', label: 'Private Banks (HDFC, ICICI, Axis, IDFC, Yes)' },
              { id: 'psu', label: 'Public Sector (SBI, BoB, Union, Canara)' },
              { id: 'post_office', label: 'India Post (Post Office RD & FD)' },
              { id: 'rrb', label: 'Regional Rural & State Banks' },
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
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-bold" aria-live="polite">
              <span>{filteredAndRankedBanks.length} Banks Available</span>
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="min-rating-filter" className="text-slate-500 font-medium">Min Rating:</label>
              <div className="relative">
                <select
                  id="min-rating-filter"
                  aria-label="Filter by minimum credit rating"
                  value={minRatingFilter}
                  onChange={(e) => setMinRatingFilter(e.target.value)}
                  className="h-8 pl-2.5 pr-7 rounded-lg bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold appearance-none cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#006c4a]"
                >
                  <option value="all">All Ratings</option>
                  <option value="AAA">CRISIL AAA Only</option>
                  <option value="A+">CARE / ICRA A+ &amp; above</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={dicgcOnly}
                onChange={(e) => setDicgcOnly(e.target.checked)}
                className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                DICGC Insured Only (₹5L)
              </span>
            </label>
          </div>
        </div>

        {/* Bank List Cards */}
        <div className="flex flex-col gap-4">
          {filteredAndRankedBanks.length === 0 ? (
            <div className="w-full bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center">
                <Search className="w-7 h-7" />
              </div>
              <div className="max-w-md flex flex-col gap-1.5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  No Banks Match Your Criteria
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {searchQuery ? (
                    <>
                      No institutions match <strong className="text-slate-800 dark:text-slate-200">&ldquo;{searchQuery}&rdquo;</strong> under the current state and category filters.
                    </>
                  ) : (
                    'No institutions found with the selected credit rating or jurisdiction filters.'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setMinRatingFilter('all');
                  setDicgcOnly(false);
                  setPersona((prev) => ({ ...prev, state: 'Pan-India' }));
                }}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#006c4a] hover:bg-[#005137] dark:bg-[#10b981] dark:text-slate-950 text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Reset All Filters &amp; Search
              </button>
            </div>
          ) : (
            filteredAndRankedBanks.map((bank, index) => {
            const effectiveRate = getEffectiveRate(bank, { ...persona, useCustomRate: false }, persona.tenureMonths, activeTenureDays);
            const calc = calculateYield(
              currentAmount,
              effectiveRate,
              persona.tenureMonths,
              persona.age,
              persona.form15HSubmitted,
              persona.depositType,
              persona.panLinked,
              activeTenureDays
            );
            const isCompared = comparedBankIds.includes(bank.id);
            const matchedScheme = activeTenureDays 
              ? bank.specialSchemes?.find(s => s.days === activeTenureDays) 
              : undefined;

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

                  <BankLogo src={bank.logoUrl} name={bank.name} />

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {bank.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {bank.categoryTag}
                      </span>
                      {bank.sponsorGovt && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[11px] font-bold">
                          🏛️ {bank.sponsorGovt}
                        </span>
                      )}
                      {matchedScheme && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 text-[11px] font-bold border border-amber-300 dark:border-amber-800 flex items-center gap-1 shadow-2xs">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>{matchedScheme.name} ({matchedScheme.days}D @ {matchedScheme.rate}%)</span>
                        </span>
                      )}
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
                      {!bank.isPanIndia && bank.operatingStates && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-semibold flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Operating in: {bank.operatingStates.join(', ')}
                        </span>
                      )}
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
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Applied Rate</span>
                      {persona.useCustomRate && persona.customRate !== undefined && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          effectiveRate >= persona.customRate
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}>
                          {effectiveRate >= persona.customRate
                            ? `+${(effectiveRate - persona.customRate).toFixed(2)}% vs target`
                            : `${(effectiveRate - persona.customRate).toFixed(2)}% vs target`}
                        </span>
                      )}
                    </div>
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
          })
        )}
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
