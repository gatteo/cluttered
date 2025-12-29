import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { formatBytes } from '../utils/format'

interface Project {
  id: string
  name: string
  status: 'active' | 'recent' | 'stale' | 'dormant'
  totalSize: number
}

interface ConfirmCleanDialogProps {
  isOpen: boolean
  projects: Project[]
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmCleanDialog({ isOpen, projects, onConfirm, onCancel }: ConfirmCleanDialogProps) {
  const recentProjects = projects.filter((p) => p.status === 'recent')
  const hasRecentProjects = recentProjects.length > 0
  const totalSize = projects.reduce((sum, p) => sum + p.totalSize, 0)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" onClick={onCancel} />

          {/* Dialog */}
          <motion.div
            className="glass-card-elevated p-6 max-w-md w-full mx-4 relative z-10"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              {hasRecentProjects ? <AlertTriangle size={20} className="text-amber-400" /> : <Trash2 size={20} />}
              Confirm Cleanup
            </h2>

            <p className="text-text-secondary mb-4">
              You are about to clean <strong>{projects.length}</strong> project
              {projects.length !== 1 ? 's' : ''}, freeing up <strong className="text-accent-green">{formatBytes(totalSize)}</strong>.
            </p>

            {/* Warning for recent projects */}
            {hasRecentProjects && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
                <p className="text-amber-400 text-sm">
                  <strong>{recentProjects.length}</strong> project
                  {recentProjects.length !== 1 ? 's' : ''} were modified recently:
                </p>
                <ul className="mt-2 text-sm text-amber-300/80">
                  {recentProjects.slice(0, 3).map((p) => (
                    <li key={p.id}>• {p.name}</li>
                  ))}
                  {recentProjects.length > 3 && <li>• ...and {recentProjects.length - 3} more</li>}
                </ul>
              </div>
            )}

            {/* Info about trash */}
            <p className="text-text-muted text-sm mb-6">Files will be moved to Trash and can be restored if needed.</p>

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary px-4 py-2 rounded-lg" onClick={onCancel}>
                Cancel
              </button>
              <button className="btn-primary px-4 py-2 rounded-lg" onClick={onConfirm}>
                Clean {formatBytes(totalSize)}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
