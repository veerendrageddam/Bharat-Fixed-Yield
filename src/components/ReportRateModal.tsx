import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, ShieldCheck, ExternalLink, Flag } from 'lucide-react';
import { BankData } from '../types/bank';
import { INITIAL_BANKS } from '../data/bankData';

export interface CommunityRateReport {
  id: string;
  bankId: string;
  bankName: string;
  tenure: string;
  reportedRate: number;
  evidenceType: 'circular_url' | 'branch_notice' | 'bank_communication';
  sourceReference: string;
  notes?: string;
  submittedAt: string;
  status: 'pending_audit';
}

interface ReportRateModalProps {
  bank: BankData | null;
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'bfy_community_rate_reports';

export function getStoredCommunityReports(): CommunityRateReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCommunityReport(report: CommunityRateReport): void {
  try {
    const existing = getStoredCommunityReports();
    existing.unshift(report);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch {
    // Graceful fallback for restricted storage environments
  }
}

export function ReportRateModal({ bank, isOpen, onClose }: ReportRateModalProps) {
  const [selectedBankId, setSelectedBankId] = useState<string>(bank?.id || INITIAL_BANKS[0].id);
  const [tenure, setTenure] = useState<string>('36');
  const [reportedRate, setReportedRate] = useState<string>('');
  const [evidenceType, setEvidenceType] = useState<'circular_url' | 'branch_notice' | 'bank_communication'>('circular_url');
  const [sourceReference, setSourceReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  useEffect(() => {
    if (bank) {
      setSelectedBankId(bank.id);
    }
  }, [bank]);

  // Keyboard accessibility: Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentBank = INITIAL_BANKS.find((b) => b.id === selectedBankId) || bank || INITIAL_BANKS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const rateNum = parseFloat(reportedRate);
    if (isNaN(rateNum) || rateNum < 3.0 || rateNum > 11.5) {
      setErrorMessage('Reported interest rate must be a valid number between 3.00% and 11.50% p.a.');
      return;
    }

    if (evidenceType === 'circular_url' && sourceReference.trim()) {
      try {
        new URL(sourceReference.trim());
      } catch {
        setErrorMessage('Please provide a valid HTTP/HTTPS circular web link or select Branch Notice.');
        return;
      }
    }

    const reportId = `BFY-REV-${Date.now().toString().slice(-6)}`;
    const report: CommunityRateReport = {
      id: reportId,
      bankId: currentBank.id,
      bankName: currentBank.name,
      tenure,
      reportedRate: rateNum,
      evidenceType,
      sourceReference: sourceReference.trim(),
      notes: notes.trim() || undefined,
      submittedAt: new Date().toISOString(),
      status: 'pending_audit',
    };

    saveCommunityReport(report);
    setSubmittedReportId(reportId);
  };

  const handleResetForm = () => {
    setReportedRate('');
    setSourceReference('');
    setNotes('');
    setErrorMessage(null);
    setSubmittedReportId(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-rate-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close report revision modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedReportId ? (
          /* Success Screen */
          <div className="py-4 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 id="report-rate-title" className="text-xl font-bold text-slate-900 dark:text-white">
              Rate Revision Submitted for Audit
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm mx-auto">
              Thank you for strengthening depositor transparency across Bharat. Your revision is queued for ALCO circular verification.
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Tracking Reference:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{submittedReportId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Institution:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{currentBank.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reported Rate:</span>
                <span className="font-extrabold text-[#006c4a] dark:text-[#10b981]">{reportedRate}% p.a.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                  Pending ALCO Circular Audit
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Submit Another Revision
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#006c4a] hover:bg-[#005137] text-white text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 id="report-rate-title" className="text-lg font-bold text-slate-900 dark:text-white">
                  Report Rate Revision
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Help fellow depositors keep Bharat Fixed Yield verified and accurate
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Institution Selection */}
              <div>
                <label htmlFor="bank-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Banking Institution
                </label>
                <select
                  id="bank-select"
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {INITIAL_BANKS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.category.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tenure Bucket & Reported Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="tenure-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tenure Horizon
                  </label>
                  <select
                    id="tenure-select"
                    value={tenure}
                    onChange={(e) => setTenure(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <option value="12">1 Year (12 Months)</option>
                    <option value="24">2 Years (24 Months)</option>
                    <option value="36">3 Years (36 Months)</option>
                    <option value="60">5 Years (60 Months - 80C)</option>
                    <option value="special">Special Scheme / Odd Days</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="reported-rate" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reported Rate (% p.a.)
                  </label>
                  <input
                    id="reported-rate"
                    type="number"
                    step="0.05"
                    min="3.00"
                    max="11.50"
                    placeholder="e.g. 7.45"
                    value={reportedRate}
                    onChange={(e) => setReportedRate(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Evidence Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Verification Source Type
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'circular_url', label: 'Circular Web Link' },
                    { id: 'branch_notice', label: 'Branch Notice Board' },
                    { id: 'bank_communication', label: 'Official Email / SMS' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEvidenceType(item.id as any)}
                      className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                        evidenceType === item.id
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Link / Details */}
              <div>
                <label htmlFor="source-reference" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {evidenceType === 'circular_url' ? 'Official Circular URL / PDF' : 'Branch / Reference Details'}
                </label>
                <input
                  id="source-reference"
                  type="text"
                  placeholder={
                    evidenceType === 'circular_url'
                      ? 'https://bank.in/rates/interest-rates.html'
                      : 'e.g. Guntur Main Branch notice board w.e.f. 24 Oct 2024'
                  }
                  value={sourceReference}
                  onChange={(e) => setSourceReference(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="report-notes" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="report-notes"
                  rows={2}
                  placeholder="e.g. Senior citizen premium is +0.50%, special 444-day scheme was discontinued."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
              </div>

              {/* DPDP Disclaimer */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 text-[11px] text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero-PII Assurance (DPDP Act 2023)</strong>: We never collect phone numbers, PAN, or account credentials. All community submissions are strictly for interest rate transparency audit.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#006c4a] hover:bg-[#005137] text-white text-xs font-bold transition-all shadow-xs"
                >
                  Submit Revision
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

