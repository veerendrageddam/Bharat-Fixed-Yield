import React, { useState } from 'react';
import { X, Scale, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { BankData, UserPersona } from '../types/bank';
import { calculateYield, formatINR, getEffectiveRate } from '../utils/calculator';

interface CompareDrawerProps {
  comparedBanks: BankData[];
  onRemoveBank: (bankId: string) => void;
  onClearAll: () => void;
  persona: UserPersona;
  onInvest: (bank: BankData) => void;
}

export const CompareDrawer: React.FC<CompareDrawerProps> = ({
  comparedBanks,
  onRemoveBank,
  onClearAll,
  persona,
  onInvest,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalOpen(false);
      }
    };
    if (modalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  if (comparedBanks.length === 0) return null;

  const depositAmount = persona.depositType === 'RD' ? (persona.monthlyInstallment ?? persona.principal) : persona.principal;

  return (
    <>
      {/* Floating Bottom Dock */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-[#161b22]/95 text-white backdrop-blur-md px-4 sm:px-6 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-4 sm:gap-6 max-w-[90vw]">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-emerald-400" />
          <span className="text-xs sm:text-sm font-bold">
            {comparedBanks.length} Bank{comparedBanks.length > 1 ? 's' : ''} Selected
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          {comparedBanks.map((b) => (
            <span
              key={b.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700"
            >
              <span>{b.name.split(' ')[0]}</span>
              <button
                onClick={() => onRemoveBank(b.id)}
                className="hover:text-rose-400 transition-colors"
                aria-label={`Remove ${b.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#006c4a] hover:bg-[#005137] dark:bg-[#10b981] dark:text-slate-950 text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span>Compare Side-by-Side</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClearAll}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  Head-to-Head Bank Rate Comparison
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Based on {persona.depositType === 'RD' ? `₹${formatINR(depositAmount)}/mo RD` : `₹${formatINR(depositAmount)} FD`} for {persona.tenureMonths} Months ({persona.age >= 60 ? 'Senior Citizen' : 'General'})
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label="Close comparison modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4 text-slate-500 font-semibold w-40">Feature</th>
                    {comparedBanks.map((b) => (
                      <th key={b.id} className="py-3 px-4 font-bold text-slate-900 dark:text-white min-w-[200px]">
                        <div className="flex items-center justify-between">
                          <span>{b.name}</span>
                          <button
                            onClick={() => onRemoveBank(b.id)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Applied Interest Rate</td>
                    {comparedBanks.map((b) => {
                      const tenureDays = persona.tenureUnit === 'days' ? persona.tenureDays : undefined;
                      const rate = getEffectiveRate(b, persona, persona.tenureMonths, tenureDays);
                      return (
                        <td key={b.id} className="py-3 px-4 text-base font-extrabold text-[#006c4a] dark:text-[#10b981] tabular-nums">
                          {rate.toFixed(2)}% p.a.
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Total Invested</td>
                    {comparedBanks.map((b) => {
                      const tenureDays = persona.tenureUnit === 'days' ? persona.tenureDays : undefined;
                      const rate = getEffectiveRate(b, persona, persona.tenureMonths, tenureDays);
                      const calc = calculateYield(depositAmount, rate, persona.tenureMonths, persona.age, persona.form15HSubmitted, persona.depositType, persona.panLinked, tenureDays);
                      return (
                        <td key={b.id} className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                          ₹{formatINR(calc.totalInvested)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Gross Maturity</td>
                    {comparedBanks.map((b) => {
                      const tenureDays = persona.tenureUnit === 'days' ? persona.tenureDays : undefined;
                      const rate = getEffectiveRate(b, persona, persona.tenureMonths, tenureDays);
                      const calc = calculateYield(depositAmount, rate, persona.tenureMonths, persona.age, persona.form15HSubmitted, persona.depositType, persona.panLinked, tenureDays);
                      return (
                        <td key={b.id} className="py-3 px-4 font-bold text-slate-900 dark:text-white tabular-nums">
                          ₹{formatINR(calc.maturityAmount)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Total Interest Gain</td>
                    {comparedBanks.map((b) => {
                      const tenureDays = persona.tenureUnit === 'days' ? persona.tenureDays : undefined;
                      const rate = getEffectiveRate(b, persona, persona.tenureMonths, tenureDays);
                      const calc = calculateYield(depositAmount, rate, persona.tenureMonths, persona.age, persona.form15HSubmitted, persona.depositType, persona.panLinked, tenureDays);
                      return (
                        <td key={b.id} className="py-3 px-4 font-semibold text-[#006c4a] dark:text-[#10b981] tabular-nums">
                          +₹{formatINR(calc.totalInterest)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Effective Annual Yield</td>
                    {comparedBanks.map((b) => {
                      const tenureDays = persona.tenureUnit === 'days' ? persona.tenureDays : undefined;
                      const rate = getEffectiveRate(b, persona, persona.tenureMonths, tenureDays);
                      const calc = calculateYield(depositAmount, rate, persona.tenureMonths, persona.age, persona.form15HSubmitted, persona.depositType, persona.panLinked, tenureDays);
                      return (
                        <td key={b.id} className="py-3 px-4 text-slate-700 dark:text-slate-300 tabular-nums">
                          {calc.effectiveAnnualYield}% (Compounded)
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Credit Rating</td>
                    {comparedBanks.map((b) => (
                      <td key={b.id} className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {b.rating}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Sector Classification</td>
                    {comparedBanks.map((b) => (
                      <td key={b.id} className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {b.categoryTag}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">Premature Penalty</td>
                    {comparedBanks.map((b) => (
                      <td key={b.id} className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {b.exitPenalty} ({b.lockInDays}d lock-in)
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">DICGC Insurance</td>
                    {comparedBanks.map((b) => (
                      <td key={b.id} className="py-3 px-4 text-[#00714e] dark:text-[#a7f3d0] font-semibold">
                        <span className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> 100% Insured to ₹5L
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">Action</td>
                    {comparedBanks.map((b) => (
                      <td key={b.id} className="py-4 px-4">
                        <button
                          onClick={() => {
                            setModalOpen(false);
                            onInvest(b);
                          }}
                          className="w-full py-2 px-3 rounded-lg bg-[#006c4a] hover:bg-[#005137] text-white font-bold text-xs transition-colors"
                        >
                          Book via Bank Portal
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
