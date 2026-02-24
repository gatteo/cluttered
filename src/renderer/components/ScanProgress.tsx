import { motion, AnimatePresence } from 'framer-motion'
import { formatBytes } from '../utils/format'
import { AnimatedNumber } from './AnimatedNumber'
import { ecosystemConfigs } from '../config/ecosystems'
import { EcosystemId } from '../types'

interface ScanProgressType {
  phase: 'discovering' | 'analyzing' | 'complete'
  currentPath?: string
  projectsFound: number
  totalSize: number
  ecosystemCounts?: Record<string, number>
}

interface ScanProgressProps {
  progress: ScanProgressType | null
  onCancel: () => void
}

// --- Radar / Sonar centerpiece ---
function RadarSweep() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-6">
      {/* Concentric rings */}
      {[0.38, 0.62, 0.88].map((scale, i) => (
        <div key={i} className="absolute inset-0 rounded-full border border-accent-purple/[0.08]" style={{ transform: `scale(${scale})` }} />
      ))}

      {/* Rotating sweep arm (conic gradient) */}
      <motion.div
        className="absolute inset-1 rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(168,85,247,0.3) 345deg, transparent 360deg)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
      />

      {/* Expanding sonar pulses */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-3 rounded-full border border-accent-purple/20"
          initial={{ scale: 0.2, opacity: 0.7 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: 'easeOut' }}
        />
      ))}

      {/* Glowing center dot */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-accent-purple"
        animate={{
          boxShadow: ['0 0 8px 3px rgba(168,85,247,0.5)', '0 0 16px 6px rgba(168,85,247,0.2)', '0 0 8px 3px rgba(168,85,247,0.5)'],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  )
}

// Truncate a path with ellipsis in the middle: ~/projects/very-long…/app/src
function truncatePath(path: string, maxLen = 48): string {
  // Strip home dir prefix for brevity
  const home = '/Users/'
  const homeIdx = path.indexOf(home)
  const display = homeIdx === 0 ? '~/' + path.slice(home.length + path.slice(home.length).indexOf('/') + 1) : path

  if (display.length <= maxLen) return display

  const keep = maxLen - 1 // 1 char for ellipsis
  const front = Math.ceil(keep * 0.55)
  const back = keep - front
  return display.slice(0, front) + '\u2026' + display.slice(-back)
}

// --- Animated current path ---
function AnimatedPath({ path }: { path?: string }) {
  return (
    <div className="h-5 overflow-hidden text-center mb-5">
      <AnimatePresence mode="wait">
        {path && (
          <motion.div
            key={path}
            className="text-text-muted text-xs px-12 font-mono"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 0.5 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {truncatePath(path)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- Ecosystem discovery pills ---
function EcosystemPills({ ecosystemCounts }: { ecosystemCounts?: Record<string, number> }) {
  if (!ecosystemCounts) return null
  const entries = Object.entries(ecosystemCounts)
  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap justify-center gap-1.5 mb-5">
      <AnimatePresence>
        {entries.map(([eco, count]) => {
          const config = ecosystemConfigs[eco as EcosystemId]
          if (!config) return null
          return (
            <motion.div
              key={eco}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-interactive/80 border border-white/[0.04]"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
              <span className="text-[11px] text-text-secondary font-medium">{config.name}</span>
              <span className="text-[11px] text-text-muted">{count}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export function ScanProgress({ progress, onCancel }: ScanProgressProps) {
  const phase = progress?.phase ?? 'discovering'
  const projectsFound = progress?.projectsFound ?? 0
  const totalSize = progress?.totalSize ?? 0

  const progressWidth = phase === 'discovering' ? '40%' : phase === 'analyzing' ? '80%' : '100%'

  return (
    <div className="py-6">
      {/* Radar animation */}
      <RadarSweep />

      {/* Phase heading */}
      <AnimatePresence mode="wait">
        <motion.h2
          key={phase}
          className="text-xl font-semibold text-white text-center mb-1"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {phase === 'discovering' && 'Discovering Projects'}
          {phase === 'analyzing' && 'Analyzing Projects'}
          {phase === 'complete' && 'Scan Complete'}
        </motion.h2>
      </AnimatePresence>

      {/* Currently scanning path */}
      <AnimatedPath path={progress?.currentPath} />

      {/* Live counters */}
      <div className="flex justify-center gap-8 mb-5">
        <div className="text-center">
          <div className="text-2xl font-bold text-white tabular-nums">
            <AnimatedNumber value={projectsFound} />
          </div>
          <div className="text-xs text-text-muted mt-0.5">projects found</div>
        </div>
        <div className="w-px h-10 bg-white/10 self-center" />
        <div className="text-center">
          <div className="text-2xl font-bold text-white tabular-nums">
            <AnimatedNumber value={totalSize} formatter={formatBytes} />
          </div>
          <div className="text-xs text-text-muted mt-0.5">recoverable</div>
        </div>
      </div>

      {/* Ecosystem discovery pills */}
      <EcosystemPills ecosystemCounts={progress?.ecosystemCounts} />

      {/* Shimmer progress bar */}
      <div className="h-1.5 bg-surface-interactive rounded-full overflow-hidden mx-auto max-w-xs">
        <motion.div
          className="h-full rounded-full overflow-hidden"
          initial={{ width: '3%' }}
          animate={{ width: progressWidth }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div
            className="w-full h-full rounded-full animate-shimmer-bar"
            style={{
              background: 'repeating-linear-gradient(90deg, #A855F7 0%, #22222E 25%, #A855F7 50%)',
              backgroundSize: '200% 100%',
            }}
          />
        </motion.div>
      </div>

      {/* Cancel */}
      <div className="flex justify-center mt-5">
        <button onClick={onCancel} className="btn-subtle text-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}
