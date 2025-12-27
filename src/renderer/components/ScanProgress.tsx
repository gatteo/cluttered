import { motion } from 'framer-motion';
import { formatBytes } from '../utils/format';

interface ScanProgressType {
  phase: 'discovering' | 'analyzing' | 'complete';
  currentPath?: string;
  projectsFound: number;
  totalSize: number;
}

interface ScanProgressProps {
  progress: ScanProgressType | null;
  onCancel: () => void;
}

function Spinner() {
  return (
    <div className="w-12 h-12 mx-auto mb-4">
      <svg className="animate-spin" viewBox="0 0 50 50">
        <circle
          className="opacity-20"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="4"
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="80, 200"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function ScanProgress({ progress, onCancel }: ScanProgressProps) {
  const phase = progress?.phase ?? 'discovering';
  const projectsFound = progress?.projectsFound ?? 0;
  const totalSize = progress?.totalSize ?? 0;

  return (
    <div className="py-8">
      <div className="text-center mb-6">
        <Spinner />

        <h2 className="text-2xl font-bold text-white mb-2">
          {phase === 'discovering' && 'Discovering Projects...'}
          {phase === 'analyzing' && 'Analyzing Projects...'}
          {phase === 'complete' && 'Scan Complete'}
        </h2>

        <p className="text-text-secondary">
          {projectsFound} projects found • {formatBytes(totalSize)} recoverable
        </p>
      </div>

      {/* Current path */}
      {progress?.currentPath && (
        <div className="text-center text-text-muted text-sm mb-6 truncate px-8">
          {progress.currentPath}
        </div>
      )}

      {/* Progress bar */}
      <div className="h-2 bg-surface-interactive rounded-full overflow-hidden mx-auto max-w-md">
        <motion.div
          className="h-full bg-gradient-to-r from-accent-purple to-accent-pink"
          initial={{ width: '5%' }}
          animate={{
            width: phase === 'discovering' ? '40%' : phase === 'analyzing' ? '80%' : '100%',
          }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Cancel button */}
      <div className="text-center mt-6">
        <button
          onClick={onCancel}
          className="text-text-muted hover:text-white text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
