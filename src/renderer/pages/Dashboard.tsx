import { Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScan } from '../hooks/useScan';
import { useScanStore } from '../store/scanStore';
import { useUIStore } from '../store/uiStore';
import { DiskSpaceBar } from '../components/DiskSpaceBar';
import { HeroStats } from '../components/HeroStats';
import { EcosystemGrid } from '../components/EcosystemGrid';
import { ActionBar } from '../components/ActionBar';
import { ScanProgress } from '../components/ScanProgress';
import { StatusBar } from '../components/StatusBar';

export function Dashboard() {
  const { isScanning, progress, startScan, cancelScan } = useScan();
  const result = useScanStore((s) => s.result);
  const setView = useUIStore((s) => s.setView);

  return (
    <div className="h-screen flex flex-col">
      {/* Title bar drag region with settings */}
      <div className="h-12 app-drag-region flex items-center justify-end px-4">
        <motion.button
          className="btn-ghost p-2 rounded-lg app-no-drag"
          onClick={() => setView('settings')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Settings"
        >
          <Settings size={18} className="text-text-muted hover:text-white" />
        </motion.button>
      </div>

      {/* Main content - centered with max width */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-[950px] mx-auto">
          {/* Hero section */}
          <div className="glass-card p-8 mb-8">
            {isScanning ? (
              <ScanProgress progress={progress} onCancel={cancelScan} />
            ) : (
              <>
                <HeroStats
                  totalRecoverable={result?.totalSize ?? 0}
                  projectCount={result?.totalProjects ?? 0}
                />
                <DiskSpaceBar />
              </>
            )}
          </div>

          {/* Ecosystem cards */}
          <EcosystemGrid ecosystems={result?.ecosystemSummary ?? []} />
        </div>

        {/* Action bar */}
        <ActionBar onScan={startScan} isScanning={isScanning} hasResults={!!result} />
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}
