# Cluttered - Technical Architecture

> A macOS application for developers to reclaim disk space by cleaning build artifacts, caches, and dependencies from development projects.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Architecture](#architecture)
- [Main Process (Backend)](#main-process-backend)
  - [Services](#services)
  - [Ecosystem Plugins](#ecosystem-plugins)
  - [Database Layer](#database-layer)
  - [IPC Handlers](#ipc-handlers)
- [Renderer Process (Frontend)](#renderer-process-frontend)
  - [State Management](#state-management)
  - [Pages](#pages)
  - [Components](#components)
- [Data Flow](#data-flow)
- [Key Workflows](#key-workflows)
- [Configuration](#configuration)
- [Security](#security)

---

## Overview

Cluttered.dev is an Electron application that scans developer machines for projects and identifies cleanable artifacts like `node_modules`, `target/`, `.venv`, build outputs, and caches. It supports 12 ecosystems and provides a safe way to reclaim disk space while protecting active projects.

### Key Features

- **Multi-ecosystem support**: Node.js, Python, Rust, Go, Xcode, Android, Docker, Ruby, PHP, Java, Elixir, .NET
- **Smart protection**: Detects uncommitted Git changes, IDE usage, and user-defined protected paths
- **Activity classification**: Projects categorized as active, recent, stale, or dormant based on configurable thresholds
- **Safe deletion**: Moves to Trash by default with restoration capability
- **Real-time progress**: Live updates during scanning and cleaning operations

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Electron 28+ | Cross-platform desktop app |
| **Frontend** | React 18 + TypeScript | UI components |
| **State** | Zustand | Lightweight state management |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Animations** | Framer Motion | Smooth UI transitions |
| **Database** | better-sqlite3 | Local data persistence |
| **Build** | Vite + electron-builder | Fast builds, app packaging |
| **IPC** | Electron IPC | Main-renderer communication |

---

## Folder Structure

```
Cluttered.dev/
├── src/
│   ├── main/                      # Electron main process
│   │   ├── index.ts               # App entry, window creation
│   │   ├── preload.ts             # IPC bridge (context isolation)
│   │   ├── database/              # SQLite persistence layer
│   │   │   ├── index.ts           # DB init & schema
│   │   │   └── repositories/      # Data access objects
│   │   │       ├── settings.ts    # User settings
│   │   │       ├── scanCache.ts   # Cached scan results
│   │   │       ├── deletionLog.ts # Deletion history
│   │   │       ├── statistics.ts  # Cleanup stats
│   │   │       └── appState.ts    # App flags
│   │   ├── services/              # Core business logic
│   │   │   ├── base.ts            # Base service with IPC
│   │   │   ├── scanner.ts         # Project discovery
│   │   │   ├── cleaner.ts         # Artifact deletion
│   │   │   ├── git.ts             # Git integration
│   │   │   ├── ideDetector.ts     # IDE usage detection
│   │   │   ├── protectionAnalyzer.ts
│   │   │   ├── projectClassifier.ts
│   │   │   └── activityAggregator.ts
│   │   ├── ecosystems/            # Plugin system
│   │   │   ├── base.ts            # Base plugin class
│   │   │   ├── types.ts           # Plugin interfaces
│   │   │   ├── index.ts           # Registry
│   │   │   └── plugins/           # 12 ecosystem implementations
│   │   │       ├── nodejs.ts
│   │   │       ├── python.ts
│   │   │       ├── rust.ts
│   │   │       └── ...
│   │   ├── ipc/                   # IPC request handlers
│   │   │   ├── index.ts           # Handler registration
│   │   │   ├── scanner.ts
│   │   │   ├── cleaner.ts
│   │   │   ├── settings.ts
│   │   │   └── system.ts
│   │   └── utils/
│   │       └── parallelWalk.ts    # Filesystem traversal
│   │
│   ├── renderer/                  # React UI
│   │   ├── index.tsx              # React entry
│   │   ├── App.tsx                # Root component
│   │   ├── pages/                 # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── EcosystemDetail.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/            # Reusable UI
│   │   │   ├── ActionBar.tsx
│   │   │   ├── EcosystemGrid.tsx
│   │   │   ├── ScanProgress.tsx
│   │   │   ├── HeroStats.tsx
│   │   │   └── settings/
│   │   ├── store/                 # Zustand stores
│   │   │   ├── scanStore.ts
│   │   │   ├── projectStore.ts
│   │   │   ├── cleanStore.ts
│   │   │   ├── settingsStore.ts
│   │   │   └── uiStore.ts
│   │   ├── hooks/
│   │   │   ├── useScan.ts
│   │   │   └── useFeedback.ts
│   │   ├── config/
│   │   │   └── ecosystems.ts      # Ecosystem display config
│   │   ├── utils/
│   │   │   └── format.ts          # Formatting helpers
│   │   └── types/
│   │       └── electron.d.ts      # Electron API types
│   │
│   └── shared/                    # Shared between processes
│       └── types.ts               # Common type definitions
│
├── assets/                        # Static assets
│   ├── icons/
│   └── sounds/
├── electron-builder.yml           # Build configuration
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Electron Main Process                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  Services   │───▶│  Ecosystem  │───▶│  Database   │         │
│  │   Layer     │    │   Plugins   │    │    Layer    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                                      │                 │
│         ▼                                      ▼                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    IPC Handlers                          │   │
│  │  scan:start | clean:start | settings:* | system:*       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │ Preload Bridge (Context Isolation)
┌──────────────────────────────┼───────────────────────────────────┐
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Zustand State Stores                     │   │
│  │  ScanStore | ProjectStore | CleanStore | SettingsStore  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  Dashboard  │    │  Ecosystem  │    │  Settings   │         │
│  │    Page     │    │   Detail    │    │    Page     │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                  │
│                      Renderer Process (React)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Main Process (Backend)

### Services

#### ScannerService

**Purpose**: Discover and analyze developer projects on the filesystem.

**Two-phase scan process**:
1. **Discovery**: Recursively walks directories, detects project roots via ecosystem plugins
2. **Analysis**: For each project, calculates size, checks activity, determines protection status

```typescript
class ScannerService {
  async scan(options: ScanOptions): Promise<ScanResult>
  cancel(): void
}
```

**Key features**:
- Parallel analysis (10 concurrent projects)
- Progress updates via IPC events
- Respects excluded paths and system directories
- Safety limit: 50,000 directories max per scan path

#### CleanerService

**Purpose**: Safely remove build artifacts and cache files.

```typescript
class CleanerService {
  async clean(projectIds: string[], options: CleanOptions): Promise<CleanResult>
}
```

**Safety measures**:
- Double-checks protection before deletion
- Supports dry-run preview mode
- Logs all deletions for restoration
- Moves to Trash by default (recoverable)

#### GitService

**Purpose**: Extract Git metadata for activity tracking and protection.

```typescript
class GitService {
  async getProjectInfo(path: string): Promise<GitInfo>
  async isWorkingDirectoryClean(path: string): Promise<boolean>
  async getLastCommitDate(path: string): Promise<Date | null>
}
```

#### ProtectionAnalyzer

**Purpose**: Determine if a project is safe to clean.

**Protection criteria**:
- Uncommitted Git changes
- In user-configured protected paths
- Currently open in an IDE (via `lsof`)
- Recently active (configurable threshold)

#### ProjectClassifier

**Purpose**: Classify projects by activity level.

| Status | Default Threshold | Description |
|--------|-------------------|-------------|
| `active` | < 7 days | Recently modified |
| `recent` | 7-30 days | Moderate activity |
| `stale` | 30-90 days | Low activity |
| `dormant` | 90+ days | Inactive |

---

### Ecosystem Plugins

The plugin system enables support for different development ecosystems.

#### Base Plugin Interface

```typescript
interface EcosystemPlugin {
  id: string;                    // e.g., 'nodejs'
  name: string;                  // e.g., 'Node.js'
  icon: string;                  // Emoji icon
  color: string;                 // Hex color
  detectionFiles: string[];      // Files that identify the ecosystem
  cleanablePatterns: Pattern[];  // Artifacts to clean

  detect(path: string): Promise<boolean>;
  analyzeActivity(path: string): Promise<ProjectActivity>;
  calculateSize(path: string): Promise<SizeResult>;
  clean(path: string, options: CleanOptions): Promise<CleanResult>;
}
```

#### Supported Ecosystems

| Ecosystem | Detection Files | Cleanable Artifacts |
|-----------|-----------------|---------------------|
| **Node.js** | `package.json` | `node_modules`, `.next`, `.nuxt`, `dist`, `build`, `.turbo`, `.cache` |
| **Python** | `requirements.txt`, `pyproject.toml`, `Pipfile` | `__pycache__`, `.venv`, `venv`, `.pytest_cache`, `.mypy_cache` |
| **Rust** | `Cargo.toml` | `target/` |
| **Go** | `go.mod` | `vendor/` |
| **Xcode** | `*.xcodeproj`, `*.xcworkspace` | `DerivedData`, `build/` |
| **Android** | `build.gradle`, `AndroidManifest.xml` | `build/`, `.gradle` |
| **Docker** | `Dockerfile`, `docker-compose.yml` | Detection only |
| **Ruby** | `Gemfile` | `vendor/bundle` |
| **PHP** | `composer.json` | `vendor/` |
| **Java** | `pom.xml`, `build.gradle` | `target/`, `build/` |
| **Elixir** | `mix.exs` | `deps/`, `_build/` |
| **.NET** | `*.csproj`, `*.sln` | `bin/`, `obj/` |

#### Size Calculation

Uses system `du` command for fast size calculation:

```typescript
async getDirectorySize(dirPath: string): Promise<number> {
  const { stdout } = await execAsync(`du -sk "${dirPath}"`);
  const sizeKB = parseInt(stdout.split('\t')[0], 10);
  return sizeKB * 1024; // Convert to bytes
}
```

---

### Database Layer

Uses **better-sqlite3** with WAL mode for performance.

#### Schema

```sql
-- Cached scan results
CREATE TABLE scan_cache (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  name TEXT NOT NULL,
  ecosystem TEXT NOT NULL,
  status TEXT NOT NULL,
  last_modified INTEGER NOT NULL,
  last_git_commit INTEGER,
  has_uncommitted_changes INTEGER DEFAULT 0,
  is_protected INTEGER DEFAULT 0,
  protection_reason TEXT,
  total_size INTEGER NOT NULL,
  artifacts_json TEXT NOT NULL,
  scanned_at INTEGER NOT NULL
);

-- Deletion history for restoration
CREATE TABLE deletion_log (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  project_path TEXT NOT NULL,
  project_name TEXT NOT NULL,
  ecosystem TEXT NOT NULL,
  artifacts_json TEXT NOT NULL,
  total_size INTEGER NOT NULL,
  trashed_path TEXT
);

-- Cumulative statistics
CREATE TABLE statistics (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- User settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Application state
CREATE TABLE app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

#### Repositories

| Repository | Purpose |
|------------|---------|
| `settingsRepo` | User preferences CRUD |
| `scanCacheRepo` | Scan results persistence |
| `deletionLogRepo` | Deletion history for restore |
| `statisticsRepo` | Cleanup statistics |
| `appStateRepo` | App flags (e.g., first run) |

---

### IPC Handlers

Communication between main and renderer processes via Electron IPC.

#### Scanner Handlers

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `scan:start` | Request | Start filesystem scan |
| `scan:cancel` | Request | Cancel in-progress scan |
| `scan:getCached` | Request | Get cached results |
| `scan:progress` | Event | Real-time progress updates |

#### Cleaner Handlers

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `clean:start` | Request | Execute cleanup |
| `clean:preview` | Request | Dry-run preview |
| `clean:progress` | Event | Real-time progress |

#### System Handlers

| Channel | Purpose |
|---------|---------|
| `system:openInFinder` | Open folder in Finder |
| `system:openInTerminal` | Launch terminal at path |
| `system:openInVSCode` | Open in VS Code |
| `system:getDiskSpace` | Get disk usage stats |
| `system:selectFolder` | File picker dialog |

---

## Renderer Process (Frontend)

### State Management

Uses **Zustand** for lightweight, hook-based state management.

#### ScanStore

```typescript
interface ScanState {
  isScanning: boolean;
  progress: ScanProgress | null;
  result: ScanResult | null;
  error: string | null;
  lastScanTime: Date | null;

  startScan(): Promise<void>;
  cancelScan(): void;
  loadCachedResults(): Promise<void>;
}
```

#### ProjectStore

```typescript
interface ProjectState {
  selectedIds: Set<string>;

  toggleSelection(id: string): void;
  selectAll(): void;
  deselectAll(): void;
  selectAllCleanable(): void;
}
```

#### CleanStore

```typescript
interface CleanState {
  isCleaning: boolean;
  isComplete: boolean;
  progress: CleanProgress | null;
  result: CleanResult | null;

  startClean(): Promise<void>;
}
```

#### SettingsStore

```typescript
interface SettingsState {
  settings: Settings;
  isLoading: boolean;

  loadSettings(): Promise<void>;
  updateSettings(partial: DeepPartial<Settings>): Promise<void>;
  resetSettings(): Promise<void>;
}
```

#### UIStore

```typescript
interface UIState {
  currentView: 'dashboard' | 'ecosystem' | 'settings';
  selectedEcosystem: EcosystemId | null;

  setView(view: string): void;
  goToEcosystem(ecosystem: EcosystemId): void;
  goBack(): void;
}
```

---

### Pages

#### Dashboard

Main view showing:
- Disk space visualization
- Total recoverable space stats
- Ecosystem grid cards
- Scan/Clean action bar

#### EcosystemDetail

Per-ecosystem project list with:
- Filtering by status (active, recent, stale, dormant)
- Show/hide protected and empty projects
- Batch selection
- Project actions (open in Finder/VS Code)

#### Settings

Configuration management:
- **General**: Theme, updates, analytics
- **Scanning**: Paths, excludes, symlinks
- **Detection**: Activity thresholds
- **Cleanup**: Trash vs delete, confirmations, sounds
- **Ecosystems**: Enable/disable per ecosystem
- **History**: Deletion log with restore

---

### Components

| Component | Purpose |
|-----------|---------|
| `HeroStats` | Main stats display (size, project count) |
| `DiskSpaceBar` | Visual disk usage bar |
| `EcosystemGrid` | Grid of ecosystem cards |
| `EcosystemCard` | Single ecosystem summary |
| `ScanProgress` | Real-time scan progress |
| `ActionBar` | Primary action buttons |
| `StatusBar` | Bottom status indicator |
| `CleaningOverlay` | Full-screen cleaning progress |
| `ConfettiEffect` | Success celebration |
| `ConfirmCleanDialog` | Cleanup confirmation |

---

## Data Flow

### Scan Flow

```
User clicks "Scan"
       │
       ▼
┌─────────────────┐
│  ActionBar      │──▶ useScan().startScan()
└─────────────────┘
       │
       ▼
┌─────────────────┐
│  ScanStore      │──▶ window.electronAPI.startScan()
└─────────────────┘
       │
       ▼ (IPC)
┌─────────────────┐
│ scannerHandlers │──▶ scannerService.scan(options)
└─────────────────┘
       │
       ▼
┌─────────────────┐    ┌─────────────────┐
│ ScannerService  │───▶│ Ecosystem       │
│  - Discovery    │    │ Plugins         │
│  - Analysis     │    │  - detect()     │
└─────────────────┘    │  - calculateSize│
       │               └─────────────────┘
       │
       ▼ (Progress events)
┌─────────────────┐
│  ScanStore      │──▶ Updates UI
│  setProgress()  │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│  scanCacheRepo  │──▶ Persist results
└─────────────────┘
```

### Clean Flow

```
User selects projects & clicks "Clean"
       │
       ▼
┌─────────────────┐
│ ConfirmDialog   │──▶ User confirms
└─────────────────┘
       │
       ▼
┌─────────────────┐
│  CleanStore     │──▶ window.electronAPI.cleanProjects()
└─────────────────┘
       │
       ▼ (IPC)
┌─────────────────┐
│ cleanerHandlers │──▶ For each project:
└─────────────────┘
       │
       ├──▶ ProtectionAnalyzer.analyze()
       │
       ├──▶ EcosystemPlugin.clean()
       │
       ├──▶ deletionLogRepo.add()
       │
       └──▶ statisticsRepo.recordCleanup()
       │
       ▼ (Progress events)
┌─────────────────┐
│ CleaningOverlay │──▶ Shows progress
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ ConfettiEffect  │──▶ Celebration!
└─────────────────┘
```

---

## Configuration

### Default Settings

```typescript
const defaultSettings = {
  general: {
    startAtLogin: false,
    checkForUpdates: true,
    sendAnalytics: false,
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
      nodejs: true,
      rust: true,
      python: true,
      // ... all ecosystems enabled by default
    },
  },
};
```

---

## Security

### Context Isolation

- Preload script exposes only safe APIs via `contextBridge`
- Renderer cannot access Node.js modules directly
- All filesystem operations go through IPC

### Protection Mechanisms

1. **Git protection**: Projects with uncommitted changes are protected
2. **IDE detection**: Open projects detected via `lsof`
3. **Protected paths**: User-defined paths never cleaned
4. **Activity threshold**: Active projects require confirmation

### Safe Deletion

- Default: Move to Trash (macOS) - fully recoverable
- Deletion log enables restoration via AppleScript
- Dry-run preview before actual deletion

### Process Limits

- Max 50,000 directories per scan (prevents runaway scans)
- Parallel analysis limited to 10 projects (prevents resource exhaustion)
- Timeout on filesystem operations

---

## Development

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Setup

```bash
# Install dependencies
pnpm install

# Run in development
pnpm dev

# Build for production
pnpm build

# Package for distribution
pnpm package
```

### Project Structure Conventions

- **Main process**: TypeScript, no frontend dependencies
- **Renderer**: React + TypeScript, no Node.js APIs
- **Shared**: Types only, no runtime code
- **IPC**: All main-renderer communication via defined channels

---

## License

MIT
