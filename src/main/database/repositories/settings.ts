import { getDatabase } from '../index'
import { Settings, defaultSettings } from '../../../shared/types'

export const settingsRepo = {
  get(): Settings {
    const db = getDatabase()
    const row = db.prepare("SELECT value FROM settings WHERE key = 'app_settings'").get() as { value: string } | undefined

    if (!row) {
      return defaultSettings
    }

    try {
      const saved = JSON.parse(row.value)
      // Deep merge with defaults to handle new settings
      return deepMerge(defaultSettings, saved)
    } catch {
      return defaultSettings
    }
  },

  set(settings: Settings) {
    const db = getDatabase()
    db.prepare(
      `
      INSERT OR REPLACE INTO settings (key, value)
      VALUES ('app_settings', ?)
    `
    ).run(JSON.stringify(settings))
  },

  update(partial: Partial<Settings>) {
    const current = this.get()
    const updated = deepMerge(current, partial)
    this.set(updated)
    return updated
  },

  reset() {
    const db = getDatabase()
    db.prepare("DELETE FROM settings WHERE key = 'app_settings'").run()
    return defaultSettings
  },
}

function deepMerge(target: Settings, source: Partial<Settings>): Settings {
  return {
    general: { ...target.general, ...source.general },
    scanning: {
      ...target.scanning,
      ...source.scanning,
      // Don't replace with empty arrays - keep the default
      scanPaths: source.scanning?.scanPaths?.length ? source.scanning.scanPaths : target.scanning.scanPaths,
      excludePaths: source.scanning?.excludePaths?.length ? source.scanning.excludePaths : target.scanning.excludePaths,
      protectedPaths: source.scanning?.protectedPaths?.length ? source.scanning.protectedPaths : target.scanning.protectedPaths,
    },
    detection: { ...target.detection, ...source.detection },
    cleanup: { ...target.cleanup, ...source.cleanup },
    ecosystems: { ...target.ecosystems, ...source.ecosystems },
  }
}
