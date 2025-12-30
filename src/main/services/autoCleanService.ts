import { Notification, BrowserWindow } from 'electron'
import { autoCleanRepo, AutoCleanSettings } from '../database/repositories/autoClean'
import { scanCacheRepo } from '../database/repositories/scanCache'
import { cleanerService } from './cleaner'
import { licenseService } from './licensing/licenseService'
import { formatBytes } from '../utils/format'
import { Project, CleanOptions } from '../../shared/types'

class AutoCleanService {
  /**
   * Run automatic cleaning of dormant projects.
   * Called by scheduler after scheduled scans complete.
   */
  async run(): Promise<{ bytesFreed: number; projectsCleaned: number } | null> {
    // Only for Pro users
    if (!licenseService.isPro()) {
      console.log('[AutoClean] Skipping - not Pro')
      return null
    }

    const settings = autoCleanRepo.get()
    if (!settings.enabled) {
      console.log('[AutoClean] Skipping - disabled')
      return null
    }

    console.log('[AutoClean] Starting auto-clean...')

    // Get dormant projects from cache
    const allProjects = scanCacheRepo.getAll()
    const dormantProjects = allProjects.filter(
      (p) => p.status === 'dormant' && !p.isProtected && !p.hasUncommittedChanges
    )

    if (dormantProjects.length === 0) {
      console.log('[AutoClean] No dormant projects to clean')
      return { bytesFreed: 0, projectsCleaned: 0 }
    }

    // Sort by last modified (oldest first) and select up to max bytes
    const sortedProjects = dormantProjects.sort(
      (a, b) => a.lastModified.getTime() - b.lastModified.getTime()
    )

    const projectsToClean: Project[] = []
    let totalBytes = 0

    for (const project of sortedProjects) {
      if (totalBytes + project.totalSize <= settings.maxBytesPerRun) {
        projectsToClean.push(project)
        totalBytes += project.totalSize
      }
    }

    if (projectsToClean.length === 0) {
      console.log('[AutoClean] No projects within byte limit')
      return { bytesFreed: 0, projectsCleaned: 0 }
    }

    console.log(`[AutoClean] Cleaning ${projectsToClean.length} dormant projects...`)

    // Clean the projects (use trash, not permanent delete)
    const cleanOptions: CleanOptions = {
      projectIds: projectsToClean.map((p) => p.id),
      dryRun: false,
      moveToTrash: true,
    }

    const result = await cleanerService.clean(projectsToClean, cleanOptions)

    // Update last run time
    autoCleanRepo.updateLastRun()

    // Remove cleaned projects from cache
    scanCacheRepo.removeByIds(result.projectsCleaned)

    // Show notification if enabled
    if (settings.showNotification && result.bytesFreed > 0) {
      this.showNotification(result.bytesFreed, result.projectsCleaned.length)
    }

    console.log(
      `[AutoClean] Complete: ${result.projectsCleaned.length} projects, ${formatBytes(result.bytesFreed)} freed`
    )

    return {
      bytesFreed: result.bytesFreed,
      projectsCleaned: result.projectsCleaned.length,
    }
  }

  /**
   * Check if auto-clean should run based on settings.
   */
  shouldRun(): boolean {
    if (!licenseService.isPro()) return false

    const settings = autoCleanRepo.get()
    return settings.enabled
  }

  /**
   * Get auto-clean settings.
   */
  getSettings(): AutoCleanSettings {
    return autoCleanRepo.get()
  }

  /**
   * Save auto-clean settings.
   */
  saveSettings(settings: Partial<AutoCleanSettings>): AutoCleanSettings {
    return autoCleanRepo.save(settings)
  }

  /**
   * Show notification about auto-cleaned projects.
   */
  private showNotification(bytesFreed: number, projectCount: number): void {
    const notification = new Notification({
      title: 'Dormant projects cleaned',
      body: `Auto-cleaned ${projectCount} dormant project${projectCount > 1 ? 's' : ''}, freeing ${formatBytes(bytesFreed)}.`,
      silent: false,
    })

    notification.on('click', () => {
      // Bring app to front when clicked
      const mainWindow = BrowserWindow.getAllWindows()[0]
      if (mainWindow) {
        mainWindow.show()
        mainWindow.focus()
      }
    })

    notification.show()
  }
}

export const autoCleanService = new AutoCleanService()
