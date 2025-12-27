export interface ElectronAPI {
  // App info
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;

  // Scanner
  startScan: (options?: ScanOptions) => Promise<ScanResult>;
  cancelScan: () => Promise<void>;
  getCachedResults: () => Promise<{ projects: Project[]; lastScanTime: Date | null }>;
  onScanProgress: (callback: (progress: ScanProgress) => void) => () => void;

  // Cleaner
  cleanProjects: (options: CleanOptions) => Promise<CleanResult>;
  onCleanProgress: (callback: (progress: CleanProgress) => void) => () => void;

  // Settings
  getSettings: () => Promise<Settings>;
  setSettings: (settings: Settings) => Promise<void>;

  // Statistics
  getStatistics: () => Promise<Statistics>;

  // Deletion Log
  getDeletionLog: () => Promise<DeletionLogEntry[]>;
  restoreFromLog: (entryId: string) => Promise<boolean>;

  // System
  openInFinder: (path: string) => Promise<void>;
  openInTerminal: (path: string) => Promise<void>;
  openInVSCode: (path: string) => Promise<void>;
  getDiskSpace: () => Promise<DiskSpace>;
  selectFolder: () => Promise<string | null>;
  triggerHaptic: (pattern: 'light' | 'medium' | 'heavy') => Promise<void>;

  // First run
  isFirstRun: () => Promise<boolean>;
}

// Types will be fully defined in Task 02
interface ScanOptions {
  paths?: string[];
  excludePaths?: string[];
  ecosystems?: string[];
  followSymlinks?: boolean;
}

interface ScanProgress {
  phase: 'discovering' | 'analyzing' | 'complete';
  currentPath?: string;
  projectsFound: number;
  totalSize: number;
  ecosystemCounts?: Record<string, number>;
  estimatedTimeRemaining?: number;
}

interface ScanResult {
  projects: Project[];
  totalSize: number;
  totalProjects: number;
  scanDuration: number;
  ecosystemSummary: EcosystemSummary[];
}

interface Project {
  id: string;
  path: string;
  name: string;
  ecosystem: string;
  status: 'active' | 'recent' | 'stale' | 'dormant';
  lastModified: Date;
  lastGitCommit?: Date;
  hasUncommittedChanges: boolean;
  isProtected: boolean;
  protectionReason?: string;
  totalSize: number;
  artifacts: ProjectArtifact[];
}

interface ProjectArtifact {
  pattern: string;
  description: string;
  size: number;
  path: string;
}

interface EcosystemSummary {
  ecosystem: string;
  projectCount: number;
  totalSize: number;
  cleanableSize: number;
}

interface CleanOptions {
  projectIds: string[];
  dryRun: boolean;
  moveToTrash: boolean;
}

interface CleanProgress {
  currentProject?: string;
  projectsProcessed: number;
  totalProjects: number;
  bytesFreed: number;
  filesDeleted: number;
}

interface CleanResult {
  success: boolean;
  bytesFreed: number;
  filesDeleted: number;
  projectsCleaned: string[];
  errors: Array<{ projectId: string; error: string }>;
}

interface Settings {
  general: {
    startAtLogin: boolean;
    checkForUpdates: boolean;
    sendAnalytics: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  scanning: {
    scanPaths: string[];
    excludePaths: string[];
    protectedPaths: string[];
    followSymlinks: boolean;
  };
  detection: {
    activeThresholdDays: number;
    recentThresholdDays: number;
    staleThresholdDays: number;
    considerGitActivity: boolean;
    considerIDEActivity: boolean;
  };
  cleanup: {
    moveToTrash: boolean;
    confirmRecentProjects: boolean;
    soundEffects: boolean;
    hapticFeedback: boolean;
  };
  ecosystems: {
    enabled: Record<string, boolean>;
  };
}

interface Statistics {
  totalBytesFreed: number;
  totalProjectsCleaned: number;
  largestCleanup: number;
  cleanupCount: number;
  lastCleanupDate?: Date;
  ecosystemStats: Record<string, { bytesFreed: number; projectsCleaned: number }>;
}

interface DeletionLogEntry {
  id: string;
  timestamp: Date;
  projectPath: string;
  projectName: string;
  ecosystem: string;
  artifacts: string[];
  totalSize: number;
  trashedPath?: string;
}

interface DiskSpace {
  total: number;
  free: number;
  used: number;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
