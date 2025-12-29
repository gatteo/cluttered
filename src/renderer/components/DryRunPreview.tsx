import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Loader2 } from 'lucide-react'
import { formatBytes } from '../utils/format'
import { useProjectStore } from '../store/projectStore'

interface CleanResult {
  bytesFreed: number
  filesDeleted: number
  projectsCleaned: string[]
}

interface DryRunPreviewProps {
  isOpen: boolean
  onClose: () => void
  onProceed: () => void
}

export function DryRunPreview({ isOpen, onClose, onProceed }: DryRunPreviewProps) {
  const [preview, setPreview] = useState<CleanResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const selectedIds = useProjectStore((s) => s.selectedIds)

  useEffect(() => {
    if (isOpen) {
      const runPreview = async () => {
        setIsLoading(true)
        try {
          const result = await window.electronAPI.cleanProjects({
            projectIds: Array.from(selectedIds),
            dryRun: true,
            moveToTrash: true,
          })
          setPreview(result)
        } catch {
          setPreview(null)
        }
        setIsLoading(false)
      }
      runPreview()
    }
  }, [isOpen, selectedIds])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="glass-card-elevated p-6 max-w-lg w-full mx-4 relative z-10"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Eye size={20} />
              Cleanup Preview
            </h2>

            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 size={40} className="animate-spin mx-auto mb-4 text-accent-purple" />
                <p className="text-text-muted">Calculating...</p>
              </div>
            ) : preview ? (
              <>
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-accent-green">{formatBytes(preview.bytesFreed)}</div>
                  <p className="text-text-secondary mt-1">will be freed</p>
                </div>

                <div className="bg-surface-elevated rounded-lg p-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Projects to clean</span>
                    <span>{preview.projectsCleaned.length}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-text-muted">Files to remove</span>
                    <span>{preview.filesDeleted}</span>
                  </div>
                </div>

                <p className="text-text-muted text-sm mb-4">This is a preview. Files will be moved to Trash when you proceed.</p>

                <div className="flex gap-3 justify-end">
                  <button className="btn-secondary px-4 py-2 rounded-lg" onClick={onClose}>
                    Cancel
                  </button>
                  <button className="btn-primary px-4 py-2 rounded-lg" onClick={onProceed}>
                    Proceed with Cleanup
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-text-muted">Unable to calculate preview</p>
                <button className="btn-secondary px-4 py-2 rounded-lg mt-4" onClick={onClose}>
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
