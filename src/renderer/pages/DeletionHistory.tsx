import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { formatBytes, formatRelativeTime } from '../utils/format'
import { useUIStore } from '../store/uiStore'

interface DeletionLogEntry {
  id: string
  timestamp: Date
  projectPath: string
  projectName: string
  ecosystem: string
  artifacts: string[]
  totalSize: number
  trashedPath?: string
}

export function DeletionHistory() {
  const [entries, setEntries] = useState<DeletionLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const goBack = useUIStore((s) => s.goBack)

  useEffect(() => {
    window.electronAPI.getDeletionLog().then((data) => {
      setEntries(
        data.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }))
      )
      setIsLoading(false)
    })
  }, [])

  const handleRestore = async (entryId: string) => {
    const success = await window.electronAPI.restoreFromLog(entryId)
    if (success) {
      setEntries((prev) => prev.filter((e) => e.id !== entryId))
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="h-8 app-drag-region" />

      <div className="px-8 py-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="btn-subtle text-sm">
            <ArrowLeft size={16} />
            Back
          </button>

          <h1 className="text-2xl font-bold text-white">Deletion History</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6">
        <p className="text-text-muted mb-6">Items are kept in Trash for 30 days and can be restored.</p>

        {isLoading ? (
          <div className="text-center py-8 text-text-muted">Loading...</div>
        ) : entries.length === 0 ? (
          <p className="text-text-muted text-center py-8">No recent deletions</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                className="glass-card p-4 flex items-center justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{entry.projectName}</h3>
                  <p className="text-text-muted text-sm truncate">{entry.projectPath}</p>
                  <p className="text-text-muted text-sm">
                    {formatRelativeTime(entry.timestamp)} • {formatBytes(entry.totalSize)}
                  </p>
                </div>

                <button className="btn-secondary px-3 py-1 rounded-lg text-sm ml-4 flex items-center gap-1.5" onClick={() => handleRestore(entry.id)}>
                  <RotateCcw size={14} />
                  Restore
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
