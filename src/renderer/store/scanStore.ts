import { create } from 'zustand'
import { soundManager } from '../services/soundManager'

interface ScanProgress {
  phase: 'discovering' | 'analyzing' | 'complete'
  currentPath?: string
  projectsFound: number
  totalSize: number
  ecosystemCounts?: Record<string, number>
  estimatedTimeRemaining?: number
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
  artifacts: Array<{
    pattern: string
    description: string
    size: number
    path: string
  }>
}

interface EcosystemSummary {
  ecosystem: string
  projectCount: number
  totalSize: number
  cleanableSize: number
}

interface GlobalCache {
  id: string
  category: 'package-manager' | 'dev-tool' | 'mobile-dev'
  name: string
  description: string
  icon: string
  path: string
  size: number
  alwaysSafe: boolean
  cleanCommand?: string
  cautionNote?: string
}

interface ScanResult {
  projects: Project[]
  globalCaches: GlobalCache[]
  totalSize: number
  globalCachesSize: number
  totalProjects: number
  scanDuration: number
  ecosystemSummary: EcosystemSummary[]
}

interface ScanState {
  isScanning: boolean
  progress: ScanProgress | null
  result: ScanResult | null
  error: string | null
  lastScanTime: Date | null

  // Global cache selection
  selectedGlobalCacheIds: Set<string>

  // Actions
  startScan: () => Promise<void>
  cancelScan: () => void
  loadCachedResults: () => Promise<void>
  removeCleanedProjects: (projectIds: string[]) => void
  removeCleanedGlobalCaches: (paths: string[]) => void
  toggleGlobalCacheSelection: (id: string) => void
  deselectAllGlobalCaches: () => void
  setProgress: (progress: ScanProgress) => void
  setResult: (result: ScanResult) => void
  setError: (error: string) => void
  reset: () => void
}

/**
 * Build ecosystem summary from projects list
 */
function buildEcosystemSummary(projects: Project[]): EcosystemSummary[] {
  const ecosystemMap = new Map<string, { projectCount: number; totalSize: number; cleanableSize: number }>()

  for (const project of projects) {
    const existing = ecosystemMap.get(project.ecosystem) || { projectCount: 0, totalSize: 0, cleanableSize: 0 }
    existing.projectCount += 1
    existing.totalSize += project.totalSize
    if (!project.isProtected) {
      existing.cleanableSize += project.totalSize
    }
    ecosystemMap.set(project.ecosystem, existing)
  }

  return Array.from(ecosystemMap.entries()).map(([ecosystem, data]) => ({
    ecosystem,
    ...data,
  }))
}

export const useScanStore = create<ScanState>((set, get) => ({
  isScanning: false,
  progress: null,
  result: null,
  error: null,
  lastScanTime: null,
  selectedGlobalCacheIds: new Set<string>(),

  startScan: async () => {
    set({ isScanning: true, error: null, progress: null })
    soundManager.play('scan-start')

    try {
      console.log('[Scan] Starting scan...')
      const result = await window.electronAPI.startScan()
      console.log('[Scan] Scan complete:', result)

      if (!result || !result.projects) {
        console.error('[Scan] Invalid result:', result)
        set({ error: 'Scan returned invalid result', isScanning: false })
        return
      }

      const projects = result.projects as unknown as Project[]
      const globalCaches = (result.globalCaches ?? []) as unknown as GlobalCache[]
      const ecosystemSummary = buildEcosystemSummary(projects)

      set({
        result: {
          ...result,
          projects,
          globalCaches,
          globalCachesSize: result.globalCachesSize ?? 0,
          ecosystemSummary: ecosystemSummary.length > 0 ? ecosystemSummary : result.ecosystemSummary,
        },
        isScanning: false,
        lastScanTime: new Date(),
      })
      soundManager.play('scan-complete')
    } catch (error) {
      console.error('[Scan] Error:', error)
      set({ error: String(error), isScanning: false })
    }
  },

  cancelScan: () => {
    window.electronAPI.cancelScan()
    set({ isScanning: false })
  },

  loadCachedResults: async () => {
    // Skip if we already have a result from a live scan in this session
    if (get().result) return

    try {
      const cached = await window.electronAPI.getCachedResults()
      if (cached.projects.length > 0 || (cached.globalCaches && cached.globalCaches.length > 0)) {
        const projects = cached.projects as unknown as Project[]
        const globalCaches = ((cached.globalCaches as unknown as GlobalCache[]) ?? [])
        const ecosystemSummary = buildEcosystemSummary(projects)

        set({
          result: {
            projects,
            globalCaches,
            totalSize: projects.reduce((sum, p) => sum + p.totalSize, 0),
            globalCachesSize: globalCaches.reduce((sum, c) => sum + c.size, 0),
            totalProjects: projects.length,
            scanDuration: 0,
            ecosystemSummary,
          },
          lastScanTime: cached.lastScanTime ? new Date(cached.lastScanTime) : null,
        })
      }
    } catch (error) {
      console.error('Failed to load cached results:', error)
    }
  },

  removeCleanedProjects: (projectIds: string[]) => {
    const { result } = get()
    if (!result) return

    const idsToRemove = new Set(projectIds)
    const remainingProjects = result.projects.filter((p) => !idsToRemove.has(p.id))
    const ecosystemSummary = buildEcosystemSummary(remainingProjects)

    set({
      result: {
        ...result,
        projects: remainingProjects,
        totalSize: remainingProjects.reduce((sum, p) => sum + p.totalSize, 0),
        totalProjects: remainingProjects.length,
        ecosystemSummary,
      },
    })
  },

  toggleGlobalCacheSelection: (id: string) => {
    const selected = new Set(get().selectedGlobalCacheIds)
    if (selected.has(id)) {
      selected.delete(id)
    } else {
      selected.add(id)
    }
    set({ selectedGlobalCacheIds: selected })
  },

  deselectAllGlobalCaches: () => set({ selectedGlobalCacheIds: new Set() }),

  removeCleanedGlobalCaches: (paths: string[]) => {
    const { result } = get()
    if (!result) return

    const pathsToRemove = new Set(paths)
    const remainingCaches = result.globalCaches.filter((c) => !pathsToRemove.has(c.path))

    set({
      result: {
        ...result,
        globalCaches: remainingCaches,
        globalCachesSize: remainingCaches.reduce((sum, c) => sum + c.size, 0),
      },
    })
  },

  setProgress: (progress) => set({ progress }),
  setResult: (result) => set({ result, isScanning: false }),
  setError: (error) => set({ error, isScanning: false }),
  reset: () => set({ isScanning: false, progress: null, result: null, error: null }),
}))

// Set up progress listener
if (typeof window !== 'undefined' && window.electronAPI) {
  console.log('[ScanStore] Setting up progress listener')
  window.electronAPI.onScanProgress((progress) => {
    console.log('[ScanStore] Progress received:', progress)
    useScanStore.getState().setProgress(progress)
  })
}
