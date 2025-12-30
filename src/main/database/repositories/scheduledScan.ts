import { getDatabase } from '../index'

export type ScanFrequency = 'daily' | 'weekly' | 'monthly'

export interface ScheduledScanSettings {
  enabled: boolean
  frequency: ScanFrequency
  timeHour: number // 0-23
  timeMinute: number // 0-59
  dayOfWeek: number // 0-6 (Sunday-Saturday), used for weekly
  notifyThresholdBytes: number
  lastRunAt: Date | null
}

const DEFAULT_SETTINGS: ScheduledScanSettings = {
  enabled: false,
  frequency: 'weekly',
  timeHour: 9,
  timeMinute: 0,
  dayOfWeek: 0,
  notifyThresholdBytes: 10 * 1024 * 1024 * 1024, // 10 GB
  lastRunAt: null,
}

export const scheduledScanRepo = {
  get(): ScheduledScanSettings {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM scheduled_scan_settings WHERE id = 1').get() as any

    if (!row) {
      return DEFAULT_SETTINGS
    }

    return {
      enabled: Boolean(row.enabled),
      frequency: row.frequency as ScanFrequency,
      timeHour: row.time_hour,
      timeMinute: row.time_minute,
      dayOfWeek: row.day_of_week,
      notifyThresholdBytes: row.notify_threshold_bytes,
      lastRunAt: row.last_run_at ? new Date(row.last_run_at) : null,
    }
  },

  save(settings: Partial<ScheduledScanSettings>): void {
    const db = getDatabase()
    const current = this.get()
    const merged = { ...current, ...settings }

    db.prepare(
      `
      INSERT OR REPLACE INTO scheduled_scan_settings (
        id, enabled, frequency, time_hour, time_minute,
        day_of_week, notify_threshold_bytes, last_run_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      merged.enabled ? 1 : 0,
      merged.frequency,
      merged.timeHour,
      merged.timeMinute,
      merged.dayOfWeek,
      merged.notifyThresholdBytes,
      merged.lastRunAt?.getTime() || null
    )
  },

  updateLastRun(): void {
    const db = getDatabase()
    db.prepare(
      `
      UPDATE scheduled_scan_settings SET last_run_at = ? WHERE id = 1
    `
    ).run(Date.now())
  },

  reset(): void {
    const db = getDatabase()
    db.prepare('DELETE FROM scheduled_scan_settings WHERE id = 1').run()
  },
}
