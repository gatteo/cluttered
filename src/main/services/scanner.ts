import { readdir, stat, access } from 'fs/promises'
import { join, basename } from 'path'
import { homedir } from 'os'
import { Project, ScanOptions, ScanProgress, ScanResult, EcosystemId, DetectionSettings } from '../../shared/types'
import { ecosystemRegistry } from '../ecosystems'
import { settingsRepo } from '../database/repositories/settings'
import { BaseService } from './base'

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

    try {
      // Phase 1: Discover projects
      console.log('[ScannerService] Starting discovery phase')
      this.sendProgress({
        phase: 'discovering',
        projectsFound: 0,
        totalSize: 0,
        ecosystemCounts: {},
      })

      // Check if paths are provided, fallback to home directory
      if (!options.paths || options.paths.length === 0) {
        console.warn('[ScannerService] No scan paths provided, falling back to home directory')
        options.paths = [homedir()]
      }

      // Check if ecosystems are provided
      if (!options.ecosystems || options.ecosystems.length === 0) {
        console.error('[ScannerService] ERROR: No ecosystems enabled!')
        console.error('[ScannerService] options.ecosystems =', options.ecosystems)
        // Return empty result
        return this.buildResult([], Date.now() - startTime)
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

      const analyzedProjects = await this.analyzeProjects(this.discoveredProjects)
      console.log('[ScannerService] Analysis complete, analyzed', analyzedProjects.length, 'projects')

      // Build result
      const result = this.buildResult(analyzedProjects, Date.now() - startTime)
      console.log('[ScannerService] Built result:', result.totalProjects, 'projects,', result.totalSize, 'bytes')

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
        // Found a project - don't recurse into it deeply
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
      } else {
        // Not a project root - check subdirectories
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
        } catch {
          // Permission denied or other error - skip
        }
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
    } catch {
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

  private buildResult(projects: Project[], duration: number): ScanResult {
    const ecosystemSummary = this.buildEcosystemSummary(projects)

    return {
      projects,
      totalSize: projects.reduce((sum, p) => sum + p.totalSize, 0),
      totalProjects: projects.length,
      scanDuration: duration,
      ecosystemSummary,
    }
  }

  private buildEcosystemSummary(projects: Project[]) {
    const byEcosystem = new Map<EcosystemId, Project[]>()

    for (const project of projects) {
      const list = byEcosystem.get(project.ecosystem) || []
      list.push(project)
      byEcosystem.set(project.ecosystem, list)
    }

    return Array.from(byEcosystem.entries()).map(([ecosystem, ecosystemProjects]) => ({
      ecosystem,
      projectCount: ecosystemProjects.length,
      totalSize: ecosystemProjects.reduce((sum, p) => sum + p.totalSize, 0),
      cleanableSize: ecosystemProjects.filter((p) => !p.isProtected).reduce((sum, p) => sum + p.totalSize, 0),
    }))
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
