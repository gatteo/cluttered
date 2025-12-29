import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Sparkles, Trash2, Calendar, Zap } from 'lucide-react'
import { formatBytes, formatRelativeTime } from '../utils/format'
import { AnimatedNumber } from './AnimatedNumber'

interface Statistics {
  totalBytesFreed: number
  totalProjectsCleaned: number
  largestCleanup: number
  cleanupCount: number
  lastCleanupDate?: Date
}

interface HeroStatsProps {
  totalRecoverable: number
  projectCount: number
}

export function HeroStats({ totalRecoverable, projectCount }: HeroStatsProps) {
  const [stats, setStats] = useState<Statistics | null>(null)

  useEffect(() => {
    window.electronAPI.getStatistics().then(setStats)
  }, [])

  const hasResults = totalRecoverable > 0
  const hasHistory = stats && stats.totalBytesFreed > 0

  return (
    <div className="text-center py-4">
      {hasResults ? (
        // Scan results view
        <>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
            <div className="text-7xl font-bold mb-2">
              <AnimatedNumber
                value={totalRecoverable}
                formatter={formatBytes}
                className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
              />
            </div>
            <p className="text-text-secondary text-lg">
              recoverable across <span className="text-white font-medium">{projectCount}</span> projects
            </p>
          </motion.div>

          {/* Scan complete indicator */}
          <motion.div
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-accent-green/10 text-accent-green rounded-full text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
            Scan complete
          </motion.div>

          {/* Lifetime stats row */}
          {hasHistory && (
            <motion.div
              className="mt-6 flex items-center justify-center gap-4 text-sm text-text-muted flex-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-1.5">
                <Trash2 size={14} className="text-accent-green" />
                <span>
                  <span className="text-white font-medium">{formatBytes(stats.totalBytesFreed)}</span> freed
                </span>
              </div>
              <div className="w-1 h-1 bg-text-muted/50 rounded-full" />
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" />
                <span>
                  <span className="text-white font-medium">{stats.cleanupCount}</span> cleanups
                </span>
              </div>
              <div className="w-1 h-1 bg-text-muted/50 rounded-full" />
              <div className="flex items-center gap-1.5">
                <span>
                  <span className="text-white font-medium">{stats.totalProjectsCleaned}</span> projects
                </span>
              </div>
              {stats.largestCleanup > 0 && (
                <>
                  <div className="w-1 h-1 bg-text-muted/50 rounded-full" />
                  <div className="flex items-center gap-1.5">
                    <span>
                      <span className="text-white font-medium">{formatBytes(stats.largestCleanup)}</span> largest
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </>
      ) : (
        // Empty state - no scan results yet
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {hasHistory ? (
            // User has cleaned before
            <>
              <div className="mb-4">
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-green/20 mb-4"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles size={32} className="text-accent-purple" />
                </motion.div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome back!</h2>
              <p className="text-text-secondary mb-6">
                You've freed <span className="text-accent-green font-semibold">{formatBytes(stats.totalBytesFreed)}</span> so far.
                <br />
                Ready to find more space to reclaim?
              </p>

              {/* Stats cards */}
              <div className="flex items-center justify-center gap-4 mb-2">
                <div className="px-4 py-3 bg-surface-elevated rounded-xl">
                  <div className="text-xl font-bold text-white">{stats.cleanupCount}</div>
                  <div className="text-xs text-text-muted">Cleanups</div>
                </div>
                <div className="px-4 py-3 bg-surface-elevated rounded-xl">
                  <div className="text-xl font-bold text-white">{stats.totalProjectsCleaned}</div>
                  <div className="text-xs text-text-muted">Projects cleaned</div>
                </div>
                {stats.lastCleanupDate && (
                  <div className="px-4 py-3 bg-surface-elevated rounded-xl">
                    <div className="text-xl font-bold text-white flex items-center gap-1">
                      <Calendar size={16} className="text-text-muted" />
                      {formatRelativeTime(new Date(stats.lastCleanupDate))}
                    </div>
                    <div className="text-xs text-text-muted">Last cleanup</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            // First time user
            <>
              <div className="mb-4">
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-green/20 mb-4"
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles size={32} className="text-accent-purple" />
                </motion.div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Reclaim your disk space</h2>
              <p className="text-text-secondary mb-4">
                Scan your Mac to find <span className="text-white">node_modules</span>, build caches,
                <br />
                and other dev artifacts eating up your storage.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
                <span className="px-2 py-1 bg-surface-elevated rounded-md">node_modules</span>
                <span className="px-2 py-1 bg-surface-elevated rounded-md">target/</span>
                <span className="px-2 py-1 bg-surface-elevated rounded-md">DerivedData</span>
                <span className="px-2 py-1 bg-surface-elevated rounded-md">.venv</span>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  )
}
