import { getDatabase } from '../index'
import { Statistics, EcosystemId } from '../../../shared/types'

const defaultStats: Statistics = {
  totalBytesFreed: 0,
  totalProjectsCleaned: 0,
  largestCleanup: 0,
  cleanupCount: 0,
  lastCleanupDate: undefined,
  ecosystemStats: {},
}

export const statisticsRepo = {
  get(): Statistics {
    const db = getDatabase()
    const row = db.prepare("SELECT value FROM statistics WHERE key = 'app_stats'").get() as { value: string } | undefined

    if (!row) {
      return defaultStats
    }

    try {
      const parsed = JSON.parse(row.value)
      return {
        ...parsed,
        lastCleanupDate: parsed.lastCleanupDate ? new Date(parsed.lastCleanupDate) : undefined,
      }
    } catch {
      return defaultStats
    }
  },

  save(stats: Statistics) {
    const db = getDatabase()
    const toSave = {
      ...stats,
      lastCleanupDate: stats.lastCleanupDate?.getTime(),
    }
    db.prepare(
      `
      INSERT OR REPLACE INTO statistics (key, value)
      VALUES ('app_stats', ?)
    `
    ).run(JSON.stringify(toSave))
  },

  recordCleanup(bytesFreed: number, projectsCleaned: number, ecosystem?: EcosystemId) {
    const stats = this.get()

    stats.totalBytesFreed += bytesFreed
    stats.totalProjectsCleaned += projectsCleaned
    stats.cleanupCount += 1
    stats.lastCleanupDate = new Date()

    if (bytesFreed > stats.largestCleanup) {
      stats.largestCleanup = bytesFreed
    }

    if (ecosystem) {
      if (!stats.ecosystemStats[ecosystem]) {
        stats.ecosystemStats[ecosystem] = { bytesFreed: 0, projectsCleaned: 0 }
      }
      stats.ecosystemStats[ecosystem]!.bytesFreed += bytesFreed
      stats.ecosystemStats[ecosystem]!.projectsCleaned += projectsCleaned
    }

    this.save(stats)
    return stats
  },

  reset() {
    const db = getDatabase()
    db.prepare("DELETE FROM statistics WHERE key = 'app_stats'").run()
    return defaultStats
  },
}
