import { motion } from 'framer-motion';
import { formatBytes } from '../utils/format';
import { AnimatedNumber } from './AnimatedNumber';

interface HeroStatsProps {
  totalRecoverable: number;
  projectCount: number;
}

export function HeroStats({ totalRecoverable, projectCount }: HeroStatsProps) {
  return (
    <div className="text-center py-6">
      {/* Main stat */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="text-6xl font-bold mb-2">
          <AnimatedNumber
            value={totalRecoverable}
            formatter={formatBytes}
            className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
          />
        </div>
        <p className="text-text-secondary text-lg">
          recoverable across <span className="text-white font-medium">{projectCount}</span>{' '}
          projects
        </p>
      </motion.div>

      {/* Scan complete indicator */}
      {totalRecoverable > 0 && (
        <motion.div
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-accent-green/10 text-accent-green rounded-full text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
          Scan complete
        </motion.div>
      )}
    </div>
  );
}
