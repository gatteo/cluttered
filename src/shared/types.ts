// ============ Ecosystem Types ============

export type EcosystemId =
  | 'react-native'
  | 'nodejs'
  | 'rust'
  | 'xcode'
  | 'android'
  | 'python'
  | 'go'
  | 'docker'
  | 'ruby'
  | 'php'
  | 'java'
  | 'elixir'
  | 'dotnet'

export interface CleanablePattern {
  pattern: string
  description: string
  alwaysSafe: boolean
}

export interface EcosystemConfig {
  id: EcosystemId
  name: string
  icon: string
  color: string
  detectionFiles: string[]
  cleanablePatterns: CleanablePattern[]
}

// ============ Project Types ============

export type ProjectStatus = 'active' | 'recent' | 'stale' | 'dormant'

export interface ProjectArtifact {
  pattern: string
  description: string
  size: number
  path: string
}

export interface Project {
  id: string
  path: string
  name: string
  ecosystem: EcosystemId
  status: ProjectStatus
  lastModified: Date
  lastGitCommit?: Date
  hasUncommittedChanges: boolean
  isProtected: boolean
  protectionReason?: string
  totalSize: number
  artifacts: ProjectArtifact[]
}

// ============ Scan Types ============

export interface ScanOptions {
  paths: string[]
  excludePaths: string[]
  ecosystems: EcosystemId[]
  followSymlinks: boolean
}

export interface ScanProgress {
  phase: 'discovering' | 'analyzing' | 'complete'
  currentPath?: string
  projectsFound: number
  totalSize: number
  ecosystemCounts: Partial<Record<EcosystemId, number>>
  estimatedTimeRemaining?: number
}

export interface ScanResult {
  projects: Project[]
  totalSize: number
  totalProjects: number
  scanDuration: number
  ecosystemSummary: EcosystemSummary[]
}

export interface EcosystemSummary {
  ecosystem: EcosystemId
  projectCount: number
  totalSize: number
  cleanableSize: number
}

// ============ Clean Types ============

export interface CleanOptions {
  projectIds: string[]
  dryRun: boolean
  moveToTrash: boolean
}

export interface CleanProgress {
  currentProject?: string
  projectsProcessed: number
  totalProjects: number
  bytesFreed: number
  filesDeleted: number
}

export interface CleanResult {
  success: boolean
  bytesFreed: number
  filesDeleted: number
  projectsCleaned: string[]
  errors: CleanError[]
}

export interface CleanError {
  projectId: string
  error: string
}

// ============ Settings Types ============

export interface Settings {
  general: GeneralSettings
  scanning: ScanningSettings
  detection: DetectionSettings
  cleanup: CleanupSettings
  ecosystems: EcosystemSettings
}

export interface GeneralSettings {
  startAtLogin: boolean
  checkForUpdates: boolean
  sendAnalytics: boolean
  theme: 'light' | 'dark' | 'system'
}

export interface ScanningSettings {
  scanPaths: string[]
  excludePaths: string[]
  protectedPaths: string[]
  followSymlinks: boolean
}

export interface DetectionSettings {
  activeThresholdDays: number
  recentThresholdDays: number
  staleThresholdDays: number
  considerGitActivity: boolean
  considerIDEActivity: boolean
}

export interface CleanupSettings {
  moveToTrash: boolean
  confirmRecentProjects: boolean
  soundEffects: boolean
  hapticFeedback: boolean
}

export interface EcosystemSettings {
  enabled: Record<EcosystemId, boolean>
}

// ============ Statistics Types ============

export interface Statistics {
  totalBytesFreed: number
  totalProjectsCleaned: number
  largestCleanup: number
  cleanupCount: number
  lastCleanupDate?: Date
  ecosystemStats: Partial<Record<EcosystemId, EcosystemStats>>
}

export interface EcosystemStats {
  bytesFreed: number
  projectsCleaned: number
}

// ============ Deletion Log Types ============

export interface DeletionLogEntry {
  id: string
  timestamp: Date
  projectPath: string
  projectName: string
  ecosystem: EcosystemId
  artifacts: string[]
  totalSize: number
  trashedPath?: string
}

// ============ Disk Space Types ============

export interface DiskSpace {
  total: number
  free: number
  used: number
}

// ============ Default Settings ============

export const defaultSettings: Settings = {
  general: {
    startAtLogin: false,
    checkForUpdates: true,
    sendAnalytics: true,
    theme: 'dark',
  },
  scanning: {
    scanPaths: ['~/'],
    excludePaths: [],
    protectedPaths: [],
    followSymlinks: false,
  },
  detection: {
    activeThresholdDays: 7,
    recentThresholdDays: 30,
    staleThresholdDays: 90,
    considerGitActivity: true,
    considerIDEActivity: true,
  },
  cleanup: {
    moveToTrash: true,
    confirmRecentProjects: true,
    soundEffects: true,
    hapticFeedback: true,
  },
  ecosystems: {
    enabled: {
      'react-native': true,
      nodejs: true,
      rust: true,
      xcode: true,
      android: true,
      python: true,
      go: true,
      docker: true,
      ruby: true,
      php: true,
      java: true,
      elixir: true,
      dotnet: true,
    },
  },
}
