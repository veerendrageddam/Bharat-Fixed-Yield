import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  X,
  ShieldCheck,
  Calendar,
  Layers,
  Coins,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Clock,
  ArrowRight,
  Shield,
  FileText
} from 'lucide-react';
import { BankData, UserPersona } from '../types/bank';
import { calculateYield, formatINR, getEffectiveRate } from '../utils/calculator';

interface TenureInspectionScreenProps {
  bank: BankData;
  persona: UserPersona;
  onBack: () => void;
  onInvest: (bank: BankData) => void;
}

export const TenureInspectionScreen: React.FC<TenureInspectionScreenProps> = ({
  bank,
  persona,
  onBack,
  onInvest,
}) => {
  const [form15HSubmitted, setForm15HSubmitted] = useState<boolean>(persona.form15HSubmitted);

  const effectiveRate = getEffectiveRate(bank, persona);
  const calc = calculateYield(persona.principal, effectiveRate, persona.tenureMonths, persona.age, form15HSubmitted);

  // CSV Exporter for 12 quarters
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Quarter,Date,Opening Balance,Interest Earned,Cumulative Interest,Closing Balance,TDS Status\n';
    calc.quarters.forEach((q) => {
      csvContent += `${q.label},"${q.date}",${q.openingBalance},${q.interestEarned},${q.cumulativeInterest},${q.closingBalance},"${q.tdsStatus}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${bank.name.replace(/\s+/g, '_')}_Amortization_Schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isSenior = persona.age >= 60;
  const exemptionLimit = isSenior ? 50000 : 40000;
  const exceedsFY3 = calc.annualInterestFY3 > exemptionLimit;

  return (
    <div className="w-full min-h-screen bg-[#f7f9fb] dark:bg-[#0e1217] py-6 sm:py-10 px-4 sm:px-6 lg:px-12 flex justify-center transition-colors">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        {/* Top Breadcrumb Context Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#161b22] px-4 sm:px-5 py-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <button onClick={onBack} className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Bank Comparisons
            </button>
            <span>/</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{bank.name}</span>
            <span>/</span>
            <span className="font-bold text-[#006c4a] dark:text-[#10b981]">
              Tenure Inspection (Schedule {persona.tenureMonths}M)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#00714e] dark:text-[#a7f3d0] text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              DICGC Reg. Active
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline font-medium">
              FY 2025-26 Tax Regime Ready
            </span>
          </div>
        </div>

        {/* Master Inspection Card Canvas */}
        <section className="bg-white dark:bg-[#161b22] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-2xl font-extrabold shadow-sm shrink-0">
                {bank.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {bank.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#006c4a] text-white text-[11px] font-bold">
                    Scheduled Bank
                  </span>
                  {isSenior && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                      Senior Citizen Tier (+{bank.seniorBonus.toFixed(2)}%)
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  FD Certificate Amortization Schedule & Section 194A Tax Planning Engine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
              <button
                onClick={handleExportCSV}
                className="h-10 px-4 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={onBack}
                aria-label="Close Inspection View"
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Key Yield Parameters Ribbon (5 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 sm:p-5 bg-slate-100/70 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800">
            <div className="p-4 bg-white dark:bg-[#161b22] rounded-xl shadow-2xs border border-slate-200/60 dark:border-slate-800 flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Deposit Principal
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
                ₹{formatINR(persona.principal)}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">One-time cumulative</span>
            </div>

            <div className="p-4 bg-white dark:bg-[#161b22] rounded-xl shadow-2xs border border-slate-200/60 dark:border-slate-800 flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Effective Interest
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl sm:text-2xl font-extrabold text-[#006c4a] dark:text-[#10b981] tabular-nums">
                  {effectiveRate.toFixed(2)}%
                </span>
                <span className="text-xs text-slate-500 font-semibold">p.a.</span>
              </div>
              <span className="text-[11px] text-[#006c4a] dark:text-[#10b981] font-semibold">
                {calc.effectiveAnnualYield}% Annualized Yield
              </span>
            </div>

            <div className="p-4 bg-white dark:bg-[#161b22] rounded-xl shadow-2xs border border-slate-200/60 dark:border-slate-800 flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Compounding Regime
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 capitalize">
                {persona.compounding}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">n = 4 cycles / annum</span>
            </div>

            <div className="p-4 bg-white dark:bg-[#161b22] rounded-xl shadow-2xs border border-slate-200/60 dark:border-slate-800 flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Tenure & Maturity
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                {persona.tenureMonths} Months
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Due: April 2028</span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl shadow-2xs border border-emerald-200 dark:border-emerald-800 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-[#00714e] dark:text-[#a7f3d0] uppercase tracking-wider">
                Total Maturity Corpus
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#006c4a] dark:text-[#10b981] tabular-nums mt-1">
                ₹{formatINR(form15HSubmitted ? calc.maturityAmount : calc.netMaturityWithTds)}
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                +₹{formatINR(calc.totalInterest)} Total Gain
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex flex-col gap-8">
            {/* Split Banner: Trajectory Chart & TDS Engine */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Data Visualization: Interest Trajectory Chart */}
              <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      3-Year Compounding Acceleration
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Quarter-on-quarter capital base progression via continuous reinvestment
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                    Non-Linear Curve
                  </span>
                </div>

                {/* SVG Visualizer */}
                <div className="w-full py-4">
                  <svg className="w-full h-32 overflow-visible" preserveAspectRatio="none" viewBox="0 0 540 140">
                    <defs>
                      <linearGradient id="yieldGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#006c4a" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#006c4a" stopOpacity="0.00" />
                      </linearGradient>
                    </defs>
                    <line stroke="#c5c6cd" strokeDasharray="3 3" strokeWidth="0.75" x1="0" x2="540" y1="20" y2="20" />
                    <line stroke="#c5c6cd" strokeDasharray="3 3" strokeWidth="0.75" x1="0" x2="540" y1="65" y2="65" />
                    <line stroke="#c5c6cd" strokeDasharray="3 3" strokeWidth="0.75" x1="0" x2="540" y1="110" y2="110" />

                    <polygon
                      fill="url(#yieldGrad)"
                      points="0,110 45,103 90,96 135,89 180,81 225,73 270,64 315,55 360,45 405,34 450,22 495,10 540,0 540,120 0,120"
                    />
                    <path
                      d="M0,110 C45,103 90,96 135,89 C180,81 225,73 270,64 C315,55 360,45 405,34 C450,22 495,10 540,0"
                      fill="none"
                      stroke="#006c4a"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                    <circle cx="0" cy="110" fill="#006c4a" r="4" />
                    <circle cx="180" cy="81" fill="#006c4a" r="4" />
                    <circle cx="360" cy="45" fill="#006c4a" r="4" />
                    <circle cx="540" cy="0" fill="#10b981" r="5" />
                  </svg>
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-[11px] pt-2 tabular-nums">
                    <span>Start: ₹{formatINR(persona.principal)} (Q0)</span>
                    <span>End Y1: ₹{formatINR(persona.principal + calc.annualInterestFY1)} (Q4)</span>
                    <span>End Y2: ₹{formatINR(persona.principal + calc.annualInterestFY1 + calc.annualInterestFY2)} (Q8)</span>
                    <span className="text-[#006c4a] dark:text-[#10b981] font-bold">
                      Maturity: ₹{formatINR(calc.maturityAmount)} (Q12)
                    </span>
                  </div>
                </div>

                {/* Annualized Breakdown Strips */}
                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  <div className="p-3 rounded-xl bg-white dark:bg-[#161b22] border border-slate-200/60 dark:border-slate-800 flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">FY 1 (Q1-Q4)</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                      ₹{formatINR(calc.annualInterestFY1)}
                    </span>
                    <span className="text-[11px] text-[#006c4a] dark:text-[#10b981]">
                      {((calc.annualInterestFY1 / persona.principal) * 100).toFixed(2)}% yield
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#161b22] border border-slate-200/60 dark:border-slate-800 flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">FY 2 (Q5-Q8)</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                      ₹{formatINR(calc.annualInterestFY2)}
                    </span>
                    <span className="text-[11px] text-[#006c4a] dark:text-[#10b981]">
                      {((calc.annualInterestFY2 / persona.principal) * 100).toFixed(2)}% on orig.
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#161b22] border border-slate-200/60 dark:border-slate-800 flex flex-col">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">FY 3 (Q9-Q12)</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                      ₹{formatINR(calc.annualInterestFY3)}
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${
                        exceedsFY3 ? 'text-rose-600 dark:text-rose-400' : 'text-[#006c4a] dark:text-[#10b981]'
                      }`}
                    >
                      {exceedsFY3 ? `Exceeds ₹${Math.round(exemptionLimit / 1000)}k` : 'Exempt'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Tax & TDS Strategy Engine */}
              <div className="lg:col-span-5 bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-2xs">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-[#006c4a] dark:text-[#10b981]" />
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Tax & TDS Strategy Engine
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Income Tax Act Section 194A Provisions
                  </span>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-xl flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {isSenior ? 'Senior Exemption Ceiling:' : 'General Exemption Ceiling:'}
                      </span>
                      <span className="font-bold text-[#006c4a] dark:text-[#10b981]">
                        ₹{formatINR(exemptionLimit)} / FY
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                      Year 1 (₹{formatINR(calc.annualInterestFY1)}) and Year 2 (₹{formatINR(calc.annualInterestFY2)}) are
                      exempt from TDS. Year 3 interest reaches{' '}
                      <strong className="text-slate-900 dark:text-white">₹{formatINR(calc.annualInterestFY3)}</strong>
                      {exceedsFY3 && ', creating a statutory trigger.'}
                    </p>
                  </div>

                  {/* Dynamic Alert Banner */}
                  <div
                    className={`p-4 rounded-xl transition-all duration-300 flex items-start gap-3 border ${
                      form15HSubmitted
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80'
                        : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                    }`}
                  >
                    {form15HSubmitted ? (
                      <CheckCircle2 className="w-5 h-5 text-[#006c4a] dark:text-[#10b981] shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex flex-col">
                      <span
                        className={`text-xs font-bold ${
                          form15HSubmitted ? 'text-[#00714e] dark:text-[#a7f3d0]' : 'text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {form15HSubmitted ? 'Form 15H Exemption Applied (0% TDS)' : 'Year 3 TDS Deduction Alert'}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {form15HSubmitted ? (
                          <>
                            Zero TDS will be deducted at source. Full interest of ₹{formatINR(calc.annualInterestFY3)} in Year 3
                            will be credited without tax deduction, paying the 100% maturity value of{' '}
                            <strong>₹{formatINR(calc.maturityAmount)}</strong>.
                          </>
                        ) : (
                          <>
                            Section 194A triggers 10% TDS (<strong>₹{formatINR(calc.estimatedTdsYear3)}</strong>) with PAN linked
                            (20% or ₹{formatINR(calc.estimatedTdsYear3 * 2)} without PAN). Net payout without declaration drops to ₹
                            {formatINR(calc.netMaturityWithTds)}.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form 15H Interactive Toggle */}
                <div className="pt-4">
                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={form15HSubmitted}
                      onChange={(e) => setForm15HSubmitted(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded text-[#006c4a] accent-[#006c4a] cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Submit {isSenior ? 'Form 15H' : 'Form 15G'} ({isSenior ? 'Senior Citizen' : 'General'} Zero-Tax Declaration)
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Confirm eligibility (estimated total taxable income is NIL). Automatically waives ₹
                        {formatINR(calc.estimatedTdsYear3)} TDS.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* 12-Quarter Amortization Schedule Table */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Quarter-by-Quarter Amortization Schedule
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Compounding formula applied: A = P × (1 + r/400)^t • Applied Rate = {effectiveRate.toFixed(2)}%
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    Standard Quarters
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    FY3 Threshold Cross
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">Quarter / Date</th>
                      <th className="py-3 px-4 text-right font-semibold">Opening Balance</th>
                      <th className="py-3 px-4 text-right font-semibold">Interest Earned (P × r/400)</th>
                      <th className="py-3 px-4 text-right font-semibold">Cumulative Interest</th>
                      <th className="py-3 px-4 text-right font-semibold">Closing Balance</th>
                      <th className="py-3 px-4 text-center font-semibold">TDS Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 tabular-nums">
                    {calc.quarters.map((q) => {
                      const isQ12 = q.quarter === 12;
                      const isFY3 = q.quarter >= 9;

                      return (
                        <tr
                          key={q.quarter}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors ${
                            isQ12
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 font-semibold'
                              : isFY3
                              ? 'bg-slate-50/50 dark:bg-slate-900/30'
                              : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                            {q.label}
                            <span className="font-normal text-slate-500 dark:text-slate-400 text-[11px] block">
                              {q.date}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">
                            ₹{formatINR(q.openingBalance)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-[#006c4a] dark:text-[#10b981]">
                            +₹{formatINR(q.interestEarned)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">
                            ₹{formatINR(q.cumulativeInterest)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-semibold ${
                              isQ12 ? 'text-base font-extrabold text-[#006c4a] dark:text-[#10b981]' : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            ₹{formatINR(q.closingBalance)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isQ12 ? (
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  form15HSubmitted
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-[#00714e] dark:text-[#a7f3d0]'
                                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                }`}
                              >
                                {form15HSubmitted ? 'Form 15H (₹0 TDS)' : `10% TDS (₹${formatINR(calc.estimatedTdsYear3)})`}
                              </span>
                            ) : q.isFyEnd ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#00714e] dark:text-[#a7f3d0] text-[10px] font-bold">
                                {q.quarter === 4 ? `FY1 Total: ₹${(calc.annualInterestFY1 / 1000).toFixed(1)}k` : `FY2 Total: ₹${(calc.annualInterestFY2 / 1000).toFixed(1)}k`}
                              </span>
                            ) : q.quarter === 11 ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                                Limit Approached
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                                {q.tdsStatus}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Regulatory Safety & Exit Terms Dual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-[#006c4a] dark:text-[#10b981] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      DICGC Statutory Insurance Cover
                    </span>
                    <span className="text-[10px] font-bold text-[#006c4a] dark:text-[#10b981]">
                      Registration Certificate No: SFB-042
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Under the DICGC Act, your aggregate fixed and recurring deposit balance in {bank.name} is 100% insured
                      up to ₹5,00,000 for both principal and accrued interest. Deposits beyond ₹5L carry standard scheduled bank
                      senior claim priority.
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Insured Authority: Reserve Bank of India</span>
                  <span className="text-[#006c4a] dark:text-[#10b981] font-bold">₹5,00,000 Safe Zone</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Liquidity & Premature Exit Terms
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      Mandatory {bank.lockInDays} Days Minimum Lock-in
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Premature closure permitted at any time after {bank.lockInDays} days. Under RBI rules, interest will be
                      calculated at the applicable rate for the contracted tenure or tenure held (whichever is lower), less{' '}
                      <strong>{bank.exitPenalty}</strong>.
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Partial Withdrawal: Net Banking Supported</span>
                  <span className="text-slate-900 dark:text-white font-bold">{bank.exitPenalty}</span>
                </div>
              </div>
            </div>

            {/* Paperless V-KYC Onboarding Requirements */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-[#00714e] dark:text-[#a7f3d0] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Paperless V-KYC Onboarding Requirements
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006c4a] dark:text-[#10b981]" />
                      Aadhaar Card (linked mobile)
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006c4a] dark:text-[#10b981]" />
                      PAN Card
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006c4a] dark:text-[#10b981]" />
                      Bank Account for RTGS/UPI Funding
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                Average Booking Time: <strong className="text-slate-900 dark:text-white">3.5 Minutes</strong>
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer Actions */}
          <div className="p-5 sm:p-7 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <button
              onClick={onBack}
              className="h-12 px-5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Comparisons</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Guaranteed Maturity Corpus
                </span>
                <span className="text-xl font-extrabold text-[#006c4a] dark:text-[#10b981] tabular-nums">
                  ₹{formatINR(form15HSubmitted ? calc.maturityAmount : calc.netMaturityWithTds)}
                </span>
              </div>

              <button
                onClick={() => onInvest(bank)}
                className="h-12 px-6 rounded-xl bg-[#006c4a] hover:bg-[#005137] dark:bg-[#10b981] dark:text-slate-950 dark:hover:bg-[#059669] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Open FD with {bank.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
