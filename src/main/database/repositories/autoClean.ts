import { getDatabase } from '../index'

export interface AutoCleanSettings {
  enabled: boolean
  minInactiveDays: number
  maxBytesPerRun: number
  showNotification: boolean
  lastRunAt: Date | null
}

const DEFAULT_SETTINGS: AutoCleanSettings = {
  enabled: false,
  minInactiveDays: 90,
  maxBytesPerRun: 50 * 1024 * 1024 * 1024, // 50 GB
  showNotification: true,
  lastRunAt: null,
}

export const autoCleanRepo = {
  /**
   * Get auto-clean settings.
   */
  get(): AutoCleanSettings {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM auto_clean_settings WHERE id = 1').get() as
      | {
          enabled: number
          min_inactive_days: number
          max_bytes_per_run: number
          show_notification: number
          last_run_at: number | null
        }
      | undefined

    if (!row) {
      // Initialize with defaults
      db.prepare(
        `INSERT OR REPLACE INTO auto_clean_settings
         (id, enabled, min_inactive_days, max_bytes_per_run, show_notification, last_run_at)
         VALUES (1, ?, ?, ?, ?, ?)`
      ).run(
        DEFAULT_SETTINGS.enabled ? 1 : 0,
        DEFAULT_SETTINGS.minInactiveDays,
        DEFAULT_SETTINGS.maxBytesPerRun,
        DEFAULT_SETTINGS.showNotification ? 1 : 0,
        null
      )
      return { ...DEFAULT_SETTINGS }
    }

    return {
      enabled: row.enabled === 1,
      minInactiveDays: row.min_inactive_days,
      maxBytesPerRun: row.max_bytes_per_run,
      showNotification: row.show_notification === 1,
      lastRunAt: row.last_run_at ? new Date(row.last_run_at) : null,
    }
  },

  /**
   * Save auto-clean settings.
   */
  save(settings: Partial<AutoCleanSettings>): AutoCleanSettings {
    const db = getDatabase()
    const current = this.get()
    const updated = { ...current, ...settings }

    db.prepare(
      `INSERT OR REPLACE INTO auto_clean_settings
       (id, enabled, min_inactive_days, max_bytes_per_run, show_notification, last_run_at)
       VALUES (1, ?, ?, ?, ?, ?)`
    ).run(
      updated.enabled ? 1 : 0,
      updated.minInactiveDays,
      updated.maxBytesPerRun,
      updated.showNotification ? 1 : 0,
      updated.lastRunAt?.getTime() ?? null
    )

    return updated
  },

  /**
   * Update the last run timestamp.
   */
  updateLastRun(): void {
    const db = getDatabase()
    db.prepare('UPDATE auto_clean_settings SET last_run_at = ? WHERE id = 1').run(Date.now())
  },
}
