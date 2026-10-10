import React, { useState } from 'react';
import {
  Gavel,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Info,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { formatINR } from '../utils/calculator';

export const TaxGuideScreen: React.FC = () => {
  const [testAge, setTestAge] = useState<number>(62);
  const [testTotalIncome, setTestTotalIncome] = useState<number>(240000);
  const [testInterestIncome, setTestInterestIncome] = useState<number>(55000);
  const [selectedRegime, setSelectedRegime] = useState<'new' | 'old'>('new');

  const isSenior = testAge >= 60;
  const basicExemption = selectedRegime === 'new' ? 300000 : isSenior ? 300000 : 250000;
  const totalTaxable = Math.max(0, testTotalIncome + testInterestIncome);
  const isTaxNil = totalTaxable <= basicExemption;

  // 15G/15H verdict
  let formType = isSenior ? 'Form 15H' : 'Form 15G';
  let isEligible = false;
  let eligibilityReason = '';

  if (isSenior) {
    if (isTaxNil) {
      isEligible = true;
      eligibilityReason = `Total taxable income (₹${formatINR(totalTaxable)}) is within basic exemption limit of ₹${formatINR(basicExemption)}. You are 100% eligible for Form 15H.`;
    } else {
      isEligible = false;
      eligibilityReason = `Total income (₹${formatINR(totalTaxable)}) exceeds basic exemption limit of ₹${formatINR(basicExemption)}. Form 15H cannot be submitted; 10% TDS is mandatory and refundable via ITR.`;
    }
  } else {
    // 15G requires BOTH interest < basicExemption AND tax = NIL
    if (testInterestIncome <= basicExemption && isTaxNil) {
      isEligible = true;
      eligibilityReason = `Total taxable income is NIL and interest is within exemption. Eligible for Form 15G.`;
    } else {
      isEligible = false;
      eligibilityReason = `Total income exceeds basic exemption limit or tax is payable. Form 15G cannot be submitted.`;
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-10 flex flex-col gap-8 transition-colors">
      {/* Title */}
      <div className="flex flex-col gap-2 max-w-3xl">
        <div className="flex items-center gap-2">
          <Gavel className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
            Statutory Income Tax Compliance
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Form 15G & 15H Zero-TDS Strategy Guide
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Master Section 194A provisions, understand senior citizen ₹50,000 exemption thresholds under Section 80TTB, and
          prevent unwanted tax deductions on bank fixed deposits.
        </p>
      </div>

      {/* Interactive Eligibility Checker */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Instant Form 15G / 15H Eligibility Calculator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verify whether your scheduled bank branch can legally waive TDS on deposit interest
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#00714e] dark:text-[#a7f3d0] text-xs font-bold">
            FY 2025-26 Rules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Depositor Age</label>
            <input
              type="number"
              min="18"
              max="105"
              value={testAge}
              onChange={(e) => setTestAge(parseInt(e.target.value, 10) || 18)}
              className="h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-base focus:outline-hidden focus:ring-2 focus:ring-[#006c4a]"
            />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {isSenior ? 'Senior Citizen (60+ yrs) → Form 15H' : 'General (<60 yrs) → Form 15G'}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Other Annual Income (Excl. FD Interest)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="10000"
                value={testTotalIncome}
                onChange={(e) => setTestTotalIncome(parseInt(e.target.value, 10) || 0)}
                className="w-full h-12 pl-8 pr-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-base focus:outline-hidden focus:ring-2 focus:ring-[#006c4a]"
              />
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Pension, rental, or capital gains</span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Estimated Total Bank FD Interest / FY
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="5000"
                value={testInterestIncome}
                onChange={(e) => setTestInterestIncome(parseInt(e.target.value, 10) || 0)}
                className="w-full h-12 pl-8 pr-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-base focus:outline-hidden focus:ring-2 focus:ring-[#006c4a]"
              />
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              TDS threshold: ₹{isSenior ? '50,000' : '40,000'}
            </span>
          </div>
        </div>

        {/* Live Verdict Banner */}
        <div
          className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isEligible
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
          }`}
        >
          <div className="flex items-start gap-3">
            {isEligible ? (
              <CheckCircle2 className="w-6 h-6 text-[#006c4a] dark:text-[#10b981] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="flex flex-col">
              <span
                className={`text-sm font-bold ${
                  isEligible ? 'text-[#00714e] dark:text-[#a7f3d0]' : 'text-amber-900 dark:text-amber-200'
                }`}
              >
                {isEligible ? `Eligible to Submit ${formType} (0% TDS Deduction)` : `Ineligible for ${formType} (TDS Deductible)`}
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl">
                {eligibilityReason}
              </p>
            </div>
          </div>

          <button
            onClick={() => alert(`Generated statutory guidelines for ${formType}. Download guidance PDF enabled.`)}
            className="shrink-0 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {formType} Form</span>
          </button>
        </div>
      </div>

      {/* Comparative Matrix: 15G vs 15H */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-6">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
          Direct Comparison: Form 15G vs Form 15H
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Provision Parameter</th>
                <th className="py-3 px-4 font-semibold">Form 15G</th>
                <th className="py-3 px-4 font-semibold text-[#006c4a] dark:text-[#10b981]">Form 15H (Senior)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Target Eligibility</td>
                <td className="py-3 px-4">Resident individuals aged below 60 years & HUFs</td>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  Resident individuals aged 60 years or above
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Annual Bank Interest TDS Ceiling</td>
                <td className="py-3 px-4">₹40,000 per financial year</td>
                <td className="py-3 px-4 font-bold text-[#006c4a] dark:text-[#10b981]">
                  ₹50,000 per financial year (Sec 80TTB)
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Mandatory Qualification Condition</td>
                <td className="py-3 px-4">Total interest must NOT exceed basic exemption limit</td>
                <td className="py-3 px-4">Final tax liability on total taxable income must be NIL</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Validity Horizon</td>
                <td className="py-3 px-4">1 Financial Year (Requires annual renewal in April)</td>
                <td className="py-3 px-4">1 Financial Year (Requires annual renewal in April)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">TDS Rate if Form Not Submitted</td>
                <td className="py-3 px-4">10% (with PAN) / 20% (without PAN)</td>
                <td className="py-3 px-4">10% (with PAN) / 20% (without PAN)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Online Submission Walkthrough */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-900 dark:text-white text-xs">
            01
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Login to Net Banking in April</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Submit your self-declaration at the very beginning of the financial year (April 1 to April 30) before the first
            quarterly interest compounding date to avoid retroactive tax deductions.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-900 dark:text-white text-xs">
            02
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Navigate to Service Requests</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Under "Tax Services" or "Deposits", select "Submit Form 15G/15H". The portal will automatically display all
            active Fixed Deposit and Recurring Deposit account numbers.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-900 dark:text-white text-xs">
            03
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Instant OTP Verification</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Verify using your Aadhaar/Mobile OTP. You will receive an instant Unique Identification Number (UIN) and a
            stamped receipt confirming 0% TDS status.
          </p>
        </div>
      </div>
    </div>
  );
};
