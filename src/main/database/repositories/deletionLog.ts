import { getDatabase } from '../index';
import { DeletionLogEntry, EcosystemId } from '../../../shared/types';

interface DeletionLogRow {
  id: string;
  timestamp: number;
  project_path: string;
  project_name: string;
  ecosystem: string;
  artifacts_json: string;
  total_size: number;
  trashed_path: string | null;
}

function rowToEntry(row: DeletionLogRow): DeletionLogEntry {
  return {
    id: row.id,
    timestamp: new Date(row.timestamp),
    projectPath: row.project_path,
    projectName: row.project_name,
    ecosystem: row.ecosystem as EcosystemId,
    artifacts: JSON.parse(row.artifacts_json),
    totalSize: row.total_size,
    trashedPath: row.trashed_path ?? undefined,
  };
}

export const deletionLogRepo = {
  add(entry: DeletionLogEntry) {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO deletion_log
      (id, timestamp, project_path, project_name, ecosystem, artifacts_json, total_size, trashed_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.id,
      entry.timestamp.getTime(),
      entry.projectPath,
      entry.projectName,
      entry.ecosystem,
      JSON.stringify(entry.artifacts),
      entry.totalSize,
      entry.trashedPath ?? null
    );
  },

  getAll(limit = 100): DeletionLogEntry[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM deletion_log
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(limit) as DeletionLogRow[];

    return rows.map(rowToEntry);
  },

  getRecent(days = 30): DeletionLogEntry[] {
    const db = getDatabase();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const rows = db.prepare(`
      SELECT * FROM deletion_log
      WHERE timestamp > ?
      ORDER BY timestamp DESC
    `).all(cutoff) as DeletionLogRow[];

    return rows.map(rowToEntry);
  },

  getById(id: string): DeletionLogEntry | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM deletion_log WHERE id = ?').get(id) as DeletionLogRow | undefined;
    return row ? rowToEntry(row) : null;
  },

  delete(id: string) {
    const db = getDatabase();
    db.prepare('DELETE FROM deletion_log WHERE id = ?').run(id);
  },

  deleteOld(days = 30) {
    const db = getDatabase();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const result = db.prepare('DELETE FROM deletion_log WHERE timestamp < ?').run(cutoff);
    return result.changes;
  },

  getCount(): number {
    const db = getDatabase();
    const row = db.prepare('SELECT COUNT(*) as count FROM deletion_log').get() as { count: number };
    return row.count;
  },

  getTotalSize(): number {
    const db = getDatabase();
    const row = db.prepare('SELECT SUM(total_size) as total FROM deletion_log').get() as { total: number | null };
    return row.total ?? 0;
  },
};
