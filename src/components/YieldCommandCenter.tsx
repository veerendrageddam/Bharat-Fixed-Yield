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
  X,
  Flag
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
import { calculateYield, formatINR, formatLakhs, getEffectiveRate, isTenureSupported } from '../utils/calculator';
import { INDIAN_STATES, UNION_TERRITORIES, PAN_INDIA_OPTION } from '../data/jurisdictions';
import { LATEST_RATES_METADATA, MERGED_BANKS_REGISTRY } from '../data/bankData';
import { AmortizationModal } from './AmortizationModal';
import { useTheme } from '../context/ThemeContext';

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
  onReportRate?: (bank: BankData) => void;
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
  onReportRate,
}) => {
  const { isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<BankCategory>('all');
  const [minRatingFilter, setMinRatingFilter] = useState<string>('all');
  const [dicgcOnly, setDicgcOnly] = useState<boolean>(true);
  const [activeModalBank, setActiveModalBank] = useState<BankData | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'donut' | 'trajectory' | 'spread'>('donut');
  const [searchQuery, setSearchQuery] = useState('');
  const [regionalOnly, setRegionalOnly] = useState<boolean>(false);
  const [tenureDisplayUnit, setTenureDisplayUnit] = useState<'years' | 'months'>('years');

  const chartTooltipStyle = useMemo(
    () => ({
      contentStyle: {
        backgroundColor: isDark ? '#161b22' : '#ffffff',
        borderColor: isDark ? '#30363d' : '#e2e8f0',
        color: isDark ? '#f0f3f6' : '#191c1e',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontSize: '12px',
        fontWeight: 600,
      },
      itemStyle: {
        color: isDark ? '#f0f3f6' : '#191c1e',
      },
      labelStyle: {
        color: isDark ? '#9ba3af' : '#64748b',
        fontWeight: 700,
      },
    }),
    [isDark]
  );



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
    if (type === 'RD') {
      setPersona((prev) => ({
        ...prev,
        depositType: 'RD',
        compounding: 'maturity', // RD is strictly cumulative
        tenureUnit: 'months', // Force standard monthly schedules for RD (odd days not applicable)
        monthlyInstallment: prev.monthlyInstallment ?? (prev.principal > 100000 ? 10000 : prev.principal),
        principal: prev.monthlyInstallment ?? (prev.principal > 100000 ? 10000 : prev.principal),
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
      if (
        persona.state === PAN_INDIA_OPTION.name ||
        persona.state === 'All India (Pan-India)' ||
        persona.state === 'Pan-India' ||
        persona.state === 'All India'
      ) return true;
      if (b.isPanIndia) return true;
      if (b.operatingStates && b.operatingStates.includes('ALL')) return true;
      return b.operatingStates ? b.operatingStates.includes(persona.state) : true;
    });
  }, [banks, persona.state, searchQuery]);

  // Banks filtered by active state, deposit type (FD vs RD), and active tenure availability
  const depositTypeAndStateFilteredBanks = useMemo(() => {
    const activeTenureDays = persona.tenureUnit === 'days' ? (persona.tenureDays || 444) : undefined;
    return stateFilteredBanks.filter((b) => {
      if (persona.depositType === 'RD' && b.rdSupported === false) return false;
      if (persona.depositType === 'FD' && b.fdSupported === false) return false;
      return isTenureSupported(b, persona, persona.tenureMonths, activeTenureDays);
    });
  }, [stateFilteredBanks, persona.depositType, persona.tenureMonths, persona.tenureUnit, persona.tenureDays]);

  // Category and sub-filter logic
  const filteredAndRankedBanks = useMemo(() => {
    const list = depositTypeAndStateFilteredBanks.filter((b) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.subTitle.toLowerCase().includes(q);
        const matchesMergerSuccessor = activeMergerNotice && activeMergerNotice.successorBankIds.includes(b.id);
        if (!matchesName && !matchesMergerSuccessor) return false;
      }

      if (selectedCategory === 'sfb' && b.category !== 'sfb') return false;
      if (selectedCategory === 'rrb' && b.category !== 'rrb') return false;
      if (selectedCategory === 'private' && b.category !== 'private') return false;
      if (selectedCategory === 'psu' && b.category !== 'psu' && b.category !== 'post_office') return false;
      if (selectedCategory === 'post_office' && b.category !== 'post_office') return false;
      if (selectedCategory === 'taxsaver') {
        // Section 80C applies strictly to 5-Year FDs, not Recurring Deposits
        if (persona.depositType === 'RD') return false;
        if (persona.tenureMonths !== 60 && !b.badge.includes('Tax')) return false;
      }

      if (minRatingFilter === 'AAA' && !b.rating.includes('AAA') && !b.rating.includes('Highest')) return false;
      if (minRatingFilter === 'A+' && !b.rating.includes('AAA') && !b.rating.includes('A+') && !b.rating.includes('Highest')) return false;

      if (regionalOnly) {
        if (b.category !== 'rrb' && b.isPanIndia) return false;
      }

      if (dicgcOnly && !b.dicgcCovered) return false;

      return true;
    });

    // Sort by actual offered bank rate descending (unbiased by custom rate)
    return [...list].sort((a, b) => {
      const tenureDays = persona.tenureUnit === 'days' ? (persona.tenureDays || 444) : undefined;
      const rateA = getEffectiveRate(a, persona, persona.tenureMonths, tenureDays);
      const rateB = getEffectiveRate(b, persona, persona.tenureMonths, tenureDays);
      return rateB - rateA;
    });
  }, [depositTypeAndStateFilteredBanks, selectedCategory, minRatingFilter, dicgcOnly, persona, searchQuery, activeMergerNotice, regionalOnly]);

  // Category counts based on active state and deposit type (eliminating phantom +1 counts from other deposit types)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: depositTypeAndStateFilteredBanks.length,
      sfb: 0,
      private: 0,
      psu: 0,
      post_office: 0,
      rrb: 0,
      taxsaver: 0,
    };
    for (const b of depositTypeAndStateFilteredBanks) {
      if (b.category === 'sfb') counts.sfb++;
      if (b.category === 'private') counts.private++;
      if (b.category === 'psu' || b.category === 'post_office') counts.psu++;
      if (b.category === 'post_office') counts.post_office++;
      if (b.category === 'rrb') counts.rrb++;
      if (persona.depositType === 'FD' && (b.badge?.includes('Tax') || b.categoryTag?.includes('Lock-in') || b.tenureMonths === 60)) {
        counts.taxsaver++;
      }
    }
    return counts;
  }, [depositTypeAndStateFilteredBanks, persona.depositType]);

  // Tenure Days resolution
  const activeTenureDays = persona.tenureUnit === 'days' ? (persona.tenureDays || 444) : undefined;

  // Top Yield Bank calculation
  const topBank = filteredAndRankedBanks[0] || banks[0];
  const peakMarketRate = topBank 
    ? getEffectiveRate(topBank, persona, persona.tenureMonths, activeTenureDays) 
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
      activeTenureDays,
      persona.compounding
    );
  }, [currentAmount, activeSimulationRate, persona.tenureMonths, persona.age, persona.form15HSubmitted, persona.depositType, persona.panLinked, activeTenureDays, persona.compounding]);

  // Donut chart data
  const donutData = useMemo(() => {
    return [
      { name: 'Principal Invested', value: topCalculation.totalInvested, color: '#3b82f6' },
      { name: 'Interest Gain', value: topCalculation.totalInterest, color: '#10b981' },
    ];
  }, [topCalculation]);

  // Rate spread comparison data
  const spreadData = useMemo(() => {
    const getTopRateBank = (cat: string) => {
      const matches = depositTypeAndStateFilteredBanks.filter(b => b.category === cat);
      if (matches.length === 0) return undefined;
      return matches.reduce((best, curr) => {
        const rateBest = getEffectiveRate(best, { ...persona, useCustomRate: false }, persona.tenureMonths, activeTenureDays);
        const rateCurr = getEffectiveRate(curr, { ...persona, useCustomRate: false }, persona.tenureMonths, activeTenureDays);
        return rateCurr > rateBest ? curr : best;
      }, matches[0]);
    };

    const sfbTop = getTopRateBank('sfb');
    const pvtTop = getTopRateBank('private');
    const psuTop = getTopRateBank('psu');
    const postTop = getTopRateBank('post_office');

    const data: Array<{ name: string; rate: number; bank: string }> = [];

    if (persona.useCustomRate && persona.customRate !== undefined) {
      data.push({
        name: 'Your Target',
        rate: persona.customRate,
        bank: 'Custom %',
      });
    }

    if (sfbTop) {
      data.push({
        name: 'Top SFB',
        rate: getEffectiveRate(sfbTop, persona, persona.tenureMonths, activeTenureDays),
        bank: sfbTop.name.split(' ')[0],
      });
    }
    if (pvtTop) {
      data.push({
        name: 'Top Private',
        rate: getEffectiveRate(pvtTop, persona, persona.tenureMonths, activeTenureDays),
        bank: pvtTop.name.split(' ')[0],
      });
    }
    if (psuTop) {
      data.push({
        name: 'Top PSU',
        rate: getEffectiveRate(psuTop, persona, persona.tenureMonths, activeTenureDays),
        bank: psuTop.name.split(' ')[0],
      });
    }
    if (postTop) {
      data.push({
        name: 'India Post',
        rate: getEffectiveRate(postTop, persona, persona.tenureMonths, activeTenureDays),
        bank: 'Sovereign PO',
      });
    }
    data.push({
      name: 'RBI Repo',
      rate: 6.50,
      bank: 'Benchmark',
    });

    return data;
  }, [depositTypeAndStateFilteredBanks, persona, activeTenureDays]);

  // Statutory tenures (1Y to 10Y)
  const statutoryTenures = [
    { years: 1, months: 12, label: '1Y', sub: '12M' },
    { years: 2, months: 24, label: '2Y', sub: '24M' },
    { years: 3, months: 36, label: '3Y', sub: 'Peak Yield' },
    { years: 5, months: 60, label: '5Y', sub: persona.depositType === 'RD' ? 'Long-Term' : '80C Tax Saver' },
    { years: 7, months: 84, label: '7Y', sub: '84M' },
    { years: 10, months: 120, label: '10Y', sub: 'Max RBI' },
  ];

  // Active verified ALCO promotional odd-day schemes (222D purged)
  const promotionalOddDaySchemes = [
    { days: 333, label: '333D', name: 'Union / BOI', rate: '7.40%' },
    { days: 399, label: '399D', name: 'BoB Tiranga', rate: '7.25%' },
    { days: 400, label: '400D', name: 'SBI Kalash', rate: '7.10%' },
    { days: 444, label: '444D', name: 'Canara / APGB', rate: '7.25%-7.65%' },
    { days: 555, label: '555D', name: 'BoB Special', rate: '7.30%' },
    { days: 666, label: '666D', name: 'BOI Star Vriddhi', rate: '7.30%' },
    { days: 777, label: '777D', name: 'Utkarsh SFB', rate: '8.15%' },
    { days: 1001, label: '1001D', name: 'Unity Shrestha', rate: '8.40%' },
  ];

  // Quick preset chips
  const fdPresets = [50000, 100000, 200000, 500000, 1000000];
  const rdPresets = [2000, 5000, 10000, 25000, 50000];
  const customRateQuickPicks = [7.00, 7.50, 8.00, 8.25, 8.40, 8.75, 9.00];

  // Number of banks beating custom rate
  const banksMeetingTargetCount = useMemo(() => {
    if (!persona.useCustomRate || persona.customRate === undefined) return 0;
    return filteredAndRankedBanks.filter(b => {
      const rate = getEffectiveRate(b, persona, persona.tenureMonths, activeTenureDays);
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

      {/* PERSISTENT STICKY CONTROL RIBBON (PERSONA & JURISDICTION) */}
      <div className="sticky top-20 z-30 bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:p-4 shadow-sm transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Deposit Type Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => handleDepositTypeChange('FD')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                persona.depositType === 'FD'
                  ? 'bg-white dark:bg-[#1c2128] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-[#006c4a] dark:text-[#10b981]" />
              <span>Fixed Deposit (FD)</span>
            </button>
            <button
              type="button"
              onClick={() => handleDepositTypeChange('RD')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                persona.depositType === 'RD'
                  ? 'bg-white dark:bg-[#1c2128] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Percent className="w-3.5 h-3.5 text-[#006c4a] dark:text-[#10b981]" />
              <span>Recurring Deposit (RD)</span>
            </button>
          </div>

          {/* Age Category */}
          <div className="flex items-center gap-1.5 shrink-0">
            <label htmlFor="persona-age-select" className="font-bold text-slate-600 dark:text-slate-400">
              Age:
            </label>
            <div className="relative">
              <select
                id="persona-age-select"
                aria-label="Depositor Age Category"
                value={persona.age >= 80 ? '80' : persona.age >= 60 ? '60' : '35'}
                onChange={(e) => setPersona((prev) => ({ ...prev, age: Number(e.target.value) }))}
                className="h-9 pl-2.5 pr-8 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold appearance-none cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#006c4a]"
              >
                <option value="35">General (&lt;60 yrs)</option>
                <option value="60">Senior (60–79 yrs) • +0.50%</option>
                <option value="80">Super Senior (80+ yrs) • +0.75%</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Gender */}
          <div className="flex items-center gap-1.5 shrink-0">
            <label htmlFor="persona-gender-select" className="font-bold text-slate-600 dark:text-slate-400">
              Gender:
            </label>
            <div className="relative">
              <select
                id="persona-gender-select"
                aria-label="Gender Specification"
                value={persona.gender}
                onChange={(e) => setPersona((prev) => ({ ...prev, gender: e.target.value as 'female' | 'male' | 'other' }))}
                className="h-9 pl-2.5 pr-8 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold appearance-none cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#006c4a]"
              >
                <option value="male">Male</option>
                <option value="female">Female (+0.15% &amp; MSSC)</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* State / Jurisdiction */}
          <div className="flex items-center gap-1.5 shrink-0">
            <label htmlFor="persona-state-select" className="font-bold text-slate-600 dark:text-slate-400">
              Location:
            </label>
            <div className="relative">
              <select
                id="persona-state-select"
                aria-label="State and Bank Jurisdiction"
                value={persona.state}
                onChange={(e) => setPersona((prev) => ({ ...prev, state: e.target.value }))}
                className="h-9 pl-2.5 pr-8 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold appearance-none cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#006c4a] max-w-[170px] truncate"
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
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Regional Only Toggle Button */}
          <button
            type="button"
            aria-label="Filter Regional Banks Only"
            onClick={() => setRegionalOnly((prev) => !prev)}
            className={`h-9 px-3 rounded-xl border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              regionalOnly
                ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Toggle between All Banks and Regional Rural / State-specific Banks only"
          >
            <Building className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{regionalOnly ? '🏛️ Regional Banks Only' : 'All in State'}</span>
          </button>

          {/* Form 15G/15H Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer h-9 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              checked={persona.form15HSubmitted}
              onChange={(e) => setPersona((prev) => ({ ...prev, form15HSubmitted: e.target.checked }))}
              className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <span className="whitespace-nowrap">Form 15G/H (0% TDS)</span>
          </label>
        </div>
      </div>

      {/* SECTION 1: 2-COLUMN MINIMALIST CALCULATOR CANVAS (GROWW / FINTECH PATTERN) */}
      <section className="w-full bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs p-5 sm:p-7 transition-colors">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: 3 Standardized Slider Rows + Compounding Selector */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* ROW 1: TOTAL INVESTMENT / MONTHLY INSTALLMENT */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="deposit-amount-input" className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {persona.depositType === 'RD' ? 'Monthly Installment Amount' : 'Principal Deposit Sum'}
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
                    <input
                      id="deposit-amount-input"
                      type="text"
                      value={formatINR(currentAmount)}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9]/g, '');
                        const val = parseInt(clean, 10);
                        if (!isNaN(val)) handleAmountSlider(val);
                      }}
                      className="w-36 h-9 pl-7 pr-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white text-sm text-right focus:ring-2 focus:ring-[#006c4a] focus:outline-hidden"
                    />
                  </div>
                  <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#006c4a] dark:text-[#10b981] text-xs font-bold whitespace-nowrap">
                    {formatLakhs(currentAmount)}
                  </span>
                </div>
              </div>

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

              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-medium">Quick Pick:</span>
                  {(persona.depositType === 'RD' ? rdPresets : fdPresets).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleAmountSlider(amt)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        currentAmount === amt
                          ? 'bg-[#006c4a] text-white dark:bg-[#10b981] dark:text-slate-950 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      ₹{formatLakhs(amt)}{persona.depositType === 'RD' ? '/mo' : ''}
                    </button>
                  ))}
                </div>

                {topCalculation.totalInvested > 500000 && (
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>&gt; ₹5L limit.</span>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('dicgc-index')}
                      className="text-[#006c4a] dark:text-[#10b981] hover:underline font-bold cursor-pointer"
                    >
                      Split safely →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ROW 2: TIME PERIOD (HYBRID SMART SLIDER: 1Y TO 10Y) */}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    Tenure Horizon &amp; Special Bank Schemes
                  </label>
                  <div className="relative">
                    <select
                      value={tenureDisplayUnit}
                      onChange={(e) => setTenureDisplayUnit(e.target.value as 'years' | 'months')}
                      className="h-6 pl-2 pr-5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer"
                    >
                      <option value="years">Years</option>
                      <option value="months">Months</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-[#006c4a] dark:text-[#10b981] font-extrabold text-xs">
                    {persona.tenureUnit === 'days'
                      ? `${activeTenureDays} Days (${((activeTenureDays || 444) / 365).toFixed(2)} Years)`
                      : tenureDisplayUnit === 'years'
                        ? `${(persona.tenureMonths / 12).toFixed(persona.tenureMonths % 12 === 0 ? 0 : 1)} Years (${persona.tenureMonths}M)`
                        : `${persona.tenureMonths} Months (${(persona.tenureMonths / 12).toFixed(1)}Y)`}
                  </span>
                  {persona.tenureUnit === 'days' && (
                    <button
                      type="button"
                      onClick={() => setPersona((prev) => ({ ...prev, tenureUnit: 'months', tenureDays: undefined }))}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                      title="Clear odd days and switch to standard years"
                    >
                      ✕ Standard
                    </button>
                  )}
                </div>
              </div>

              {/* Slider (1 to 10 Years when in years mode, or 6 to 120 Months when in months mode) */}
              <input
                type="range"
                min={tenureDisplayUnit === 'years' ? 1 : 6}
                max={tenureDisplayUnit === 'years' ? 10 : 120}
                step={tenureDisplayUnit === 'years' ? 1 : 6}
                value={
                  tenureDisplayUnit === 'years'
                    ? Math.min(10, Math.max(1, Math.round(persona.tenureMonths / 12)))
                    : Math.min(120, Math.max(6, persona.tenureMonths))
                }
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const newMonths = tenureDisplayUnit === 'years' ? val * 12 : val;
                  setPersona((prev) => ({
                    ...prev,
                    tenureUnit: 'months',
                    tenureMonths: newMonths,
                    tenureDays: undefined,
                  }));
                }}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#006c4a] dark:accent-[#10b981]"
                aria-label="Time period slider"
              />

              {/* Statutory Milestone Tick Chips */}
              <div className="grid grid-cols-6 gap-1.5 pt-0.5">
                {statutoryTenures.map((st) => {
                  const isSelected = persona.tenureUnit !== 'days' && persona.tenureMonths === st.months;
                  return (
                    <button
                      key={st.months}
                      type="button"
                      onClick={() =>
                        setPersona((prev) => ({
                          ...prev,
                          tenureUnit: 'months',
                          tenureMonths: st.months,
                          tenureDays: undefined,
                        }))
                      }
                      className={`py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'border-[#006c4a] bg-emerald-50 dark:bg-emerald-950/40 text-[#006c4a] dark:text-[#10b981] font-extrabold shadow-2xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="text-xs font-bold">{st.label}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold truncate w-full">
                        {st.sub}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Promotional High-Yield Scheme Quick Chips (Exclusive to FD) */}
              {persona.depositType === 'FD' && (
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Special Promotional Schemes (Odd Days):</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {promotionalOddDaySchemes.map((scheme) => {
                      const isSelected = persona.tenureUnit === 'days' && activeTenureDays === scheme.days;
                      return (
                        <button
                          key={scheme.days}
                          type="button"
                          onClick={() =>
                            setPersona((prev) => ({
                              ...prev,
                              tenureUnit: 'days',
                              tenureDays: scheme.days,
                              tenureMonths: Math.round(scheme.days / 30.416),
                            }))
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <span>⚡ {scheme.label}</span>
                          <span className="text-[10px] opacity-80 font-normal">({scheme.name} {scheme.rate})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ROW 3: RATE OF INTEREST (P.A.) */}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    Rate of interest (p.a.)
                  </label>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPersona((prev) => ({ ...prev, useCustomRate: false }))}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                        !persona.useCustomRate
                          ? 'bg-white dark:bg-[#1c2128] text-[#006c4a] dark:text-[#10b981] shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Auto-Sync Market ({peakMarketRate.toFixed(2)}%)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPersona((prev) => ({
                          ...prev,
                          useCustomRate: true,
                          customRate: prev.customRate || peakMarketRate,
                        }))
                      }
                      className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                        persona.useCustomRate
                          ? 'bg-white dark:bg-[#1c2128] text-purple-700 dark:text-purple-300 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Custom Target %
                    </button>
                  </div>
                </div>

                <div
                  className={`flex items-center h-8.5 px-2.5 rounded-lg border font-extrabold text-sm transition-all ${
                    persona.useCustomRate
                      ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 focus-within:ring-2 focus-within:ring-purple-500'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  <input
                    type="number"
                    step={0.05}
                    min={4.0}
                    max={12.0}
                    disabled={!persona.useCustomRate}
                    value={activeSimulationRate.toFixed(2)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setPersona((prev) => ({
                          ...prev,
                          useCustomRate: true,
                          customRate: Math.max(3, Math.min(15, val)),
                        }));
                      }
                    }}
                    className={`w-14 bg-transparent text-right font-extrabold text-sm focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      persona.useCustomRate
                        ? 'text-purple-900 dark:text-purple-200'
                        : 'text-[#006c4a] dark:text-[#10b981]'
                    }`}
                    aria-label="Custom target rate of interest"
                  />
                  <span
                    className={`ml-1 text-xs font-bold select-none ${
                      persona.useCustomRate
                        ? 'text-purple-700 dark:text-purple-300'
                        : 'text-[#006c4a] dark:text-[#10b981]'
                    }`}
                  >
                    %
                  </span>
                </div>
              </div>

              {/* Rate Slider */}
              <input
                type="range"
                min={4.0}
                max={12.0}
                step={0.05}
                disabled={!persona.useCustomRate}
                value={activeSimulationRate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPersona((prev) => ({ ...prev, useCustomRate: true, customRate: val }));
                }}
                className={`w-full h-2 rounded-lg appearance-none transition-all ${
                  persona.useCustomRate
                    ? 'bg-purple-200 dark:bg-purple-950 accent-purple-600 cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-700 accent-[#006c4a] opacity-80 cursor-not-allowed'
                }`}
                aria-label="Rate of interest slider"
              />

              {/* Custom Rate Quick Pick Pills or Auto-Sync Status */}
              <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                {persona.useCustomRate ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-medium">Target:</span>
                    {customRateQuickPicks.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setPersona((prev) => ({ ...prev, useCustomRate: true, customRate: r }))}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                          persona.customRate === r
                            ? 'bg-purple-600 text-white font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {r.toFixed(2)}%
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-500" />
                    <span>Auto-pegged to Rank #1 lender ({topBank?.name ?? 'Top SFB'} @ {peakMarketRate.toFixed(2)}%)</span>
                  </span>
                )}

                {persona.useCustomRate && (
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                    {banksMeetingTargetCount} of {depositTypeAndStateFilteredBanks.length} banks meet/beat target
                  </span>
                )}
              </div>
            </div>

            {/* ROW 4: PAYOUT & COMPOUNDING PLAN (FD ONLY) */}
            {persona.depositType === 'FD' && (
              <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Interest Payout Plan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'maturity' as const, title: 'At Maturity', sub: 'Quarterly Reinvestment', badge: 'Max Wealth' },
                    { id: 'monthly' as const, title: 'Monthly Payout', sub: 'Discounted Cashflow', badge: 'Regular Income' },
                    { id: 'quarterly' as const, title: 'Quarterly Payout', sub: 'Simple Interest', badge: 'Periodic' },
                  ].map((p) => {
                    const isSelected = persona.compounding === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPersona((prev) => ({ ...prev, compounding: p.id }))}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#006c4a] bg-emerald-50/70 dark:bg-emerald-950/40 text-slate-900 dark:text-white shadow-2xs'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{p.title}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            isSelected ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100' : 'bg-slate-100 dark:bg-slate-800'
                          }`}>
                            {p.badge}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5">{p.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: VISUAL RETURN CANVAS (DONUT + BREAKDOWN + DIRECT CTA) */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between gap-5 shadow-2xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Return Canvas &amp; Growth
                </span>
                <span className="text-xs font-extrabold text-[#006c4a] dark:text-[#10b981]">
                  {activeSimulationRate.toFixed(2)}% p.a.
                </span>
              </div>

              {/* Integrated Recharts Donut */}
              <div className="relative w-full min-w-0 h-44 my-2 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={74}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`donut-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(val: any) => `₹${formatINR(Number(val) || 0)}`}
                      contentStyle={chartTooltipStyle.contentStyle}
                      itemStyle={chartTooltipStyle.itemStyle}
                      labelStyle={chartTooltipStyle.labelStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    {persona.compounding === 'maturity' ? 'Net Maturity' : 'Total Delivered'}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    ₹{formatLakhs(topCalculation.maturityAmount + (persona.compounding === 'maturity' ? 0 : topCalculation.totalInterest))}
                  </span>
                </div>
              </div>

              {/* Metric Breakdown Strips */}
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>Invested Amount:</span>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    ₹{formatINR(topCalculation.totalInvested)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Est. Returns (Interest Gain):</span>
                  </span>
                  <span className="font-extrabold text-[#006c4a] dark:text-[#10b981] tabular-nums">
                    +₹{formatINR(topCalculation.totalInterest)}
                  </span>
                </div>

                {persona.depositType === 'FD' && persona.compounding !== 'maturity' && topCalculation.periodicPayoutAmount && (
                  <div className="flex justify-between items-center py-1 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Regular Cashflow:</span>
                    <span className="font-extrabold text-[#006c4a] dark:text-[#10b981] tabular-nums">
                      ₹{formatINR(topCalculation.periodicPayoutAmount)} / {persona.compounding === 'monthly' ? 'month' : 'quarter'}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Total Maturity Value:</span>
                  <span className="font-extrabold text-base text-slate-900 dark:text-white tabular-nums">
                    ₹{formatINR(topCalculation.maturityAmount)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Effective Annual Yield:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {topCalculation.effectiveAnnualYield}% p.a.
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Action CTA */}
            <a
              href="#bank-leaderboard"
              className="w-full py-3 rounded-xl bg-[#006c4a] hover:bg-[#005137] dark:bg-[#10b981] dark:text-slate-950 text-white font-bold text-center text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Compare {filteredAndRankedBanks.length} Scheduled Banks Below</span>
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 2: DEEP-DIVE VISUAL ANALYTICS (TRAJECTORY & RATE SPREAD) */}
      <section className="w-full bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs p-5 sm:p-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#006c4a] dark:text-[#10b981]" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Visual Analytics: Compounding Trajectory &amp; Sector Benchmark
            </h2>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveChartTab('trajectory')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartTab === 'trajectory' || activeChartTab === 'donut'
                  ? 'bg-white dark:bg-[#1c2128] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LineIcon className="w-3.5 h-3.5 text-emerald-500" />
              <span>Compounding Trajectory</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('spread')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartTab === 'spread'
                  ? 'bg-white dark:bg-[#1c2128] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
              <span>Sector Rate Spread</span>
            </button>
          </div>
        </div>

        <div className="w-full min-w-0 h-64 pt-4">
          {activeChartTab === 'spread' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spreadData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[5, 10]} tickFormatter={(v) => `${v}%`} />
                <RechartsTooltip
                  formatter={(val: any) => `${Number(val).toFixed(2)}% p.a.`}
                  contentStyle={chartTooltipStyle.contentStyle}
                  itemStyle={chartTooltipStyle.itemStyle}
                  labelStyle={chartTooltipStyle.labelStyle}
                />
                <Bar dataKey="rate" name="Annual Interest Rate (%)" fill={isDark ? '#10b981' : '#006c4a'} radius={[6, 6, 0, 0]}>
                  {spreadData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.name === 'RBI Repo' ? '#94a3b8' : entry.name === 'Your Target' ? '#a855f7' : index === 0 ? '#10b981' : '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
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
                  contentStyle={chartTooltipStyle.contentStyle}
                  itemStyle={chartTooltipStyle.itemStyle}
                  labelStyle={chartTooltipStyle.labelStyle}
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
        </div>
      </section>


      {/* SECTION 3: LIVE REACTIVE BANK LEADERBOARD */}
      <section id="bank-leaderboard" className="w-full flex flex-col gap-6 scroll-mt-24">
        {/* Verification Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 sm:p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Verified ALCO Rate Cards & Sovereign Gazettes
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Standard retail deposits (&lt; ₹3 Crore) verified against official bank circulars & MoF orders
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
            <div role="status" aria-live="polite" className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 flex items-start gap-3 transition-all">
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
            ].map((tab) => {
              const count = categoryCounts[tab.id] ?? 0;
              const isSelected = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id as BankCategory)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#006c4a] text-white dark:bg-[#10b981] dark:text-slate-950 shadow-xs'
                      : 'bg-white dark:bg-[#161b22] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold transition-colors ${
                      isSelected
                        ? 'bg-white/25 text-white dark:bg-black/25 dark:text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Subfilters */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-bold" aria-live="polite">
              <span>
                Showing {filteredAndRankedBanks.length}
                {filteredAndRankedBanks.length !== depositTypeAndStateFilteredBanks.length
                  ? ` of ${depositTypeAndStateFilteredBanks.length}`
                  : ''}{' '}
                Banks
              </span>
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
                  setPersona((prev) => ({ ...prev, state: PAN_INDIA_OPTION.name }));
                }}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#006c4a] hover:bg-[#005137] dark:bg-[#10b981] dark:text-slate-950 text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Reset All Filters &amp; Search
              </button>
            </div>
          ) : (
            <>
              {filteredAndRankedBanks.map((bank, index) => {
            const effectiveRate = getEffectiveRate(bank, persona, persona.tenureMonths, activeTenureDays);
            const calc = calculateYield(
              currentAmount,
              effectiveRate,
              persona.tenureMonths,
              persona.age,
              persona.form15HSubmitted,
              persona.depositType,
              persona.panLinked,
              activeTenureDays,
              persona.compounding
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
                      <button
                        type="button"
                        onClick={() => onInspectBank(bank)}
                        className="text-base sm:text-lg font-bold text-slate-900 dark:text-white hover:text-[#006c4a] dark:hover:text-[#10b981] transition-colors text-left flex items-center gap-1 group cursor-pointer"
                        title={`Inspect detailed schedule, FY tax deduction and CSV for ${bank.name}`}
                      >
                        <span>{bank.name}</span>
                        <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#006c4a] dark:text-[#10b981]" />
                      </button>
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
                      {/* Persona Dynamic Rate Breakdown Transparency Pills */}
                      {persona.age >= 80 ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-[10px] font-bold">
                          +{bank.superSeniorBonus.toFixed(2)}% Super Senior (80+)
                        </span>
                      ) : persona.age >= 60 ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                          +{bank.seniorBonus.toFixed(2)}% Senior Citizen (60+)
                        </span>
                      ) : null}
                      {persona.gender === 'female' && bank.womenBonus && bank.womenBonus > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950/80 text-pink-800 dark:text-pink-300 text-[10px] font-bold">
                          +{bank.womenBonus.toFixed(2)}% Women Depositor
                        </span>
                      ) : null}
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
                      {bank.effectiveDate && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                            {bank.effectiveDate.startsWith('w.e.f.') ? bank.effectiveDate : `w.e.f. ${bank.effectiveDate}`}
                          </span>
                        </>
                      )}
                      {bank.circularUrl && (
                        <>
                          <span>•</span>
                          <a
                            href={bank.circularUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#006c4a] dark:text-[#10b981] hover:underline flex items-center gap-1 font-semibold text-[11px]"
                            title="Inspect official bank rate circular disclosure"
                          >
                            <span>Official Rate Card</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                      {onReportRate && (
                        <>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => onReportRate(bank)}
                            className="text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 font-semibold text-[11px] transition-colors"
                            title="Report rate revision or notice board photo"
                          >
                            <Flag className="w-3 h-3" />
                            <span>Report Revision</span>
                          </button>
                        </>
                      )}
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
                      {persona.compounding === 'maturity' ? (
                        <>Maturity: <strong className="text-slate-900 dark:text-white">₹{formatINR(calc.maturityAmount)}</strong></>
                      ) : (
                        <>Payout: <strong className="text-[#006c4a] dark:text-[#10b981]">₹{formatINR(calc.periodicPayoutAmount || 0)}/{persona.compounding === 'monthly' ? 'mo' : 'qtr'}</strong></>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onInspectBank(bank)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Inspect full schedule, tax deductions and export CSV"
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

          {/* Footer count indicator */}
          <div className="mt-4 flex items-center justify-between py-4 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">
              Showing all <strong className="text-slate-900 dark:text-white">{filteredAndRankedBanks.length}</strong> institutions matching criteria
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% RBI &amp; DICGC verified</span>
            </span>
          </div>
        </>
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
          onInspect={onInspectBank}
        />
      )}
    </div>
  );
};
