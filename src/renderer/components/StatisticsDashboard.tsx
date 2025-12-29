import { useEffect, useState, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Trash2, FolderOpen, Trophy, RefreshCw } from 'lucide-react'
import { formatBytes, formatRelativeTime } from '../utils/format'

interface Statistics {
  totalBytesFreed: number
  totalProjectsCleaned: number
  largestCleanup: number
  cleanupCount: number
  lastCleanupDate?: Date
}

interface StatCardProps {
  label: string
  value: string
  icon: ReactNode
  color: string
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <motion.div className="bg-surface-elevated rounded-xl p-4" whileHover={{ scale: 1.02 }}>
      <div className="mb-2 text-text-muted">{icon}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-text-muted text-sm">{label}</div>
    </motion.div>
  )
}

function StatsSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="h-6 w-40 bg-surface-interactive rounded mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface-elevated rounded-xl p-4">
            <div className="h-8 w-8 bg-surface-interactive rounded mb-2" />
            <div className="h-8 w-20 bg-surface-interactive rounded mb-2" />
            <div className="h-4 w-24 bg-surface-interactive rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function StatisticsDashboard() {
  const [stats, setStats] = useState<Statistics | null>(null)

  useEffect(() => {
    window.electronAPI.getStatistics().then(setStats)
  }, [])

  if (!stats) return <StatsSkeleton />

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">All-Time Statistics</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Freed" value={formatBytes(stats.totalBytesFreed)} icon={<Trash2 size={24} />} color="text-accent-green" />
        <StatCard label="Projects Cleaned" value={String(stats.totalProjectsCleaned)} icon={<FolderOpen size={24} />} color="text-accent-purple" />
        <StatCard label="Largest Cleanup" value={formatBytes(stats.largestCleanup)} icon={<Trophy size={24} />} color="text-amber-400" />
        <StatCard label="Cleanup Sessions" value={String(stats.cleanupCount)} icon={<RefreshCw size={24} />} color="text-blue-400" />
      </div>

      {stats.lastCleanupDate && <p className="text-text-muted text-sm mt-4">Last cleanup: {formatRelativeTime(new Date(stats.lastCleanupDate))}</p>}
    </div>
  )
}
