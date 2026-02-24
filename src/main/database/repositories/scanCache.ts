import { getDatabase } from '../index'
import { Project, EcosystemId, GlobalCache, GlobalCacheCategory } from '../../../shared/types'

interface ScanCacheRow {
  id: string
  path: string
  name: string
  ecosystem: string
  status: string
  last_modified: number
  last_git_commit: number | null
  has_uncommitted_changes: number
  is_protected: number
  protection_reason: string | null
  total_size: number
  artifacts_json: string
  scanned_at: number
}

function rowToProject(row: ScanCacheRow): Project {
  return {
    id: row.id,
    path: row.path,
    name: row.name,
    ecosystem: row.ecosystem as EcosystemId,
    status: row.status as Project['status'],
    lastModified: new Date(row.last_modified),
    lastGitCommit: row.last_git_commit ? new Date(row.last_git_commit) : undefined,
    hasUncommittedChanges: row.has_uncommitted_changes === 1,
    isProtected: row.is_protected === 1,
    protectionReason: row.protection_reason ?? undefined,
    totalSize: row.total_size,
    artifacts: JSON.parse(row.artifacts_json),
  }
}

export const scanCacheRepo = {
  saveProjects(projects: Project[]) {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO scan_cache
      (id, path, name, ecosystem, status, last_modified, last_git_commit,
       has_uncommitted_changes, is_protected, protection_reason, total_size,
       artifacts_json, scanned_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const now = Date.now()
    const insertMany = db.transaction((projects: Project[]) => {
      for (const p of projects) {
        stmt.run(
          p.id,
          p.path,
          p.name,
          p.ecosystem,
          p.status,
          p.lastModified.getTime(),
          p.lastGitCommit?.getTime() ?? null,
          p.hasUncommittedChanges ? 1 : 0,
          p.isProtected ? 1 : 0,
          p.protectionReason ?? null,
          p.totalSize,
          JSON.stringify(p.artifacts),
          now
        )
      }
    })

    insertMany(projects)
  },

  getAll(): Project[] {
    const db = getDatabase()
    const rows = db.prepare('SELECT * FROM scan_cache ORDER BY total_size DESC').all() as ScanCacheRow[]
    return rows.map(rowToProject)
  },

  getByEcosystem(ecosystem: EcosystemId): Project[] {
    const db = getDatabase()
    const rows = db.prepare('SELECT * FROM scan_cache WHERE ecosystem = ? ORDER BY total_size DESC').all(ecosystem) as ScanCacheRow[]
    return rows.map(rowToProject)
  },

  getById(id: string): Project | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM scan_cache WHERE id = ?').get(id) as ScanCacheRow | undefined
    return row ? rowToProject(row) : null
  },

  getByIds(ids: string[]): Project[] {
    if (ids.length === 0) return []
    const db = getDatabase()
    const placeholders = ids.map(() => '?').join(',')
    const rows = db.prepare(`SELECT * FROM scan_cache WHERE id IN (${placeholders})`).all(...ids) as ScanCacheRow[]
    return rows.map(rowToProject)
  },

  clear() {
    const db = getDatabase()
    db.prepare('DELETE FROM scan_cache').run()
  },

  removeByIds(ids: string[]) {
    if (ids.length === 0) return
    const db = getDatabase()
    const placeholders = ids.map(() => '?').join(',')
    db.prepare(`DELETE FROM scan_cache WHERE id IN (${placeholders})`).run(...ids)
  },

  getLastScanTime(): Date | null {
    const db = getDatabase()
    const row = db.prepare('SELECT MAX(scanned_at) as last FROM scan_cache').get() as { last: number | null }
    return row?.last ? new Date(row.last) : null
  },

  getProjectCount(): number {
    const db = getDatabase()
    const row = db.prepare('SELECT COUNT(*) as count FROM scan_cache').get() as { count: number }
    return row.count
  },

  getTotalSize(): number {
    const db = getDatabase()
    const row = db.prepare('SELECT SUM(total_size) as total FROM scan_cache').get() as { total: number | null }
    return row.total ?? 0
  },

  // --- Global caches ---

  saveGlobalCaches(caches: GlobalCache[]) {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO global_cache
      (id, category, name, description, icon, path, size, always_safe, clean_command, caution_note, scanned_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const now = Date.now()
    const insertMany = db.transaction((caches: GlobalCache[]) => {
      for (const c of caches) {
        stmt.run(c.id, c.category, c.name, c.description, c.icon, c.path, c.size, c.alwaysSafe ? 1 : 0, c.cleanCommand ?? null, c.cautionNote ?? null, now)
      }
    })

    insertMany(caches)
  },

  getAllGlobalCaches(): GlobalCache[] {
    const db = getDatabase()
    const rows = db.prepare('SELECT * FROM global_cache ORDER BY size DESC').all() as Array<{
      id: string
      category: string
      name: string
      description: string
      icon: string
      path: string
      size: number
      always_safe: number
      clean_command: string | null
      caution_note: string | null
    }>
    return rows.map((row) => ({
      id: row.id,
      category: row.category as GlobalCacheCategory,
      name: row.name,
      description: row.description,
      icon: row.icon,
      path: row.path,
      size: row.size,
      alwaysSafe: row.always_safe === 1,
      cleanCommand: row.clean_command ?? undefined,
      cautionNote: row.caution_note ?? undefined,
    }))
  },

  getGlobalCachesByIds(ids: string[]): GlobalCache[] {
    if (ids.length === 0) return []
    const db = getDatabase()
    const placeholders = ids.map(() => '?').join(',')
    const rows = db.prepare(`SELECT * FROM global_cache WHERE id IN (${placeholders})`).all(...ids) as Array<{
      id: string
      category: string
      name: string
      description: string
      icon: string
      path: string
      size: number
      always_safe: number
      clean_command: string | null
      caution_note: string | null
    }>
    return rows.map((row) => ({
      id: row.id,
      category: row.category as GlobalCacheCategory,
      name: row.name,
      description: row.description,
      icon: row.icon,
      path: row.path,
      size: row.size,
      alwaysSafe: row.always_safe === 1,
      cleanCommand: row.clean_command ?? undefined,
      cautionNote: row.caution_note ?? undefined,
    }))
  },

  clearGlobalCaches() {
    const db = getDatabase()
    db.prepare('DELETE FROM global_cache').run()
  },
}
