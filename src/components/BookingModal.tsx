import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  CreditCard,
  Building,
  Smartphone,
  Copy,
  Check
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

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [aadhaar, setAadhaar] = useState('8492 1044 9821');
  const [pan, setPan] = useState('ABCDE1234F');
  const [nomineeName, setNomineeName] = useState('Sunita Sharma');
  const [nomineeRelation, setNomineeRelation] = useState('Spouse');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'netbanking' | 'rtgs'>('netbanking');
  const [copiedRef, setCopiedRef] = useState(false);

  const rate = getEffectiveRate(bank, persona);
  const calc = calculateYield(persona.principal, rate, persona.tenureMonths, persona.age, persona.form15HSubmitted);

  const referenceId = `BFY-${bank.name.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(referenceId);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
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
                {step === 4 ? 'Fixed Deposit Confirmed' : `Open Digital FD with ${bank.name}`}
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                100% Paperless V-KYC • RBI Regulated
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress */}
        {step < 4 && (
          <div className="flex items-center justify-between text-xs font-semibold px-2">
            <span className={step >= 1 ? 'text-[#006c4a] dark:text-[#10b981] font-bold' : 'text-slate-400'}>
              1. Review Terms
            </span>
            <span className="text-slate-300 dark:text-slate-700">→</span>
            <span className={step >= 2 ? 'text-[#006c4a] dark:text-[#10b981] font-bold' : 'text-slate-400'}>
              2. Paperless KYC
            </span>
            <span className="text-slate-300 dark:text-slate-700">→</span>
            <span className={step >= 3 ? 'text-[#006c4a] dark:text-[#10b981] font-bold' : 'text-slate-400'}>
              3. Fund Account
            </span>
          </div>
        )}

        {/* Step 1: Review Terms */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Selected Institution:</span>
                <span className="font-bold text-slate-900 dark:text-white">{bank.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Principal Deposit:</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  ₹{formatINR(persona.principal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tenure Horizon:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {persona.tenureMonths} Months ({persona.tenureMonths / 12} Years)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Locked Applied Rate:</span>
                <span className="font-extrabold text-[#006c4a] dark:text-[#10b981] tabular-nums">
                  {rate.toFixed(2)}% p.a.
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white">Guaranteed Maturity Amount:</span>
                <span className="text-base font-extrabold text-[#006c4a] dark:text-[#10b981] tabular-nums">
                  ₹{formatINR(calc.maturityAmount)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-[#00714e] dark:text-[#a7f3d0]">
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                Rate locked for 48 hours. Deposit covered by ₹5,00,000 DICGC insurance guarantee.
              </span>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-xl bg-[#006c4a] hover:bg-[#005137] dark:bg-[#10b981] dark:text-slate-950 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Continue to KYC Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Paperless KYC */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Aadhaar Number (Linked to Mobile)
              </label>
              <input
                type="text"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
                className="h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-[#006c4a]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Permanent Account Number (PAN)
              </label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                className="h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm uppercase focus:outline-hidden focus:ring-2 focus:ring-[#006c4a]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nominee Name</label>
                <input
                  type="text"
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  className="h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-[#006c4a]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Relationship</label>
                <select
                  value={nomineeRelation}
                  onChange={(e) => setNomineeRelation(e.target.value)}
                  className="h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-[#006c4a]"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl bg-[#006c4a] hover:bg-[#005137] dark:bg-[#10b981] dark:text-slate-950 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Funding</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Funding Mode */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Payment / Transfer Mode
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('netbanking')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                  paymentMethod === 'netbanking'
                    ? 'border-[#006c4a] bg-emerald-50 dark:bg-emerald-950/40 text-[#00714e] dark:text-[#a7f3d0]'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Building className="w-5 h-5" />
                <span>Net Banking</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-[#006c4a] bg-emerald-50 dark:bg-emerald-950/40 text-[#00714e] dark:text-[#a7f3d0]'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span>UPI Fast</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('rtgs')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                  paymentMethod === 'rtgs'
                    ? 'border-[#006c4a] bg-emerald-50 dark:bg-emerald-950/40 text-[#00714e] dark:text-[#a7f3d0]'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>RTGS / NEFT</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex flex-col gap-1 text-xs">
              <span className="font-bold text-slate-900 dark:text-white">Amount Due for Funding:</span>
              <span className="text-xl font-extrabold text-[#006c4a] dark:text-[#10b981] tabular-nums">
                ₹{formatINR(persona.principal)}
              </span>
              <span className="text-slate-500">Funds transferred directly into your escrow bank account.</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-3 rounded-xl bg-[#006c4a] hover:bg-[#005137] dark:bg-[#10b981] dark:text-slate-950 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Authorize & Create FD Certificate</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success & Certificate */}
        {step === 4 && (
          <div className="flex flex-col items-center text-center gap-4 py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#00714e] dark:text-[#a7f3d0] flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="flex flex-col gap-1">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                Fixed Deposit Successfully Booked!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your deposit certificate has been generated and indexed with {bank.name} and DICGC.
              </p>
            </div>

            <div className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex flex-col gap-2 text-xs text-left">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Certificate Reference:</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 font-mono font-bold text-slate-900 dark:text-white hover:text-[#006c4a]"
                >
                  <span>{referenceId}</span>
                  {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Applied Annual Rate:</span>
                <span className="font-bold text-[#006c4a] dark:text-[#10b981]">{rate.toFixed(2)}% p.a.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Principal Protected:</span>
                <span className="font-bold text-slate-900 dark:text-white">₹{formatINR(persona.principal)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-slate-200 dark:border-slate-800">
                <span>Maturity Payout Value:</span>
                <span className="text-sm text-[#006c4a] dark:text-[#10b981]">₹{formatINR(calc.maturityAmount)}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Done & Return to Leaderboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
