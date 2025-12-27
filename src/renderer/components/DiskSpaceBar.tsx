import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { formatBytes } from '../utils/format';

interface DiskSpace {
  total: number;
  used: number;
  free: number;
}

export function DiskSpaceBar() {
  const [diskSpace, setDiskSpace] = useState<DiskSpace | null>(null);

  useEffect(() => {
    window.electronAPI.getDiskSpace().then(setDiskSpace);
  }, []);

  if (!diskSpace) return <DiskSpaceBarSkeleton />;

  const usedPercent = (diskSpace.used / diskSpace.total) * 100;

  // Color based on usage
  const getBarColor = (percent: number) => {
    if (percent > 90) return 'from-red-500 to-red-600';
    if (percent > 75) return 'from-amber-500 to-orange-500';
    return 'from-green-500 to-emerald-500';
  };

  return (
    <div>
      {/* Progress bar container */}
      <div className="h-3 bg-surface-interactive rounded-full overflow-hidden relative">
        {/* Used space */}
        <motion.div
          className={`h-full bg-gradient-to-r ${getBarColor(usedPercent)} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${usedPercent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {/* Glow effect */}
        <motion.div
          className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ left: '-20%' }}
          animate={{ left: '120%' }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
      </div>

      {/* Stats below bar */}
      <div className="flex justify-between mt-3 text-sm">
        <span className="text-text-muted">
          {formatBytes(diskSpace.used)} used
        </span>
        <span className="text-text-muted">
          {formatBytes(diskSpace.free)} free
        </span>
      </div>
    </div>
  );
}

function DiskSpaceBarSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-surface-interactive rounded-full" />
    </div>
  );
}
