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

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }

  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null
      ) {
        result[key] = deepMerge(target[key], source[key] as any)
      } else if (Array.isArray(source[key]) && (source[key] as any[]).length === 0) {
        // Don't replace with empty arrays - keep the default
        // This handles the case where scanPaths was saved as []
      } else {
        result[key] = source[key] as any
      }
    }
  }

  return result
}
