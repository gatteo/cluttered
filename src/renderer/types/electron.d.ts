// Import shared types - these are the canonical definitions
// Note: Some types are redefined here with slight variations (e.g., string instead of EcosystemId)
// because the IPC layer serializes data, and we want to be flexible with what we receive
import type {
  CleanOptions,
  CleanProgress,
  CleanResult,
  DiskSpace,
  Settings,
} from '../../shared/types'

// Re-export imported types for convenience
export type { CleanOptions, CleanProgress, CleanResult, DiskSpace, Settings }

export interface ElectronAPI {
  // App info
  getVersion: () => Promise<string>
  getPlatform: () => Promise<string>

  // Scanner
  startScan: (options?: ScanOptions) => Promise<ScanResult>
  cancelScan: () => Promise<void>
  getCachedResults: () => Promise<{ projects: Project[]; lastScanTime: Date | null }>
  onScanProgress: (callback: (progress: ScanProgress) => void) => () => void

  // Cleaner
  cleanProjects: (options: CleanOptions) => Promise<CleanResult>
  onCleanProgress: (callback: (progress: CleanProgress) => void) => () => void

  // Settings
  getSettings: () => Promise<Settings>
  setSettings: (settings: Settings) => Promise<void>

  // Statistics
  getStatistics: () => Promise<Statistics>

  // Deletion Log
  getDeletionLog: () => Promise<DeletionLogEntry[]>
  restoreFromLog: (entryId: string) => Promise<boolean>

  // System
  openInFinder: (path: string) => Promise<void>
  openInTerminal: (path: string) => Promise<void>
  openInVSCode: (path: string) => Promise<void>
  getDiskSpace: () => Promise<DiskSpace>
  selectFolder: () => Promise<string | null>
  triggerHaptic: (pattern: 'light' | 'medium' | 'heavy') => Promise<void>
  openExternal: (url: string) => Promise<void>

  // First run
  isFirstRun: () => Promise<boolean>

  // Analytics
  trackEvent: (event: string, properties?: Record<string, unknown>) => Promise<void>
  updateAnalyticsEnabled: (enabled: boolean) => Promise<void>

  // License
  license: {
    isPro: () => Promise<boolean>
    get: () => Promise<LicenseInfo | null>
    activate: (key: string) => Promise<LicenseValidationResult>
    deactivate: () => Promise<boolean>
    getCheckoutUrl: (email?: string) => Promise<string | null>
    openCheckout: (email?: string) => Promise<boolean>
  }

  // Quota
  quota: {
    get: () => Promise<QuotaInfo>
    canClean: (bytes: number) => Promise<QuotaCheckResult>
  }

  // Scheduler
  scheduler: {
    getSettings: () => Promise<SchedulerSettings>
    saveSettings: (settings: Partial<SchedulerSettings>) => Promise<SchedulerSettings>
    runNow: () => Promise<boolean>
  }

  // Auto-clean
  autoClean: {
    getSettings: () => Promise<AutoCleanSettings>
    saveSettings: (settings: Partial<AutoCleanSettings>) => Promise<AutoCleanSettings>
    runNow: () => Promise<AutoCleanResult | null>
  }

  // Sandbox (for Mac App Store builds)
  sandbox: {
    isMASBuild: () => Promise<boolean>
    hasAccessiblePaths: () => Promise<boolean>
    getAccessiblePaths: () => Promise<string[]>
    removeAccessiblePath: (path: string) => Promise<void>
  }
}

// ============ IPC-specific types ============
// These types represent what's actually sent over IPC
// They use 'string' for ecosystem to be flexible with serialization

interface ScanOptions {
  paths?: string[]
  excludePaths?: string[]
  ecosystems?: string[]
  followSymlinks?: boolean
}

interface ScanProgress {
  phase: 'discovering' | 'analyzing' | 'complete'
  currentPath?: string
  projectsFound: number
  totalSize: number
  ecosystemCounts?: Record<string, number>
  estimatedTimeRemaining?: number
}

interface ScanResult {
  projects: Project[]
  totalSize: number
  totalProjects: number
  scanDuration: number
  ecosystemSummary: EcosystemSummary[]
}

interface Project {
  id: string
  path: string
  name: string
  ecosystem: string
  status: 'active' | 'recent' | 'stale' | 'dormant'
  lastModified: Date
  lastGitCommit?: Date
  hasUncommittedChanges: boolean
  isProtected: boolean
  protectionReason?: string
  totalSize: number
  artifacts: ProjectArtifact[]
}

interface ProjectArtifact {
  pattern: string
  description: string
  size: number
  path: string
}

interface EcosystemSummary {
  ecosystem: string
  projectCount: number
  totalSize: number
  cleanableSize: number
}

interface Statistics {
  totalBytesFreed: number
  totalProjectsCleaned: number
  largestCleanup: number
  cleanupCount: number
  lastCleanupDate?: Date
  ecosystemStats: Record<string, { bytesFreed: number; projectsCleaned: number }>
}

interface DeletionLogEntry {
  id: string
  timestamp: Date
  projectPath: string
  projectName: string
  ecosystem: string
  artifacts: string[]
  totalSize: number
  trashedPath?: string
}

interface LicenseInfo {
  email: string | null
  provider: string
  purchasedAt: string
  isValid: boolean
}

interface LicenseValidationResult {
  isValid: boolean
  license?: LicenseInfo
  error?: string
}

interface QuotaInfo {
  isPro: boolean
  used: number
  limit: number
  remaining: number
  percentUsed: number
  resetAt: string | null
  canClean: boolean
}

interface QuotaCheckResult {
  allowed: boolean
  reason?: string
  remaining?: number
}

interface SchedulerSettings {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  timeHour: number
  timeMinute: number
  dayOfWeek: number
  notifyThresholdBytes: number
  lastRunAt: string | null
}

interface AutoCleanSettings {
  enabled: boolean
  minInactiveDays: number
  maxBytesPerRun: number
  showNotification: boolean
  lastRunAt: string | null
}

interface AutoCleanResult {
  bytesFreed: number
  projectsCleaned: number
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
