import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Sparkles, Camera, Music, Film, Smartphone, Zap } from 'lucide-react'
import { useCleanStore } from '../store/cleanStore'
import { formatBytes } from '../utils/format'
import { AnimatedNumber } from './AnimatedNumber'
import { ConfettiEffect } from './ConfettiEffect'

function getFunComparison(bytes: number): { text: string; icon: typeof Camera } {
  const gb = bytes / (1024 * 1024 * 1024)
  const mb = bytes / (1024 * 1024)

  if (gb > 50) return { text: `That's like ${Math.round(gb * 200)} photos!`, icon: Camera }
  if (gb > 10) return { text: `That's equivalent to ${Math.round(gb * 250)} songs!`, icon: Music }
  if (gb > 1) return { text: `That's about ${Math.round(gb * 2)} HD movies!`, icon: Film }
  if (mb > 500) return { text: `That's ${Math.round(mb / 5)} apps worth of space!`, icon: Smartphone }
  return { text: `Every megabyte counts!`, icon: Zap }
}

export function CleaningOverlay() {
  const { isCleaning, isComplete, progress, result, reset } = useCleanStore()

  if (!isCleaning && !isComplete) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-void/90 backdrop-blur-xl z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Confetti on complete */}
        {isComplete && <ConfettiEffect />}

        <motion.div
          className="relative z-10 text-center max-w-md w-full mx-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          {isCleaning && (
            <div className="space-y-8">
              {/* Animated icon */}
              <motion.div
                className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <Trash2 size={48} className="text-white" />
              </motion.div>

              {/* Progress text */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Cleaning...</h2>
                <p className="text-text-secondary truncate">{progress?.currentProject || 'Preparing...'}</p>
              </div>

              {/* Progress bar */}
              <div className="w-full mx-auto">
                <div className="h-2 bg-surface-interactive rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent-purple to-accent-pink"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((progress?.projectsProcessed || 0) / (progress?.totalProjects || 1)) * 100}%`,
                    }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm text-text-muted">
                  <span>
                    {progress?.projectsProcessed || 0} / {progress?.totalProjects || 0}
                  </span>
                  <span>
                    <AnimatedNumber value={progress?.bytesFreed || 0} formatter={formatBytes} />
                  </span>
                </div>
              </div>

              {/* File counter */}
              <motion.div className="text-xl text-accent-green" animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 0.3 }}>
                <AnimatedNumber value={progress?.filesDeleted || 0} /> files removed
              </motion.div>
            </div>
          )}

          {isComplete && result && (
            <motion.div className="space-y-6" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>
              {/* Success icon */}
              <motion.div
                className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-accent-green to-emerald-400 flex items-center justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <Sparkles size={48} className="text-white" />
              </motion.div>

              {/* Main stat */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="text-6xl font-bold bg-gradient-to-r from-accent-green to-emerald-400 bg-clip-text text-transparent">
                  {formatBytes(result.bytesFreed)}
                </div>
                <p className="text-2xl text-white mt-2">Freed!</p>
              </motion.div>

              {/* Fun comparison */}
              <motion.p
                className="text-text-secondary flex items-center justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {(() => {
                  const comparison = getFunComparison(result.bytesFreed)
                  const Icon = comparison.icon
                  return (
                    <>
                      <Icon size={18} />
                      {comparison.text}
                    </>
                  )
                })()}
              </motion.p>

              {/* Stats */}
              <motion.div
                className="flex gap-8 justify-center text-text-muted"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div>
                  <div className="text-2xl text-white">{result.projectsCleaned.length}</div>
                  <div>projects cleaned</div>
                </div>
                <div>
                  <div className="text-2xl text-white">{result.filesDeleted}</div>
                  <div>files removed</div>
                </div>
              </motion.div>

              {/* Close button */}
              <motion.button
                className="btn-primary px-8 py-3 rounded-xl font-medium mt-4"
                onClick={reset}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Done
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
