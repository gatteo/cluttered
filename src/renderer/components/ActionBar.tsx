import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Loader2, RefreshCw, Info } from 'lucide-react';
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
  const [showInfo, setShowInfo] = useState(false);

  // Get all cleanable projects (non-protected)
  const { cleanableProjects, cleanableSize, protectedCount, protectedSize } = useMemo(() => {
    if (!scanResult?.projects) return { cleanableProjects: [], cleanableSize: 0, protectedCount: 0, protectedSize: 0 };
    const cleanable = scanResult.projects.filter((p) => !p.isProtected && p.totalSize > 0);
    const protectedProjects = scanResult.projects.filter((p) => p.isProtected);
    return {
      cleanableProjects: cleanable,
      cleanableSize: cleanable.reduce((sum, p) => sum + p.totalSize, 0),
      protectedCount: protectedProjects.length,
      protectedSize: protectedProjects.reduce((sum, p) => sum + p.totalSize, 0),
    };
  }, [scanResult?.projects]);

  // Calculate selected size
  const selectedSize = useMemo(() => {
    if (!scanResult?.projects || selectedIds.size === 0) return 0;
    return scanResult.projects
      .filter((p) => selectedIds.has(p.id))
      .reduce((sum, p) => sum + p.totalSize, 0);
  }, [scanResult?.projects, selectedIds]);

  const hasSelection = selectedIds.size > 0;
  const hasCleanable = cleanableProjects.length > 0;
  const hasProtected = protectedCount > 0;

  const handleClean = () => {
    if (hasSelection) {
      // Clean only selected projects
      startClean();
    } else {
      // Clean all cleanable projects
      startClean(cleanableProjects.map((p) => p.id));
    }
  };

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
            <div className="relative flex items-center gap-2">
              <motion.button
                className={`btn-primary px-4 py-2 rounded-xl font-medium flex items-center gap-2 text-lg ${
                  !hasCleanable && !hasSelection ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleClean}
                disabled={(!hasCleanable && !hasSelection) || isCleaning}
                whileHover={(hasCleanable || hasSelection) ? { scale: 1.02 } : {}}
                whileTap={(hasCleanable || hasSelection) ? { scale: 0.98 } : {}}
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
                    ) : hasCleanable ? (
                      <>
                        Clean All
                        <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-sm ml-1">
                          {formatBytes(cleanableSize)}
                        </span>
                      </>
                    ) : (
                      'Nothing to Clean'
                    )}
                  </>
                )}
              </motion.button>

              {/* Info button for protected projects */}
              {hasProtected && !hasSelection && (
                <div className="relative">
                  <button
                    className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    onMouseEnter={() => setShowInfo(true)}
                    onMouseLeave={() => setShowInfo(false)}
                  >
                    <Info size={18} />
                  </button>
                  <AnimatePresence>
                    {showInfo && (
                      <motion.div
                        className="absolute bottom-full right-0 mb-2 px-3 py-2 text-xs text-white tooltip whitespace-nowrap"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                      >
                        {protectedCount} {protectedCount === 1 ? 'project' : 'projects'} with uncommitted changes excluded ({formatBytes(protectedSize)})
                        <div className="absolute top-full right-4 border-4 tooltip-arrow" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Secondary scan again option */}
            <button
              className="btn-subtle text-sm"
              onClick={onScan}
              disabled={isScanning}
            >
              <RefreshCw size={14} />
              Scan again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
