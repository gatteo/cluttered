import { readdir, access } from 'fs/promises'
import { join, basename } from 'path'
import { homedir } from 'os'
import { Project, ScanOptions, ScanProgress, ScanResult, EcosystemId } from '../../shared/types'
import { buildEcosystemSummary } from '../../shared/utils'
import { ecosystemRegistry } from '../ecosystems'
import { settingsRepo } from '../database/repositories/settings'
import { BaseService } from './base'
import { sandboxService, isMASBuild } from './sandboxService'
import { discoverGlobalCaches } from './globalCacheScanner'

export class ScannerService extends BaseService {
  private isScanning = false
  private shouldCancel = false
  private discoveredProjects: Project[] = []

  async scan(options: ScanOptions): Promise<ScanResult> {
    console.log('[ScannerService] scan() called with options:', JSON.stringify(options, null, 2))

    if (this.isScanning) {
      console.log('[ScannerService] Scan already in progress, rejecting')
      throw new Error('Scan already in progress')
    }

    this.isScanning = true
    this.shouldCancel = false
    this.discoveredProjects = []

    const startTime = Date.now()

    // Start accessing security-scoped bookmarks for MAS builds
    if (isMASBuild()) {
      sandboxService.startAccessingBookmarks()
    }

    try {
      // Phase 1: Discover projects
      console.log('[ScannerService] Starting discovery phase')
      this.sendProgress({
        phase: 'discovering',
        projectsFound: 0,
        totalSize: 0,
        ecosystemCounts: {},
      })

      // Check if paths are provided
      if (!options.paths || options.paths.length === 0) {
        if (isMASBuild()) {
          // For MAS builds, we can't access home directory without user selection
          console.warn('[ScannerService] No scan paths provided for MAS build')
          return this.buildResult([], [], Date.now() - startTime)
        }
        console.warn('[ScannerService] No scan paths provided, falling back to home directory')
        options.paths = [homedir()]
      }

      // Check if ecosystems are provided
      if (!options.ecosystems || options.ecosystems.length === 0) {
        console.error('[ScannerService] ERROR: No ecosystems enabled!')
        console.error('[ScannerService] options.ecosystems =', options.ecosystems)
        // Return empty result
        return this.buildResult([], [], Date.now() - startTime)
      }

      console.log('[ScannerService] Will detect these ecosystems:', options.ecosystems)

      // Expand ~ to home directory
      const expandedPaths = options.paths.map((p) => (p.startsWith('~/') ? join(homedir(), p.slice(2)) : p === '~' ? homedir() : p))
      console.log('[ScannerService] Expanded paths:', expandedPaths)
      console.log('[ScannerService] Home directory:', homedir())

      for (const scanPath of expandedPaths) {
        if (this.shouldCancel) break
        console.log('[ScannerService] Scanning path:', scanPath)

        // Check if path exists and is accessible
        try {
          await access(scanPath)
        } catch (err) {
          console.error('[ScannerService] Cannot access path:', scanPath, err)
          continue
        }

        await this.discoverProjects(scanPath, options)
        console.log('[ScannerService] Finished scanning path:', scanPath, 'found', this.discoveredProjects.length, 'projects so far')
      }

      // Phase 2: Analyze projects in parallel
      console.log('[ScannerService] Starting analysis phase for', this.discoveredProjects.length, 'projects')
      this.sendProgress({
        phase: 'analyzing',
        projectsFound: this.discoveredProjects.length,
        totalSize: 0,
        ecosystemCounts: this.getEcosystemCounts(),
      })

      const [analyzedProjects, globalCaches] = await Promise.all([this.analyzeProjects(this.discoveredProjects), discoverGlobalCaches()])
      console.log('[ScannerService] Analysis complete, analyzed', analyzedProjects.length, 'projects,', globalCaches.length, 'global caches')

      // Build result
      const result = this.buildResult(analyzedProjects, globalCaches, Date.now() - startTime)
      console.log(
        '[ScannerService] Built result:',
        result.totalProjects,
        'projects,',
        result.totalSize,
        'bytes,',
        result.globalCachesSize,
        'bytes global caches'
      )

      this.sendProgress({
        phase: 'complete',
        projectsFound: result.totalProjects,
        totalSize: result.totalSize,
        ecosystemCounts: this.getEcosystemCounts(),
      })

      return result
    } catch (error) {
      console.error('[ScannerService] Scan error:', error)
      throw error
    } finally {
      // Stop accessing security-scoped bookmarks for MAS builds
      if (isMASBuild()) {
        sandboxService.stopAccessingBookmarks()
      }
      this.isScanning = false
      console.log('[ScannerService] Scan finished, isScanning reset to false')
    }
  }

  cancel() {
    this.shouldCancel = true
  }

  private async discoverProjects(rootPath: string, options: ScanOptions) {
    const queue: string[] = [rootPath]
    const visited = new Set<string>()
    let directoriesScanned = 0
    const MAX_DIRECTORIES = 50000 // Safety limit

    while (queue.length > 0 && !this.shouldCancel) {
      if (directoriesScanned >= MAX_DIRECTORIES) {
        console.warn('[ScannerService] Reached max directory limit, stopping discovery')
        break
      }

      const currentPath = queue.shift()!

      if (visited.has(currentPath)) continue
      visited.add(currentPath)
      directoriesScanned++

      // Log progress every 100 directories
      if (directoriesScanned % 100 === 0) {
        console.log('[ScannerService] Scanned', directoriesScanned, 'directories, queue size:', queue.length)
      }

      // Skip excluded paths
      if (this.shouldExclude(currentPath, options.excludePaths)) continue

      // Check if this is a project root for any ecosystem
      const ecosystem = await this.detectEcosystem(currentPath, options.ecosystems)

      if (ecosystem) {
        // Found a project - register it
        console.log('[ScannerService] Found project:', currentPath, 'ecosystem:', ecosystem)
        const project = await this.createProjectStub(currentPath, ecosystem)
        this.discoveredProjects.push(project)

        this.sendProgress({
          phase: 'discovering',
          currentPath: currentPath,
          projectsFound: this.discoveredProjects.length,
          totalSize: 0,
          ecosystemCounts: this.getEcosystemCounts(),
        })
      }

      // Always check subdirectories (even for discovered projects, to find nested/monorepo projects)
      try {
        const entries = await readdir(currentPath, { withFileTypes: true })

        for (const entry of entries) {
          if (!entry.isDirectory()) continue
          if (entry.name.startsWith('.')) continue // Skip hidden dirs
          if (this.isSystemDirectory(entry.name)) continue

          const subPath = join(currentPath, entry.name)

          // Handle symlinks
          if (entry.isSymbolicLink() && !options.followSymlinks) continue

          queue.push(subPath)
        }
      } catch (error) {
        // Log but continue - permission denied or other filesystem error
        console.warn(`[ScannerService] Cannot read directory ${currentPath}:`, error)
      }
    }

    console.log('[ScannerService] Discovery finished:', directoriesScanned, 'directories scanned')
  }

  private async detectEcosystem(path: string, enabledEcosystems: EcosystemId[]): Promise<EcosystemId | null> {
    for (const ecosystemId of enabledEcosystems) {
      const plugin = ecosystemRegistry.get(ecosystemId)
      if (plugin && (await plugin.detect(path))) {
        return ecosystemId
      }
    }
    return null
  }

  private async createProjectStub(path: string, ecosystem: EcosystemId): Promise<Project> {
    return {
      id: this.generateId(path),
      path,
      name: basename(path),
      ecosystem,
      status: 'stale', // Will be updated in analysis phase
      lastModified: new Date(),
      hasUncommittedChanges: false,
      isProtected: false,
      totalSize: 0,
      artifacts: [],
    }
  }

  private async analyzeProjects(projects: Project[]): Promise<Project[]> {
    const CONCURRENCY = 10
    const results: Project[] = []

    for (let i = 0; i < projects.length; i += CONCURRENCY) {
      if (this.shouldCancel) break

      const batch = projects.slice(i, i + CONCURRENCY)
      const analyzed = await Promise.all(batch.map((p) => this.analyzeProject(p)))

      results.push(...analyzed)

      const totalSize = results.reduce((sum, p) => sum + p.totalSize, 0)
      this.sendProgress({
        phase: 'analyzing',
        currentPath: batch[batch.length - 1]?.path,
        projectsFound: projects.length,
        totalSize,
        ecosystemCounts: this.getEcosystemCounts(),
      })
    }

    return results
  }

  private async analyzeProject(project: Project): Promise<Project> {
    const plugin = ecosystemRegistry.get(project.ecosystem)
    if (!plugin) return project

    try {
      // Get activity info
      const activity = await plugin.analyzeActivity(project.path)

      // Calculate cleanable size
      const { totalSize, artifacts } = await plugin.calculateSize(project.path)

      return {
        ...project,
        lastModified: activity.lastModified,
        lastGitCommit: activity.lastGitCommit,
        hasUncommittedChanges: activity.hasUncommittedChanges,
        status: this.classifyStatus(activity.lastModified),
        isProtected: activity.hasUncommittedChanges,
        protectionReason: activity.hasUncommittedChanges ? 'Uncommitted git changes' : undefined,
        totalSize,
        artifacts,
      }
    } catch (error) {
      console.warn(`[ScannerService] Failed to analyze project ${project.path}:`, error)
      return project
    }
  }

  private classifyStatus(lastModified: Date): Project['status'] {
    const now = Date.now()
    const diffDays = (now - lastModified.getTime()) / (1000 * 60 * 60 * 24)

    // Use configurable thresholds from settings
    const settings = settingsRepo.get()
    const thresholds = settings.detection

    if (diffDays < thresholds.activeThresholdDays) return 'active'
    if (diffDays < thresholds.recentThresholdDays) return 'recent'
    if (diffDays < thresholds.staleThresholdDays) return 'stale'
    return 'dormant'
  }

  private shouldExclude(path: string, excludePaths: string[]): boolean {
    return excludePaths.some((exclude) => path.startsWith(exclude) || path.includes(exclude))
  }

  private isSystemDirectory(name: string): boolean {
    const systemDirs = [
      'node_modules',
      'target',
      'build',
      'dist',
      '.git',
      'Library',
      'Applications',
      'System',
      'Volumes',
      '.Trash',
      '.npm',
      '.cargo',
      '.rustup',
      '.local',
      '.cache',
      'Pictures',
      'Music',
      'Movies',
      'Downloads',
    ]
    return systemDirs.includes(name)
  }

  private getEcosystemCounts(): Partial<Record<EcosystemId, number>> {
    const counts: Partial<Record<EcosystemId, number>> = {}
    for (const project of this.discoveredProjects) {
      counts[project.ecosystem] = (counts[project.ecosystem] || 0) + 1
    }
    return counts
  }

  private buildResult(projects: Project[], globalCaches: import('../../shared/types').GlobalCache[], duration: number): ScanResult {
    const ecosystemSummary = buildEcosystemSummary(projects)

    return {
      projects,
      globalCaches,
      totalSize: projects.reduce((sum, p) => sum + p.totalSize, 0),
      globalCachesSize: globalCaches.reduce((sum, c) => sum + c.size, 0),
      totalProjects: projects.length,
      scanDuration: duration,
      ecosystemSummary,
    }
  }

  private sendProgress(progress: ScanProgress) {
    this.sendToRenderer('scan:progress', progress)
  }

  private generateId(path: string): string {
    // Simple hash of path
    let hash = 0
    for (let i = 0; i < path.length; i++) {
      const char = path.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return `project_${Math.abs(hash).toString(16)}`
  }
}

// Singleton instance
export const scannerService = new ScannerService()
