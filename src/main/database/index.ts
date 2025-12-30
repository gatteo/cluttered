import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db: Database.Database | null = null

export function initDatabase(): Database.Database {
  const dbPath = path.join(app.getPath('userData'), 'cluttered.db')
  db = new Database(dbPath)

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL')

  createTables(db)
  return db
}

function createTables(db: Database.Database) {
  // Scan cache - stores last scan results
  db.exec(`
    CREATE TABLE IF NOT EXISTS scan_cache (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      name TEXT NOT NULL,
      ecosystem TEXT NOT NULL,
      status TEXT NOT NULL,
      last_modified INTEGER NOT NULL,
      last_git_commit INTEGER,
      has_uncommitted_changes INTEGER NOT NULL DEFAULT 0,
      is_protected INTEGER NOT NULL DEFAULT 0,
      protection_reason TEXT,
      total_size INTEGER NOT NULL,
      artifacts_json TEXT NOT NULL,
      scanned_at INTEGER NOT NULL
    )
  `)

  // Deletion log
  db.exec(`
    CREATE TABLE IF NOT EXISTS deletion_log (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      project_path TEXT NOT NULL,
      project_name TEXT NOT NULL,
      ecosystem TEXT NOT NULL,
      artifacts_json TEXT NOT NULL,
      total_size INTEGER NOT NULL,
      trashed_path TEXT
    )
  `)

  // Statistics
  db.exec(`
    CREATE TABLE IF NOT EXISTS statistics (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  // Settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  // App state
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  // License storage (provider-agnostic)
  db.exec(`
    CREATE TABLE IF NOT EXISTS license (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      license_key TEXT,
      email TEXT,
      provider TEXT NOT NULL,
      provider_customer_id TEXT,
      provider_transaction_id TEXT,
      purchased_at INTEGER NOT NULL,
      validated_at INTEGER,
      is_valid INTEGER DEFAULT 1,
      raw_data TEXT
    )
  `)

  // Cleaning quota tracking (for free tier limit)
  db.exec(`
    CREATE TABLE IF NOT EXISTS cleaning_quota (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cleaned_at INTEGER NOT NULL,
      bytes_cleaned INTEGER NOT NULL,
      project_id TEXT,
      project_name TEXT
    )
  `)

  // Scheduled scan settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS scheduled_scan_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      enabled INTEGER DEFAULT 0,
      frequency TEXT DEFAULT 'weekly',
      time_hour INTEGER DEFAULT 9,
      time_minute INTEGER DEFAULT 0,
      day_of_week INTEGER DEFAULT 0,
      notify_threshold_bytes INTEGER DEFAULT 10737418240,
      last_run_at INTEGER
    )
  `)

  // Auto-clean settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS auto_clean_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      enabled INTEGER DEFAULT 0,
      min_inactive_days INTEGER DEFAULT 90,
      max_bytes_per_run INTEGER DEFAULT 53687091200,
      show_notification INTEGER DEFAULT 1,
      last_run_at INTEGER
    )
  `)

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_scan_cache_ecosystem ON scan_cache(ecosystem);
    CREATE INDEX IF NOT EXISTS idx_scan_cache_status ON scan_cache(status);
    CREATE INDEX IF NOT EXISTS idx_deletion_log_timestamp ON deletion_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_quota_date ON cleaning_quota(cleaned_at);
  `)
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}
