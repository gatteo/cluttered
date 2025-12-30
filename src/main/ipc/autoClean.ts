import { autoCleanService } from '../services/autoCleanService'
import { AutoCleanSettings } from '../database/repositories/autoClean'

export const autoCleanHandlers = {
  async getSettings() {
    const settings = autoCleanService.getSettings()
    return {
      ...settings,
      lastRunAt: settings.lastRunAt?.toISOString() ?? null,
    }
  },

  async saveSettings(settings: Partial<AutoCleanSettings>) {
    const saved = autoCleanService.saveSettings(settings)
    return {
      ...saved,
      lastRunAt: saved.lastRunAt?.toISOString() ?? null,
    }
  },

  async runNow() {
    return await autoCleanService.run()
  },
}
