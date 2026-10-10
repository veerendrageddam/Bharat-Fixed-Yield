import React from 'react';
import { X, Lightbulb, ArrowRight } from 'lucide-react';
import { BankData, UserPersona } from '../types/bank';
import { calculateYield, formatINR, getEffectiveRate } from '../utils/calculator';

interface AmortizationModalProps {
  bank: BankData | null;
  persona: UserPersona;
  onClose: () => void;
  onInvest: (bank: BankData) => void;
}

export const AmortizationModal: React.FC<AmortizationModalProps> = ({
  bank,
  persona,
  onClose,
  onInvest,
}) => {
  if (!bank) return null;

  const rate = getEffectiveRate(bank, persona);
  const calculation = calculateYield(persona.principal, rate, persona.tenureMonths, persona.age, false);

  const yr1Interest = calculation.annualInterestFY1;
  const yr2Interest = calculation.annualInterestFY2;
  const yr3Interest = calculation.annualInterestFY3;

  const y1Close = persona.principal + yr1Interest;
  const y2Close = y1Close + yr2Interest;
  const y3Close = calculation.maturityAmount;

  const y3Tds = calculation.estimatedTdsYear3;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#006c4a] dark:text-[#10b981]">
              {bank.categoryTag}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {bank.name} - 3 Year Amortization
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              RBI Master Directions Compliant Compounding & TDS Matrix
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Financial Split Cards */}
        <div className="grid grid-cols-3 gap-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-center">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Principal</span>
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
              ₹{formatINR(persona.principal)}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Interest Component</span>
            <p className="text-base sm:text-lg font-bold text-[#006c4a] dark:text-[#10b981] tabular-nums mt-0.5">
              ₹{formatINR(calculation.totalInterest)}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gross Maturity</span>
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
              ₹{formatINR(calculation.maturityAmount)}
            </p>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            Quarterly Compounding Projection & Form 15H Impact
          </span>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Tenure Year</th>
                  <th className="px-3 py-2.5 font-semibold">Opening Bal.</th>
                  <th className="px-3 py-2.5 font-semibold">Accrued Interest</th>
                  <th className="px-3 py-2.5 font-semibold">TDS (10% w/o 15H)</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Net Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 tabular-nums">
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-white">Year 1 (Q1-Q4)</td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">₹{formatINR(persona.principal)}</td>
                  <td className="px-3 py-2.5 font-medium text-[#006c4a] dark:text-[#10b981]">₹{formatINR(yr1Interest)}</td>
                  <td className="px-3 py-2.5 text-slate-500">₹0 (Under limit)</td>
                  <td className="px-3 py-2.5 font-semibold text-right text-slate-900 dark:text-white">₹{formatINR(y1Close)}</td>
                </tr>
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-white">Year 2 (Q5-Q8)</td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">₹{formatINR(y1Close)}</td>
                  <td className="px-3 py-2.5 font-medium text-[#006c4a] dark:text-[#10b981]">₹{formatINR(yr2Interest)}</td>
                  <td className="px-3 py-2.5 text-slate-500">₹0 (Under limit)</td>
                  <td className="px-3 py-2.5 font-semibold text-right text-slate-900 dark:text-white">₹{formatINR(y2Close)}</td>
                </tr>
                <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-white">Year 3 (Q9-Q12)</td>
                  <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">₹{formatINR(y2Close)}</td>
                  <td className="px-3 py-2.5 font-medium text-[#006c4a] dark:text-[#10b981]">₹{formatINR(yr3Interest)}</td>
                  <td className="px-3 py-2.5 text-rose-600 dark:text-rose-400 font-medium">
                    {y3Tds > 0 ? `₹${formatINR(y3Tds)} (Waived via 15H)` : '₹0'}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-right text-slate-900 dark:text-white">₹{formatINR(y3Close)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tip Box */}
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3 text-[#00714e] dark:text-[#a7f3d0]">
          <Lightbulb className="w-5 h-5 shrink-0 mt-0.5 text-[#006c4a] dark:text-[#10b981]" />
          <p className="text-xs leading-relaxed">
            <strong>Tax Optimization Tip:</strong> Submit Form 15H in April of Year 3 to prevent ₹{formatINR(y3Tds || 5382)} TDS deduction at source by the bank branch.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onInvest(bank);
            }}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#006c4a] hover:bg-[#005137] dark:bg-[#10b981] dark:text-slate-950 dark:hover:bg-[#059669] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>Proceed to Verification</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
