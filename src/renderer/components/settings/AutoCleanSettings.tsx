import { useState, useEffect } from 'react'
import { useLicenseStore } from '../../store/licenseStore'
import { ProFeatureGate } from '../ProFeatureGate'
import { ProBadge } from '../ProBadge'
import { Trash2, Bell, Play, Loader2, Calendar } from 'lucide-react'

interface AutoCleanSettingsData {
  enabled: boolean
  minInactiveDays: number
  maxBytesPerRun: number
  showNotification: boolean
  lastRunAt: string | null
}

export function AutoCleanSettings() {
  const [settings, setSettings] = useState<AutoCleanSettingsData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const isPro = useLicenseStore((s) => s.isPro)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const s = await window.electronAPI.autoClean.getSettings()
    setSettings(s)
  }

  const saveSettings = async (updates: Partial<AutoCleanSettingsData>) => {
    if (!settings) return

    setIsSaving(true)
    try {
      const newSettings = await window.electronAPI.autoClean.saveSettings(updates)
      setSettings(newSettings)
    } finally {
      setIsSaving(false)
    }
  }

  const runNow = async () => {
    setIsRunning(true)
    try {
      await window.electronAPI.autoClean.runNow()
      await loadSettings()
    } finally {
      setIsRunning(false)
    }
  }

  if (!settings) {
    return <div className="text-text-muted">Loading...</div>
  }

  const content = (
    <div className="space-y-6">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium flex items-center gap-2">
            Auto-Clean Dormant
            <ProBadge size="sm" />
          </h3>
          <p className="text-sm text-text-muted">Automatically clean projects that haven't been touched in a while</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => saveSettings({ enabled: e.target.checked })}
            className="sr-only peer"
            disabled={!isPro || isSaving}
          />
          <div className="w-11 h-6 bg-surface-interactive rounded-full peer peer-checked:bg-accent-purple transition-colors" />
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      {settings.enabled && (
        <>
          {/* Inactivity threshold */}
          <div>
            <label className="text-sm text-text-muted mb-2 block flex items-center gap-2">
              <Calendar size={14} />
              Clean projects inactive for
            </label>
            <select
              value={settings.minInactiveDays}
              onChange={(e) => saveSettings({ minInactiveDays: Number(e.target.value) })}
              disabled={isSaving}
              className="bg-surface-interactive border border-white/10 rounded-lg px-3 py-2 text-sm"
            >
              {[60, 90, 120, 180, 365].map((days) => (
                <option key={days} value={days}>
                  {days} days
                </option>
              ))}
            </select>
          </div>

          {/* Max bytes per run */}
          <div>
            <label className="text-sm text-text-muted mb-2 block flex items-center gap-2">
              <Trash2 size={14} />
              Maximum to clean per run
            </label>
            <select
              value={settings.maxBytesPerRun}
              onChange={(e) => saveSettings({ maxBytesPerRun: Number(e.target.value) })}
              disabled={isSaving}
              className="bg-surface-interactive border border-white/10 rounded-lg px-3 py-2 text-sm"
            >
              {[10, 25, 50, 100].map((gb) => (
                <option key={gb} value={gb * 1024 * 1024 * 1024}>
                  {gb} GB
                </option>
              ))}
            </select>
          </div>

          {/* Notification toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-text-muted" />
              <span className="text-sm">Show notification after cleaning</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showNotification}
                onChange={(e) => saveSettings({ showNotification: e.target.checked })}
                className="sr-only peer"
                disabled={isSaving}
              />
              <div className="w-11 h-6 bg-surface-interactive rounded-full peer peer-checked:bg-accent-purple transition-colors" />
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </label>
          </div>

          {/* Last run info */}
          {settings.lastRunAt && (
            <p className="text-sm text-text-muted">Last run: {new Date(settings.lastRunAt).toLocaleString()}</p>
          )}

          {/* Run now button */}
          <button onClick={runNow} disabled={isRunning} className="btn-secondary px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {isRunning ? 'Running...' : 'Run Now'}
          </button>

          <p className="text-xs text-text-muted">
            Auto-clean runs after each scheduled scan, targeting projects marked as dormant without uncommitted changes.
          </p>
        </>
      )}
    </div>
  )

  return (
    <ProFeatureGate feature="Auto-Clean Dormant" showPreview={false}>
      {content}
    </ProFeatureGate>
  )
}
