import { motion } from 'framer-motion';
import { EcosystemSummary } from '../types';
import { EcosystemCard } from './EcosystemCard';

interface EcosystemGridProps {
  ecosystems: EcosystemSummary[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function EcosystemGrid({ ecosystems }: EcosystemGridProps) {
  if (ecosystems.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p>No projects found. Click Scan to get started.</p>
      </div>
    );
  }

  // Sort by size
  const sorted = [...ecosystems].sort((a, b) => b.totalSize - a.totalSize);

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {sorted.map((ecosystem) => (
        <motion.div key={ecosystem.ecosystem} variants={itemVariants}>
          <EcosystemCard ecosystem={ecosystem} />
        </motion.div>
      ))}
    </motion.div>
  );
}
