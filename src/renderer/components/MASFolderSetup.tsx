import { useState, useEffect } from 'react'
import { FolderOpen, Plus, Trash2, AlertCircle } from 'lucide-react'

interface MASFolderSetupProps {
  onComplete: () => void
}

export function MASFolderSetup({ onComplete }: MASFolderSetupProps) {
  const [folders, setFolders] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAccessiblePaths()
  }, [])

  const loadAccessiblePaths = async () => {
    try {
      const paths = await window.electronAPI.sandbox.getAccessiblePaths()
      setFolders(paths)
    } catch (error) {
      console.error('Failed to load accessible paths:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFolder = async () => {
    try {
      const path = await window.electronAPI.selectFolder()
      if (path) {
        // Add to settings
        const settings = await window.electronAPI.getSettings()
        const newPaths = [...new Set([...settings.scanning.scanPaths.filter((p) => p !== '~/'), path])]
        await window.electronAPI.setSettings({
          ...settings,
          scanning: { ...settings.scanning, scanPaths: newPaths },
        })
        // Reload paths
        await loadAccessiblePaths()
      }
    } catch (error) {
      console.error('Failed to add folder:', error)
    }
  }

  const handleRemoveFolder = async (path: string) => {
    try {
      await window.electronAPI.sandbox.removeAccessiblePath(path)
      // Also remove from settings
      const settings = await window.electronAPI.getSettings()
      const newPaths = settings.scanning.scanPaths.filter((p) => p !== path)
      await window.electronAPI.setSettings({
        ...settings,
        scanning: { ...settings.scanning, scanPaths: newPaths },
      })
      await loadAccessiblePaths()
    } catch (error) {
      console.error('Failed to remove folder:', error)
    }
  }

  const handleContinue = async () => {
    if (folders.length > 0) {
      // Ensure settings have the folders
      const settings = await window.electronAPI.getSettings()
      const newPaths = [...new Set([...folders])]
      await window.electronAPI.setSettings({
        ...settings,
        scanning: { ...settings.scanning, scanPaths: newPaths },
      })
      onComplete()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-accent-pink/20 flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="w-8 h-8 text-accent-purple" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Select Folders to Scan</h2>
        <p className="text-text-secondary">
          Choose which folders contain your development projects. Cluttered will scan these folders for cleanable build artifacts.
        </p>
      </div>

      <div className="glass-card p-4 mb-6">
        <div className="flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-accent-amber flex-shrink-0 mt-0.5" />
          <p className="text-text-secondary">
            For security, Mac App Store apps can only access folders you explicitly select. Common locations include{' '}
            <span className="text-text-primary font-medium">~/Developer</span>,{' '}
            <span className="text-text-primary font-medium">~/Projects</span>, or{' '}
            <span className="text-text-primary font-medium">~/Code</span>.
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {folders.map((folder) => (
          <div key={folder} className="glass-card p-3 flex items-center justify-between group">
            <div className="flex items-center gap-3 min-w-0">
              <FolderOpen className="w-5 h-5 text-accent-purple flex-shrink-0" />
              <span className="truncate text-sm">{folder}</span>
            </div>
            <button
              onClick={() => handleRemoveFolder(folder)}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-surface-hover rounded-lg transition-all"
              title="Remove folder"
            >
              <Trash2 className="w-4 h-4 text-text-muted hover:text-accent-red" />
            </button>
          </div>
        ))}

        <button
          onClick={handleAddFolder}
          className="w-full glass-card p-3 flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Folder
        </button>
      </div>

      <button
        onClick={handleContinue}
        disabled={folders.length === 0}
        className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {folders.length === 0 ? 'Select at least one folder' : 'Continue to Scan'}
      </button>
    </div>
  )
}
