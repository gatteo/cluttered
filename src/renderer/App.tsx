import { motion, AnimatePresence } from 'framer-motion';
import { Dashboard } from './pages/Dashboard';
import { EcosystemDetail } from './pages/EcosystemDetail';
import { Settings } from './pages/Settings';
import { CleaningOverlay } from './components/CleaningOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useUIStore } from './store/uiStore';
import { BackgroundFlares } from './components/BackgroundFlares';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useFeedback } from './hooks/useFeedback';

function AppContent() {
  const { currentView, selectedEcosystem } = useUIStore();
  useKeyboardShortcuts();
  useFeedback();

  return (
    <div className="min-h-screen bg-void text-white relative overflow-hidden">
      {/* Background effects */}
      <BackgroundFlares />

      {/* Main content */}
      <AnimatePresence mode="wait">
        {currentView === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Dashboard />
          </motion.div>
        )}

        {currentView === 'ecosystem' && selectedEcosystem && (
          <motion.div
            key="ecosystem"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <EcosystemDetail ecosystem={selectedEcosystem} />
          </motion.div>
        )}

        {currentView === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Settings />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cleaning overlay */}
      <CleaningOverlay />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
