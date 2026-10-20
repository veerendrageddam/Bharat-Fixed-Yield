import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { INITIAL_BANKS } from './data/bankData';
import { BankData, UserPersona } from './types/bank';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { YieldCommandCenter } from './components/YieldCommandCenter';
import { TenureInspectionScreen } from './components/TenureInspectionScreen';
import { TaxGuideScreen } from './components/TaxGuideScreen';
import { DicgcSafetyScreen } from './components/DicgcSafetyScreen';
import { CompareDrawer } from './components/CompareDrawer';
import { BookingModal } from './components/BookingModal';
import { SignInModal } from './components/SignInModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('command-center');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [selectedBankForInspection, setSelectedBankForInspection] = useState<BankData>(INITIAL_BANKS[0]);
  const [bookingBank, setBookingBank] = useState<BankData | null>(null);
  const [signInOpen, setSignInOpen] = useState<boolean>(false);
  const [comparedBankIds, setComparedBankIds] = useState<string[]>([]);

  // Default Persona as shown in the user's provided screens
  const [persona, setPersona] = useState<UserPersona>({
    depositType: 'FD',
    principal: 500000,
    monthlyInstallment: 10000,
    tenureMonths: 36,
    compounding: 'quarterly',
    age: 62,
    gender: 'male',
    state: 'Maharashtra',
    residency: 'resident',
    panLinked: true,
    form15HSubmitted: false,
  });

  // Dark mode handler
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Compare toggle
  const handleToggleCompare = (bank: BankData) => {
    setComparedBankIds((prev) => {
      if (prev.includes(bank.id)) {
        return prev.filter((id) => id !== bank.id);
      }
      if (prev.length >= 4) {
        alert('You can compare up to 4 banks simultaneously.');
        return prev;
      }
      return [...prev, bank.id];
    });
  };

  const handleRemoveCompare = (bankId: string) => {
    setComparedBankIds((prev) => prev.filter((id) => id !== bankId));
  };

  const handleClearCompare = () => {
    setComparedBankIds([]);
  };

  // Inspect bank handler
  const handleInspectBank = (bank: BankData) => {
    setSelectedBankForInspection(bank);
    setActiveTab('inspection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Invest / open booking modal
  const handleInvest = (bank: BankData) => {
    setBookingBank(bank);
  };

  const comparedBanksList = INITIAL_BANKS.filter((b) => comparedBankIds.includes(b.id));

  const isCommandCenterTab =
    activeTab === 'command-center' || activeTab === 'comparisons' || activeTab === 'calculator';

  return (
    <div className="min-h-screen bg-[#f7f9fb] dark:bg-[#0e1217] text-[#191c1e] dark:text-[#f0f3f6] flex flex-col transition-colors selection:bg-emerald-200 dark:selection:bg-emerald-900">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        onOpenSignIn={() => setSignInOpen(true)}
      />

      {/* Main Content Viewport with smooth transitions */}
      <main className="flex-1 w-full pt-20">
        <AnimatePresence mode="wait">
          {isCommandCenterTab && (
            <motion.div
              key="command-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <YieldCommandCenter
                persona={persona}
                setPersona={setPersona}
                banks={INITIAL_BANKS}
                onInspectBank={handleInspectBank}
                onInvest={handleInvest}
                comparedBankIds={comparedBankIds}
                onToggleCompare={handleToggleCompare}
                onNavigateTab={(tab: string) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </motion.div>
          )}

          {activeTab === 'inspection' && (
            <motion.div
              key="inspection"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <TenureInspectionScreen
                bank={selectedBankForInspection}
                persona={persona}
                onBack={() => {
                  setActiveTab('command-center');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onInvest={handleInvest}
              />
            </motion.div>
          )}

          {activeTab === 'tax-guide' && (
            <motion.div
              key="tax-guide"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <TaxGuideScreen />
            </motion.div>
          )}

          {activeTab === 'dicgc-index' && (
            <motion.div
              key="dicgc-index"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <DicgcSafetyScreen
                banks={INITIAL_BANKS}
                persona={persona}
                onSelectBankForInspection={handleInspectBank}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bank Compare Drawer */}
      <CompareDrawer
        comparedBanks={comparedBanksList}
        onRemoveBank={handleRemoveCompare}
        onClearAll={handleClearCompare}
        persona={persona}
        onInvest={handleInvest}
      />

      {/* Digital FD / RD Booking Modal (DPDP Compliant) */}
      <BookingModal
        bank={bookingBank}
        persona={persona}
        onClose={() => setBookingBank(null)}
      />

      {/* Sign In & Account Modal */}
      <SignInModal
        isOpen={signInOpen}
        onClose={() => setSignInOpen(false)}
      />

      {/* Footer */}
      <Footer
        onNavClick={(tab) => {
          setActiveTab(tab === 'comparisons' || tab === 'calculator' ? 'command-center' : tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
