import React, { useState } from 'react';
import {
  Wallet,
  Repeat,
  Shield,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Building2,
  Lock,
  ChevronDown
} from 'lucide-react';
import { UserPersona } from '../types/bank';
import { calculateYield, formatINR, formatLakhs } from '../utils/calculator';

interface CalculatorScreenProps {
  persona: UserPersona;
  setPersona: React.Dispatch<React.SetStateAction<UserPersona>>;
  onProceedToLeaderboard: () => void;
}

export const CalculatorScreen: React.FC<CalculatorScreenProps> = ({
  persona,
  setPersona,
  onProceedToLeaderboard,
}) => {
  const [baseBenchmarkRate, setBaseBenchmarkRate] = useState<number>(8.10);

  // Age premium logic
  let agePremium = 0;
  let ageTierTitle = 'General Depositor (<60 yrs)';
  let ageTierDesc = 'Standard Card Rate Applied';

  if (persona.age >= 80) {
    agePremium = 0.75;
    ageTierTitle = 'Super Senior Citizen (80+ yrs)';
    ageTierDesc = '+0.75% Rate Premium Activated';
  } else if (persona.age >= 60) {
    agePremium = 0.50;
    ageTierTitle = 'Senior Citizen (60–79 yrs)';
    ageTierDesc = '+0.50% Rate Premium Activated';
  }

  const effectivePeakRate = baseBenchmarkRate + agePremium;
  const calc = calculateYield(persona.principal, effectivePeakRate, persona.tenureMonths, persona.age, persona.form15HSubmitted);

  const handleAmountChange = (valStr: string) => {
    const clean = valStr.replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    if (!isNaN(num)) {
      setPersona((prev) => ({ ...prev, principal: num }));
    }
  };

  const handlePresetAmount = (amt: number) => {
    setPersona((prev) => ({ ...prev, principal: amt }));
  };

  const handleQuickTenure = (months: number, avgRate: number) => {
    setBaseBenchmarkRate(avgRate);
    setPersona((prev) => ({ ...prev, tenureMonths: months }));
  };

  return (
    <div className="flex flex-col w-full">
      {/* Stepper & Macro Status Header */}
      <section className="w-full bg-[#f2f4f6] dark:bg-[#11161d] py-6 px-4 sm:px-6 lg:px-12 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Stepper Tracking */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-bold uppercase tracking-wider">
                Step 1 of 3
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Profile & Deposit Matrix
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white text-xs sm:text-sm font-bold">
                <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-xs">
                  1
                </span>
                <span>Input Details</span>
              </div>
              <span className="w-8 h-0.5 bg-slate-300 dark:bg-slate-700 rounded" />
              <button
                onClick={onProceedToLeaderboard}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-xs sm:text-sm font-medium transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-xs">
                  2
                </span>
                <span>Live Yield Ranker</span>
              </button>
              <span className="w-8 h-0.5 bg-slate-300 dark:bg-slate-700 rounded hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs sm:text-sm font-medium">
                <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-xs">
                  3
                </span>
                <span>Quarterly Schedule</span>
              </div>
            </div>
          </div>

          {/* Current Benchmark Range Capsule */}
          <div className="flex items-center gap-3 bg-white dark:bg-[#161b22] px-4 py-2.5 rounded-xl shadow-xs border border-slate-200/80 dark:border-slate-800 self-start md:self-auto">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#00714e] dark:text-[#a7f3d0]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                Current Benchmark Range
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span className="text-slate-900 dark:text-white tabular-nums">3.00% – 9.10% p.a.</span>
                <span className="text-[#006c4a] dark:text-[#10b981]">(Peak SFB Rate)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Headline Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-8 pb-4">
        <div className="flex flex-col max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-[#006c4a] dark:text-[#10b981]" />
            <span className="text-xs font-bold text-[#006c4a] dark:text-[#10b981] tracking-widest uppercase">
              RBI Sovereign Assurance Layer
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Find Peak FD & RD Yields Tailored to Your Profile
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Real-time rates indexed across 48+ Scheduled Commercial, Public, Private & Small Finance Banks with automated
            Senior Citizen (+0.50%) & Women Special tenure tiering.
          </p>
        </div>
      </section>

      {/* Main Form & Calculation Grid */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Core Deposit Parameters (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white dark:bg-[#161b22] p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-6">
              {/* Architecture Switch: FD vs RD */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-900 dark:text-white">
                    1. Select Deposit Architecture
                  </label>
                  <span className="text-xs font-medium text-[#006c4a] dark:text-[#10b981]">
                    Standard Compounding n=4
                  </span>
                </div>
                <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setPersona((p) => ({ ...p, depositType: 'FD' }))}
                    className={`py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      persona.depositType === 'FD'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Fixed Deposit (FD)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPersona((p) => ({ ...p, depositType: 'RD' }))}
                    className={`py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      persona.depositType === 'RD'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Repeat className="w-4 h-4" />
                    <span>Recurring Deposit (RD)</span>
                  </button>
                </div>
              </div>

              {/* Principal Deposit Sum Input & Chips */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="deposit-amount" className="text-sm font-bold text-slate-900 dark:text-white">
                    Principal Deposit Sum
                  </label>
                  <span className="text-xs sm:text-sm font-bold text-[#006c4a] dark:text-[#10b981] tabular-nums">
                    ₹ {formatINR(persona.principal)} (₹ {formatLakhs(persona.principal)})
                  </span>
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-4 text-xl font-bold text-slate-400 pointer-events-none">₹</span>
                  <input
                    id="deposit-amount"
                    type="text"
                    value={formatINR(persona.principal)}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full h-14 pl-10 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xl sm:text-2xl font-bold focus:outline-hidden focus:ring-2 focus:ring-[#006c4a] dark:focus:ring-[#10b981] transition-all tabular-nums"
                  />
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {[
                    { label: '₹50,000', val: 50000 },
                    { label: '₹1 Lakh', val: 100000 },
                    { label: '₹5 Lakhs (Insured Max)', val: 500000 },
                    { label: '₹10 Lakhs', val: 1000000 },
                    { label: '₹25 Lakhs', val: 2500000 },
                  ].map((chip) => {
                    const isSelected = persona.principal === chip.val;
                    return (
                      <button
                        key={chip.val}
                        type="button"
                        onClick={() => handlePresetAmount(chip.val)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tenure Horizon Selection */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-900 dark:text-white">Tenure Horizon</label>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                    {persona.tenureMonths} Months ({(persona.tenureMonths / 12).toFixed(1)} Years)
                  </span>
                </div>

                {/* Quick Tenure Toggle Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: '1 Year', months: 12, rate: 7.25, badge: '7.25% avg' },
                    { label: '2 Years', months: 24, rate: 7.50, badge: '7.50% avg' },
                    { label: '3 Years', months: 36, rate: 8.10, badge: '8.10% avg', highlight: true },
                    { label: '5 Years', months: 60, rate: 7.00, badge: 'Tax Saver', is80C: true },
                  ].map((t) => {
                    const isSelected = persona.tenureMonths === t.months;
                    return (
                      <button
                        key={t.months}
                        type="button"
                        onClick={() => handleQuickTenure(t.months, t.rate)}
                        className={`p-3.5 rounded-xl text-left flex flex-col gap-1 transition-all ${
                          isSelected
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold">{t.label}</span>
                          {t.is80C && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px] font-bold">
                              80C
                            </span>
                          )}
                          {t.highlight && isSelected && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          )}
                        </div>
                        <span
                          className={`text-[11px] font-medium ${
                            isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {t.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Fine-Tuning Tenure Slider */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                    <span>7 Days</span>
                    <span>12 Mo</span>
                    <span className="font-bold text-slate-900 dark:text-white">36 Mo</span>
                    <span>60 Mo</span>
                    <span>120 Mo</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="120"
                    step="6"
                    value={persona.tenureMonths}
                    onChange={(e) => setPersona((p) => ({ ...p, tenureMonths: parseInt(e.target.value, 10) }))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#006c4a] dark:accent-[#10b981]"
                  />
                </div>
              </div>

              {/* Compounding & Payout Radio Selection */}
              <div className="flex flex-col gap-2.5">
                <label className="text-sm font-bold text-slate-900 dark:text-white">
                  Compounding & Interest Payout Schedule
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'quarterly', title: 'Quarterly', sub: 'Standard Banking (n=4)' },
                    { id: 'monthly', title: 'Monthly Payout', sub: 'Discounted Yield' },
                    { id: 'maturity', title: 'At Maturity', sub: 'Cumulative Reinvest' },
                  ].map((comp) => {
                    const isSelected = persona.compounding === comp.id;
                    return (
                      <label
                        key={comp.id}
                        className={`relative flex items-center p-3 rounded-xl cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name="compounding"
                          value={comp.id}
                          checked={isSelected}
                          onChange={() => setPersona((p) => ({ ...p, compounding: comp.id as any }))}
                          className="h-4 w-4 text-[#006c4a] accent-[#006c4a] cursor-pointer"
                        />
                        <div className="ml-3 flex flex-col">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {comp.title}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                            {comp.sub}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* DICGC Statutory Box */}
            <div className="bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#006c4a] text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  RBI Deposit Insurance Guarantee (DICGC)
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your capital up to ₹5,00,000 across principal and accumulated interest is fully guaranteed by DICGC (wholly
                  owned subsidiary of RBI) for every scheduled commercial and small finance bank listed on our platform.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Demographic Intelligence Panel & Live Estimator (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white dark:bg-[#161b22] p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-6">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#006c4a] dark:text-[#10b981]" />
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Demographic Intelligence
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#00714e] dark:text-[#a7f3d0] text-[10px] font-bold">
                  Auto-Tiering
                </span>
              </div>

              {/* Age Input & Dynamic Badge */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="depositor-age" className="text-sm font-bold text-slate-900 dark:text-white">
                    Depositor Age
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Used for Senior Privilege Rate</span>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="relative w-28 shrink-0">
                    <input
                      id="depositor-age"
                      type="number"
                      min="18"
                      max="105"
                      value={persona.age}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setPersona((p) => ({ ...p, age: val }));
                      }}
                      className="w-full h-12 px-3 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xl font-bold focus:outline-hidden focus:ring-2 focus:ring-[#006c4a] tabular-nums"
                    />
                  </div>

                  <div className="flex-1 p-2.5 sm:p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-[#006c4a] dark:text-[#10b981] shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{ageTierTitle}</span>
                      <span className="text-[11px] font-bold text-[#006c4a] dark:text-[#10b981]">{ageTierDesc}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  Depositors aged 80+ automatically unlock the{' '}
                  <strong className="text-slate-800 dark:text-slate-200">Super Senior Citizen tier (+0.75% to +0.80%)</strong>{' '}
                  across participating scheduled banks.
                </p>
              </div>

              {/* Gender Selection */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-900 dark:text-white">Gender Allocation</label>
                  <span className="text-xs font-medium text-[#006c4a] dark:text-[#10b981]">
                    Mahila Samman Active
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['female', 'male', 'other'] as const).map((g) => {
                    const isSelected = persona.gender === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setPersona((p) => ({ ...p, gender: g }))}
                        className={`py-2 rounded-xl text-xs sm:text-sm font-semibold capitalize transition-all ${
                          isSelected
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Female depositors qualify for statutory central initiatives such as{' '}
                  <strong className="text-slate-900 dark:text-white">Mahila Samman Savings (7.50%)</strong> and dedicated
                  retail tenures at select public banks.
                </div>
              </div>

              {/* State / Domicile Dropdown */}
              <div className="flex flex-col gap-2">
                <label htmlFor="state-region" className="text-sm font-bold text-slate-900 dark:text-white">
                  State / Domicile
                </label>
                <div className="relative">
                  <select
                    id="state-region"
                    value={persona.state}
                    onChange={(e) => setPersona((p) => ({ ...p, state: e.target.value }))}
                    className="w-full h-12 pl-4 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs sm:text-sm font-semibold appearance-none cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#006c4a]"
                  >
                    <option value="All India (Pan-India)">All India (Pan-India)</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Telangana">Telangana</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Residency Status */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-900 dark:text-white">
                  Tax & Residency Classification
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center p-3 rounded-xl cursor-pointer border transition-all ${
                      persona.residency === 'resident'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="residency"
                      checked={persona.residency === 'resident'}
                      onChange={() => setPersona((p) => ({ ...p, residency: 'resident' }))}
                      className="h-4 w-4 text-[#006c4a] accent-[#006c4a]"
                    />
                    <span className="ml-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Resident Indian
                    </span>
                  </label>

                  <label
                    className={`flex items-center p-3 rounded-xl cursor-pointer border transition-all ${
                      persona.residency === 'nri'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="residency"
                      checked={persona.residency === 'nri'}
                      onChange={() => setPersona((p) => ({ ...p, residency: 'nri' }))}
                      className="h-4 w-4 text-[#006c4a] accent-[#006c4a]"
                    />
                    <span className="ml-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                      NRI (NRE / NRO)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Live Peak Yield Estimator Preview Card */}
            <div className="bg-[#0e1c2f] text-white rounded-2xl p-6 sm:p-7 shadow-lg flex flex-col gap-5 relative overflow-hidden">
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold">
                    Algorithmic Peak Yield
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-bold">
                  Top Ranked Bank
                </span>
              </div>

              <div className="flex flex-col z-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums">
                    {effectivePeakRate.toFixed(2)}%
                  </span>
                  <span className="text-xs sm:text-sm text-slate-300 font-semibold">p.a. (CAGR)</span>
                </div>
                <span className="text-xs text-slate-400 mt-0.5">
                  Base Rate {baseBenchmarkRate.toFixed(2)}% + {agePremium.toFixed(2)}% {persona.age >= 60 ? 'Senior Privilege' : 'Standard'}
                </span>
              </div>

              {/* Yield Splitting */}
              <div className="grid grid-cols-2 gap-3 z-10">
                <div className="p-3.5 rounded-xl bg-white/10 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase text-slate-300 font-medium">Total Interest Gain</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-300 tabular-nums">
                    ₹{formatINR(calc.totalInterest)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/10 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase text-slate-300 font-medium">Estimated Maturity</span>
                  <span className="text-base sm:text-lg font-bold text-white tabular-nums">
                    ₹{formatINR(calc.maturityAmount)}
                  </span>
                </div>
              </div>

              {/* Compounding Trajectory Chart */}
              <div className="w-full flex flex-col gap-1 z-10">
                <div className="flex items-center justify-between text-slate-300 text-[10px]">
                  <span>Compounding Trajectory</span>
                  <span>Yr 1 → Yr 2 → Yr 3</span>
                </div>
                <div className="h-10 w-full flex items-end">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 40">
                    <path
                      d="M 0,38 Q 75,34 150,22 T 300,4 L 300,40 L 0,40 Z"
                      fill="rgba(104, 219, 169, 0.15)"
                    />
                    <path
                      d="M 0,38 Q 75,34 150,22 T 300,4"
                      fill="none"
                      stroke="#68dba9"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />
                    <circle cx="0" cy="38" fill="#68dba9" r="3" />
                    <circle cx="150" cy="22" fill="#68dba9" r="3" />
                    <circle cx="300" cy="4" fill="#85f8c4" r="4" />
                  </svg>
                </div>
              </div>

              {/* Statutory TDS Alert Notice */}
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200 flex items-start gap-2.5 z-10 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Statutory TDS Provision (Sec 194A)
                  </span>
                  <p className="text-[11px] leading-tight">
                    {calc.annualInterestFY3 > (persona.age >= 60 ? 50000 : 40000) ? (
                      <>
                        Interest crosses ₹{persona.age >= 60 ? '50,000' : '40,000'}/yr limit. TDS estimated at ~₹
                        {formatINR(calc.estimatedTdsYear3)}/yr unless{' '}
                        <span className="underline font-bold">{persona.age >= 60 ? 'Form 15H' : 'Form 15G'}</span> is submitted.
                      </>
                    ) : (
                      'Interest is comfortably within the statutory TDS-free threshold.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={onProceedToLeaderboard}
                className="w-full h-14 bg-[#006c4a] hover:bg-[#005137] dark:bg-[#10b981] dark:text-slate-950 dark:hover:bg-[#059669] active:scale-[0.99] transition-all rounded-xl flex items-center justify-center gap-2.5 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-900/20 cursor-pointer"
              >
                <span>Compare Rates & Calculate Returns (48 Banks Found)</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-xs text-center">
                <ShieldCheck className="w-4 h-4 text-[#006c4a] dark:text-[#10b981]" />
                <span>100% Free & Unbiased • DICGC Insured Banks up to ₹5,00,000</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Section: Mechanics of Term Deposits */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 sm:py-12">
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              RBI Master Directions Compounding Mandate
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Mathematical Mechanics of Term Deposits
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-900 dark:text-white font-bold text-xs">
                01
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">Quarterly Compounding Cycle</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Per RBI guidelines, scheduled banks calculate interest on a quarterly compounding frequency (n=4). Even
                minor 0.25% shifts produce magnified outcomes over 36 to 60 month horizons.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-900 dark:text-white font-bold text-xs">
                02
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">Small Finance Banks (SFBs)</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                SFBs are governed identically under the Banking Regulation Act of 1949 and carry the exact same ₹5,00,000
                DICGC insurance safety seal as state giants like SBI or HDFC.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-900 dark:text-white font-bold text-xs">
                03
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">Section 80C Tax Saver Lockdown</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                5-Year fixed deposits qualify for tax deductions up to ₹1.5 Lakhs under Section 80C. Note that these
                deposits carry a mandatory non-callable 5-year lock-in with zero premature break facilities.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
