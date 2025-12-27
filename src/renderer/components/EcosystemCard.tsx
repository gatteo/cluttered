import { motion } from 'framer-motion';
import { EcosystemSummary } from '../types';
import { formatBytes } from '../utils/format';
import { useUIStore } from '../store/uiStore';
import { useProjectStore } from '../store/projectStore';
import { useScanStore } from '../store/scanStore';
import { ecosystemConfigs } from '../config/ecosystems';

interface EcosystemCardProps {
  ecosystem: EcosystemSummary;
}

export function EcosystemCard({ ecosystem }: EcosystemCardProps) {
  const goToEcosystem = useUIStore((s) => s.goToEcosystem);
  const selectedIds = useProjectStore((s) => s.selectedIds);
  const projects = useScanStore((s) => s.result?.projects ?? []);
  const config = ecosystemConfigs[ecosystem.ecosystem];

  // Count selected projects in this ecosystem
  const selectedInEcosystem = projects.filter(
    (p) => p.ecosystem === ecosystem.ecosystem && selectedIds.has(p.id)
  ).length;

  const handleClick = () => {
    goToEcosystem(ecosystem.ecosystem);
  };

  return (
    <motion.button
      className="glass-card p-5 w-full text-left group relative overflow-hidden"
      onClick={handleClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `radial-gradient(circle at right, ${config.color}20 0%, transparent 70%)`,
        }}
      />

      {/* Icon - absolute top right, overflowing */}
      <div className="absolute -top-4 -right-10 opacity-20 group-hover:opacity-30 transition-opacity">
        {config.iconImage ? (
          <img src={config.iconImage} alt="" className="w-32 h-32 object-contain" />
        ) : (
          <span className="text-8xl">{config.icon}</span>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="font-semibold text-white mb-1">{config.name}</h3>

        <div className="text-2xl font-bold text-white mb-1">{formatBytes(ecosystem.totalSize)}</div>

        <p className="text-text-muted text-sm">
          {selectedInEcosystem > 0 ? (
            <>
              <span className="text-accent-purple">{selectedInEcosystem} selected</span>
              <span className="text-text-muted"> / {ecosystem.projectCount}</span>
            </>
          ) : (
            <>
              {ecosystem.projectCount} {ecosystem.projectCount === 1 ? 'project' : 'projects'}
            </>
          )}
        </p>

        {/* Progress indicator */}
        <div className="mt-3 h-1 bg-surface-interactive rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: config.color }}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.button>
  );
}
