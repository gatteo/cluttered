import { getDatabase } from '../index'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const QUOTA_BYTES = 20 * 1024 * 1024 * 1024 // 20 GB

interface QuotaEntry {
  id: number
  cleanedAt: Date
  bytesCleaned: number
  projectId: string | null
  projectName: string | null
}

export const quotaRepo = {
  /**
   * Record a cleaning operation.
   */
  record(bytes: number, projectId?: string, projectName?: string): void {
    const db = getDatabase()
    db.prepare(
      `
      INSERT INTO cleaning_quota (cleaned_at, bytes_cleaned, project_id, project_name)
      VALUES (?, ?, ?, ?)
    `
    ).run(Date.now(), bytes, projectId || null, projectName || null)
  },

  /**
   * Get total bytes cleaned in the last 7 days.
   */
  getWeeklyUsage(): number {
    const db = getDatabase()
    const weekAgo = Date.now() - WEEK_MS
    const result = db
      .prepare(
        `
      SELECT COALESCE(SUM(bytes_cleaned), 0) as total
      FROM cleaning_quota
      WHERE cleaned_at > ?
    `
      )
      .get(weekAgo) as { total: number }

    return result.total
  },

  /**
   * Get remaining quota bytes.
   */
  getRemaining(): number {
    const used = this.getWeeklyUsage()
    return Math.max(0, QUOTA_BYTES - used)
  },

  /**
   * Get when the oldest cleaning in the window expires (quota partially resets).
   */
  getNextResetTime(): Date | null {
    const db = getDatabase()
    const weekAgo = Date.now() - WEEK_MS
    const oldest = db
      .prepare(
        `
      SELECT MIN(cleaned_at) as oldest
      FROM cleaning_quota
      WHERE cleaned_at > ?
    `
      )
      .get(weekAgo) as { oldest: number | null }

    if (!oldest.oldest) {
      return null // No cleanings in window, quota is full
    }

    return new Date(oldest.oldest + WEEK_MS)
  },

  /**
   * Get recent cleaning entries (for display).
   */
  getRecentEntries(limit = 10): QuotaEntry[] {
    const db = getDatabase()
    const rows = db
      .prepare(
        `
      SELECT id, cleaned_at, bytes_cleaned, project_id, project_name
      FROM cleaning_quota
      ORDER BY cleaned_at DESC
      LIMIT ?
    `
      )
      .all(limit) as any[]

    return rows.map((row) => ({
      id: row.id,
      cleanedAt: new Date(row.cleaned_at),
      bytesCleaned: row.bytes_cleaned,
      projectId: row.project_id,
      projectName: row.project_name,
    }))
  },

  /**
   * Cleanup old entries (older than 30 days).
   */
  prune(): number {
    const db = getDatabase()
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    const result = db.prepare('DELETE FROM cleaning_quota WHERE cleaned_at < ?').run(monthAgo)
    return result.changes
  },

  /**
   * Get the quota limit in bytes.
   */
  getLimit(): number {
    return QUOTA_BYTES
  },
}
