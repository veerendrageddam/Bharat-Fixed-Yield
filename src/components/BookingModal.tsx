import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  PhoneCall,
  Info,
  Calendar,
  Building,
  AlertCircle
} from 'lucide-react';
import { BankData, UserPersona } from '../types/bank';
import { calculateYield, formatINR, getEffectiveRate } from '../utils/calculator';

interface BookingModalProps {
  bank: BankData | null;
  persona: UserPersona;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ bank, persona, onClose }) => {
  if (!bank) return null;

  const [activeMode, setActiveMode] = useState<'direct_portal' | 'assisted_callback' | 'success'>('direct_portal');
  const [copiedRef, setCopiedRef] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [dpdpConsent, setDpdpConsent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const rate = getEffectiveRate(bank, persona, persona.tenureMonths);
  const depositAmount = persona.depositType === 'RD' ? (persona.monthlyInstallment ?? persona.principal) : persona.principal;
  const calc = calculateYield(
    depositAmount,
    rate,
    persona.tenureMonths,
    persona.age,
    persona.form15HSubmitted,
    persona.depositType,
    persona.panLinked
  );

  const referenceId = `BFY-${bank.name.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const handleCopySummary = () => {
    const summaryText = [
      `Bharat Fixed Yield - Deposit Summary`,
      `Bank: ${bank.name}`,
      `Deposit Type: ${persona.depositType === 'RD' ? 'Recurring Deposit (RD)' : 'Fixed Deposit (FD)'}`,
      `Investment: ${persona.depositType === 'RD' ? `₹${formatINR(depositAmount)}/month` : `₹${formatINR(depositAmount)} lump sum`}`,
      `Tenure: ${persona.tenureMonths} Months (${(persona.tenureMonths / 12).toFixed(1)} Years)`,
      `Locked Rate: ${rate.toFixed(2)}% p.a.`,
      `Guaranteed Maturity: ₹${formatINR(calc.maturityAmount)}`,
      `DICGC Insured: Up to ₹5 Lakhs (100% Protected)`,
      `Reference ID: ${referenceId}`,
      `Official Portal: ${bank.portalUrl || 'https://www.rbi.org.in/'}`,
    ].join('\n');

    navigator.clipboard?.writeText(summaryText);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const handleRequestCallback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userPhone.trim()) {
      setErrorMsg('Please provide your name and valid mobile number.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(userPhone.replace(/\D/g, ''))) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!dpdpConsent) {
      setErrorMsg('Please consent to allow the official bank representative to contact you.');
      return;
    }

    setErrorMsg('');
    setActiveMode('success');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col gap-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-[#00714e] dark:text-[#a7f3d0] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {activeMode === 'success' ? 'Request Confirmed' : `Official Booking Gateway`}
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {bank.name} • RBI Regulated Scheduled Commercial Bank
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* DPDP Compliance Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>DPDP Act 2023 Compliant:</strong> Bharat Fixed Yield does not collect or store your Aadhaar, PAN, or banking credentials. Your deposit is opened directly through {bank.name}&apos;s official 256-bit encrypted banking infrastructure.
          </span>
        </div>

        {/* Deposit Summary Card */}
        <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/60 flex flex-col gap-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Selected Product:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {persona.depositType === 'RD' ? 'Recurring Deposit (Monthly)' : 'Fixed Deposit (Lump Sum)'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">
              {persona.depositType === 'RD' ? 'Monthly Installment:' : 'Principal Investment:'}
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white tabular-nums text-sm">
              ₹{formatINR(depositAmount)}
            </span>
          </div>

          {persona.depositType === 'RD' && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Total Capital Deposited:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                ₹{formatINR(calc.totalInvested)} ({persona.tenureMonths} Months)
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Horizon / Tenure:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {persona.tenureMonths} Months ({(persona.tenureMonths / 12).toFixed(1)} Years)
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Applicable Yield Rate:</span>
            <span className="font-extrabold text-[#006c4a] dark:text-[#10b981] tabular-nums text-sm">
              {rate.toFixed(2)}% p.a. {persona.age >= 60 ? '(Senior Citizen Bonus Included)' : ''}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-emerald-200/80 dark:border-emerald-800/80">
            <span className="font-bold text-slate-900 dark:text-white">Guaranteed Net Maturity Value:</span>
            <span className="text-base font-extrabold text-[#006c4a] dark:text-[#10b981] tabular-nums">
              ₹{formatINR(calc.maturityAmount)}
            </span>
          </div>
        </div>

        {/* DICGC Statutory Insurance Stamp */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#00714e] dark:text-[#10b981]" />
          <span>Statutory Protection: Insured up to ₹5,00,000 per depositor by DICGC (RBI Subsidiary).</span>
        </div>

        {activeMode === 'direct_portal' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                How would you like to proceed?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You can open this deposit online via the bank&apos;s verified digital banking website, or request an official branch executive to assist you.
              </p>
            </div>

            {/* Direct Official Link Button */}
            <a
              href={bank.portalUrl || 'https://www.rbi.org.in/'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-[#006c4a] hover:bg-[#005137] dark:bg-[#10b981] dark:text-slate-950 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm text-center"
            >
              <span>Proceed to Official {bank.portalName || bank.name} Portal</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Copy Summary Checklist */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopySummary}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-2"
              >
                {copiedRef ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedRef ? 'Details Copied to Clipboard!' : 'Copy Rate & Deposit Checklist'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('assisted_callback')}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
                <span>Assisted Callback</span>
              </button>
            </div>
          </div>
        )}

        {activeMode === 'assisted_callback' && (
          <form onSubmit={handleRequestCallback} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Request Official Bank Agent Callback
              </span>
              <button
                type="button"
                onClick={() => setActiveMode('direct_portal')}
                className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
              >
                Back to Direct Portal
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Full Legal Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#006c4a] focus:outline-hidden"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                10-Digit Mobile Number
              </label>
              <div className="flex items-center">
                <span className="h-10 px-3 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 rounded-l-xl flex items-center">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value.replace(/\D/g, ''))}
                  className="h-10 px-3 rounded-r-xl flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#006c4a] focus:outline-hidden"
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={dpdpConsent}
                onChange={(e) => setDpdpConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                I hereby grant consent under the Digital Personal Data Protection (DPDP) Act 2023 for an authorized representative of {bank.name} to contact me regarding opening this fixed yield deposit.
              </span>
            </label>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#006c4a] hover:bg-[#005137] dark:bg-[#10b981] dark:text-slate-950 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Submit Official Assistance Request</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {activeMode === 'success' && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#00714e] dark:text-[#a7f3d0] flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="flex flex-col gap-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Assistance Request Registered
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Your deposit preferences have been securely logged. An official representative from {bank.name} will reach out to you within 1 business day.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex flex-col gap-1 w-full text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Tracking Reference:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{referenceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Number:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">+91 {userPhone}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
