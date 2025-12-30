import { useState, useEffect } from 'react'
import { useLicenseStore } from '../../store/licenseStore'
import { ProFeatureGate } from '../ProFeatureGate'
import { ProBadge } from '../ProBadge'
import { Clock, Bell, Play, Loader2 } from 'lucide-react'

type Frequency = 'daily' | 'weekly' | 'monthly'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface ScheduleSettings {
  enabled: boolean
  frequency: Frequency
  timeHour: number
  timeMinute: number
  dayOfWeek: number
  notifyThresholdBytes: number
  lastRunAt: string | null
}

export function ScheduledScansSettings() {
  const [settings, setSettings] = useState<ScheduleSettings | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const isPro = useLicenseStore((s) => s.isPro)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const s = await window.electronAPI.scheduler.getSettings()
    setSettings(s)
  }

  const saveSettings = async (updates: Partial<ScheduleSettings>) => {
    if (!settings) return

    setIsSaving(true)
    try {
      const newSettings = await window.electronAPI.scheduler.saveSettings(updates)
      setSettings(newSettings)
    } finally {
      setIsSaving(false)
    }
  }

  const runNow = async () => {
    setIsRunning(true)
    try {
      await window.electronAPI.scheduler.runNow()
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
            Scheduled Scans
            <ProBadge size="sm" />
          </h3>
          <p className="text-sm text-text-muted">Automatically scan for cleanable files on a schedule</p>
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
          {/* Frequency */}
          <div>
            <label className="text-sm text-text-muted mb-2 block">Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as Frequency[]).map((freq) => (
                <button
                  key={freq}
                  onClick={() => saveSettings({ frequency: freq })}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                    settings.frequency === freq ? 'bg-accent-purple text-white' : 'bg-surface-interactive text-text-secondary hover:text-white'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {/* Day of week (for weekly) */}
          {settings.frequency === 'weekly' && (
            <div>
              <label className="text-sm text-text-muted mb-2 block">Day</label>
              <select
                value={settings.dayOfWeek}
                onChange={(e) => saveSettings({ dayOfWeek: Number(e.target.value) })}
                disabled={isSaving}
                className="bg-surface-interactive border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                {DAYS.map((day, i) => (
                  <option key={day} value={i}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time */}
          <div>
            <label className="text-sm text-text-muted mb-2 block flex items-center gap-2">
              <Clock size={14} />
              Time
            </label>
            <div className="flex items-center gap-2">
              <select
                value={settings.timeHour}
                onChange={(e) => saveSettings({ timeHour: Number(e.target.value) })}
                disabled={isSaving}
                className="bg-surface-interactive border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span>:</span>
              <select
                value={settings.timeMinute}
                onChange={(e) => saveSettings({ timeMinute: Number(e.target.value) })}
                disabled={isSaving}
                className="bg-surface-interactive border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                {[0, 15, 30, 45].map((m) => (
                  <option key={m} value={m}>
                    {m.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notification threshold */}
          <div>
            <label className="text-sm text-text-muted mb-2 block flex items-center gap-2">
              <Bell size={14} />
              Notify when cleanable space exceeds
            </label>
            <select
              value={settings.notifyThresholdBytes}
              onChange={(e) => saveSettings({ notifyThresholdBytes: Number(e.target.value) })}
              disabled={isSaving}
              className="bg-surface-interactive border border-white/10 rounded-lg px-3 py-2 text-sm"
            >
              {[1, 5, 10, 20, 50].map((gb) => (
                <option key={gb} value={gb * 1024 * 1024 * 1024}>
                  {gb} GB
                </option>
              ))}
            </select>
          </div>

          {/* Last run info */}
          {settings.lastRunAt && <p className="text-sm text-text-muted">Last scan: {new Date(settings.lastRunAt).toLocaleString()}</p>}

          {/* Run now button */}
          <button onClick={runNow} disabled={isRunning} className="btn-secondary px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {isRunning ? 'Running...' : 'Run Now'}
          </button>
        </>
      )}
    </div>
  )

  return (
    <ProFeatureGate feature="Scheduled Scans" showPreview={false}>
      {content}
    </ProFeatureGate>
  )
}
