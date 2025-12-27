import { motion } from 'framer-motion';
import { Search, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useScanStore } from '../store/scanStore';
import { useCleanStore } from '../store/cleanStore';
import { formatBytes } from '../utils/format';

interface ActionBarProps {
  onScan: () => void;
  isScanning: boolean;
  hasResults: boolean;
}

export function ActionBar({ onScan, isScanning, hasResults }: ActionBarProps) {
  const { selectedIds } = useProjectStore();
  const { isCleaning, startClean } = useCleanStore();
  const scanResult = useScanStore((s) => s.result);

  // Calculate selected size from scan results and selected IDs
  const selectedSize = scanResult?.projects
    .filter((p) => selectedIds.has(p.id))
    .reduce((sum, p) => sum + p.totalSize, 0) ?? 0;

  const hasSelection = selectedIds.size > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-void via-void to-transparent pointer-events-none">
      <div className="flex flex-col items-center gap-3 pointer-events-auto">
        {/* Primary action button */}
        {!hasResults ? (
          // No scan results yet - show Scan as primary
          <motion.button
            className="btn-primary px-8 py-4 rounded-xl font-medium flex items-center gap-2 text-lg"
            onClick={onScan}
            disabled={isScanning}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isScanning ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search size={20} />
                Scan for Cleanable Files
              </>
            )}
          </motion.button>
        ) : (
          // Has results - show Clean as primary
          <>
            <motion.button
              className={`btn-primary px-8 py-4 rounded-xl font-medium flex items-center gap-2 text-lg ${
                !hasSelection ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => hasSelection && startClean()}
              disabled={!hasSelection || isCleaning}
              whileHover={hasSelection ? { scale: 1.02 } : {}}
              whileTap={hasSelection ? { scale: 0.98 } : {}}
            >
              {isCleaning ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Trash2 size={20} />
                  {hasSelection ? (
                    <>
                      Clean Selected
                      <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-sm ml-1">
                        {formatBytes(selectedSize)}
                      </span>
                    </>
                  ) : (
                    'Select Projects to Clean'
                  )}
                </>
              )}
            </motion.button>

            {/* Secondary scan again option */}
            <motion.button
              className="text-text-muted hover:text-white text-sm flex items-center gap-1.5 transition-colors"
              onClick={onScan}
              disabled={isScanning}
              whileHover={{ scale: 1.02 }}
            >
              <RefreshCw size={14} />
              Scan again
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}
