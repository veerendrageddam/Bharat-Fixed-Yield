import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, CheckCircle2, User } from 'lucide-react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('investor@bharatyield.in');
  const [isSubmitted, setIsSubmitted] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 id="signin-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Investor Portal Access
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sync portfolios, track maturity dates & Form 15H
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="flex flex-col items-center text-center gap-3 py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            <h4 className="font-bold text-base text-slate-900 dark:text-white">Magic Login Link Sent!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Check {email} for instantaneous biometric/OTP verification into your Bharat Fixed Yield portfolio.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
            >
              Close
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsSubmitted(true);
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Registered Email / Mobile</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006c4a]"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#006c4a] dark:text-[#10b981] shrink-0" />
              <span>Secured with 256-bit bank-grade encryption & RBI account aggregator.</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#006c4a] hover:bg-[#005137] dark:bg-[#10b981] dark:text-slate-950 text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
            >
              Sign In to Portfolio
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
