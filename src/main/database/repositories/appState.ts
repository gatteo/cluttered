import { getDatabase } from '../index'

export const appStateRepo = {
  get(key: string): string | null {
    const db = getDatabase()
    const row = db.prepare('SELECT value FROM app_state WHERE key = ?').get(key) as { value: string } | undefined
    return row?.value ?? null
  },

  set(key: string, value: string) {
    const db = getDatabase()
    db.prepare(
      `
      INSERT OR REPLACE INTO app_state (key, value)
      VALUES (?, ?)
    `
    ).run(key, value)
  },

  delete(key: string) {
    const db = getDatabase()
    db.prepare('DELETE FROM app_state WHERE key = ?').run(key)
  },

  getBoolean(key: string): boolean {
    const value = this.get(key)
    return value === 'true'
  },

  setBoolean(key: string, value: boolean) {
    this.set(key, value ? 'true' : 'false')
  },

  isFirstRun(): boolean {
    return !this.getBoolean('hasCompletedFirstClean')
  },

  markFirstCleanComplete() {
    this.setBoolean('hasCompletedFirstClean', true)
  },
}
