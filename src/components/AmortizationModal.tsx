import React from 'react';
import { X, Lightbulb, ArrowRight, ShieldCheck, Calendar } from 'lucide-react';
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

  const rate = getEffectiveRate(bank, persona, persona.tenureMonths);
  const depositAmount = persona.depositType === 'RD' ? (persona.monthlyInstallment ?? persona.principal) : persona.principal;
  const calculation = calculateYield(
    depositAmount,
    rate,
    persona.tenureMonths,
    persona.age,
    persona.form15HSubmitted,
    persona.depositType,
    persona.panLinked
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#006c4a] dark:text-[#10b981]">
              {bank.categoryTag} • {persona.depositType === 'RD' ? 'Recurring Deposit (RD)' : 'Fixed Deposit (FD)'}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {bank.name} - Amortization Schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              RBI Master Directions Compliant Compounding ({persona.tenureMonths} Months / {(persona.tenureMonths / 12).toFixed(1)} Years @ {rate}% p.a.)
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-center">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {persona.depositType === 'RD' ? 'Total Deposit' : 'Principal'}
            </span>
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
              ₹{formatINR(calculation.totalInvested)}
            </p>
            {persona.depositType === 'RD' && (
              <span className="text-[10px] text-slate-400">₹{formatINR(depositAmount)}/mo</span>
            )}
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Interest Earned</span>
            <p className="text-base sm:text-lg font-bold text-[#006c4a] dark:text-[#10b981] tabular-nums mt-0.5">
              +₹{formatINR(calculation.totalInterest)}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold">{rate.toFixed(2)}% p.a.</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gross Maturity</span>
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
              ₹{formatINR(calculation.maturityAmount)}
            </p>
            <span className="text-[10px] text-slate-400">Before TDS</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Payout</span>
            <p className="text-base sm:text-lg font-bold text-[#006c4a] dark:text-[#10b981] tabular-nums mt-0.5">
              ₹{formatINR(calculation.netMaturityWithTds)}
            </p>
            <span className="text-[10px] text-slate-400">
              {persona.form15HSubmitted ? '15G/15H Exempt' : 'Net After TDS'}
            </span>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Quarterly Compounding Projection & Tax Audit
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {calculation.quarters.length} Quarters Total
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Quarter</th>
                  <th className="px-3 py-2.5 font-semibold">Date</th>
                  <th className="px-3 py-2.5 font-semibold">Opening Balance</th>
                  <th className="px-3 py-2.5 font-semibold">Interest Accrued</th>
                  <th className="px-3 py-2.5 font-semibold">TDS Status</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 tabular-nums">
                {calculation.quarters.map((q) => (
                  <tr
                    key={q.quarter}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                      q.isFyEnd ? 'bg-emerald-50/30 dark:bg-emerald-950/20 font-semibold' : ''
                    }`}
                  >
                    <td className="px-3 py-2 text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{q.label}</span>
                      {q.fyLabel && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px]">
                          {q.fyLabel}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{q.date}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">₹{formatINR(q.openingBalance)}</td>
                    <td className="px-3 py-2 text-[#006c4a] dark:text-[#10b981] font-semibold">
                      +₹{formatINR(q.interestEarned)}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className={q.tdsAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}>
                        {q.tdsStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-bold text-right text-slate-900 dark:text-white">
                      ₹{formatINR(q.closingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tip Box */}
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3 text-[#00714e] dark:text-[#a7f3d0]">
          <Lightbulb className="w-5 h-5 shrink-0 mt-0.5 text-[#006c4a] dark:text-[#10b981]" />
          <div className="text-xs leading-relaxed flex flex-col gap-0.5">
            <strong>Tax & Compliance Insights:</strong>
            <span>
              Under Section 194A, TDS triggers if annual interest exceeds {persona.age >= 60 ? '₹50,000 (Senior Citizen 80TTB limit)' : '₹40,000'}.
              {persona.form15HSubmitted
                ? ' Form 15G/15H is active: 0% withholding tax is applied at source.'
                : ' Submitting Form 15G (below 60) or Form 15H (senior citizens) avoids TDS deduction if your total taxable income is below basic threshold.'}
            </span>
          </div>
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
            <span>Proceed to Official Booking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
