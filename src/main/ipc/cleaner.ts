import { BrowserWindow } from 'electron'
import { shell } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import { basename, dirname } from 'path'
import { access } from 'fs/promises'
import { CleanOptions, CleanResult, DeletionLogEntry, Project } from '../../shared/types'
import { scanCacheRepo } from '../database/repositories/scanCache'
import { deletionLogRepo } from '../database/repositories/deletionLog'
import { statisticsRepo } from '../database/repositories/statistics'
import { settingsRepo } from '../database/repositories/settings'
import { ecosystemRegistry } from '../ecosystems'
import { v4 as uuid } from 'uuid'
import { analyticsService } from '../services/analyticsService'

const execAsync = promisify(exec)

let isCleaning = false

export const cleanerHandlers = {
  async start(mainWindow: BrowserWindow, options: CleanOptions): Promise<CleanResult> {
    console.log('[Cleaner] ========== CLEAN STARTING ==========')
    console.log('[Cleaner] Options:', JSON.stringify(options, null, 2))
    console.log('[Cleaner] Project IDs to clean:', options.projectIds)

    if (isCleaning) {
      console.log('[Cleaner] Already cleaning, rejecting')
      throw new Error('Cleaning already in progress')
    }

    isCleaning = true
    const cleanStartTime = Date.now()

    try {
      const projects = scanCacheRepo.getByIds(options.projectIds)
      console.log('[Cleaner] Found', projects.length, 'projects in cache')

      // Track cleanup started
      const estimatedBytes = projects.reduce((sum, p) => sum + p.totalSize, 0)
      analyticsService.trackCleanupStarted(projects.length, estimatedBytes)
      console.log(
        '[Cleaner] Projects:',
        projects.map((p) => ({ id: p.id, name: p.name, path: p.path }))
      )

      if (projects.length === 0) {
        console.log('[Cleaner] No projects found in cache! Returning empty result.')
        // Debug: check what's in the cache
        const allCached = scanCacheRepo.getAll()
        console.log('[Cleaner] Total projects in cache:', allCached.length)
        if (allCached.length > 0) {
          console.log(
            '[Cleaner] All cached IDs:',
            allCached.map((p) => p.id)
          )
          console.log('[Cleaner] Requested IDs:', options.projectIds)
          // Check if any requested ID partially matches
          for (const reqId of options.projectIds) {
            const match = allCached.find((p) => p.id === reqId)
            console.log(`[Cleaner] ID "${reqId}" match:`, match ? 'FOUND' : 'NOT FOUND')
          }
        }
        return {
          success: true,
          bytesFreed: 0,
          filesDeleted: 0,
          projectsCleaned: [],
          errors: [],
        }
      }

      const settings = settingsRepo.get()
      const protectedPaths = settings.scanning.protectedPaths || []
      console.log('[Cleaner] Protected paths from settings:', protectedPaths)

      // Send initial progress
      if (mainWindow?.webContents) {
        mainWindow.webContents.send('clean:progress', {
          projectsProcessed: 0,
          totalProjects: projects.length,
          bytesFreed: 0,
          filesDeleted: 0,
        })
      }

      const result: CleanResult = {
        success: true,
        bytesFreed: 0,
        filesDeleted: 0,
        projectsCleaned: [],
        errors: [],
      }

      for (let i = 0; i < projects.length; i++) {
        const project = projects[i]
        console.log('[Cleaner] Processing project', i + 1, '/', projects.length, ':', project.name)

        // Check if project is protected
        if (this.isProtected(project, protectedPaths)) {
          console.log('[Cleaner] Project is protected, skipping:', project.protectionReason || 'Protected project')
          result.errors.push({
            projectId: project.id,
            error: project.protectionReason || 'Protected project',
          })
          continue
        }

        try {
          const plugin = ecosystemRegistry.get(project.ecosystem)
          if (!plugin) {
            console.log('[Cleaner] Unknown ecosystem:', project.ecosystem)
            result.errors.push({
              projectId: project.id,
              error: `Unknown ecosystem: ${project.ecosystem}`,
            })
            continue
          }

          console.log('[Cleaner] Cleaning with plugin:', project.ecosystem, 'dryRun:', options.dryRun)

          // Perform actual cleaning via the ecosystem plugin
          const cleanResult = await plugin.clean(project.path, {
            dryRun: options.dryRun,
            moveToTrash: options.moveToTrash,
          })

          console.log('[Cleaner] Clean result:', cleanResult)

          result.bytesFreed += cleanResult.bytesFreed
          result.filesDeleted += cleanResult.filesDeleted
          result.projectsCleaned.push(project.id)

          // Log deletion for restore capability (only if not dry run)
          if (!options.dryRun) {
            deletionLogRepo.add({
              id: uuid(),
              timestamp: new Date(),
              projectPath: project.path,
              projectName: project.name,
              ecosystem: project.ecosystem,
              artifacts: project.artifacts.map((a) => a.path),
              totalSize: cleanResult.bytesFreed,
            })
          }

          // Send progress update
          if (mainWindow?.webContents) {
            mainWindow.webContents.send('clean:progress', {
              currentProject: project.name,
              projectsProcessed: i + 1,
              totalProjects: projects.length,
              bytesFreed: result.bytesFreed,
              filesDeleted: result.filesDeleted,
            })
          }
        } catch (error) {
          result.errors.push({
            projectId: project.id,
            error: String(error),
          })
        }
      }

      // Update statistics (only if not dry run)
      if (!options.dryRun && result.bytesFreed > 0) {
        statisticsRepo.recordCleanup(result.bytesFreed, result.projectsCleaned.length)
      }

      // Remove cleaned projects from cache (only if not dry run)
      if (!options.dryRun) {
        scanCacheRepo.removeByIds(result.projectsCleaned)
      }

      // Send final progress
      if (mainWindow?.webContents) {
        mainWindow.webContents.send('clean:progress', {
          projectsProcessed: projects.length,
          totalProjects: projects.length,
          bytesFreed: result.bytesFreed,
          filesDeleted: result.filesDeleted,
        })
      }

      // Track cleanup completed (only if not dry run)
      if (!options.dryRun) {
        analyticsService.trackCleanupCompleted(result.projectsCleaned.length, result.bytesFreed, Date.now() - cleanStartTime)
      }

      console.log('[Cleaner] Final result being returned:', result)
      return result
    } catch (error) {
      // Track cleanup failed
      analyticsService.trackCleanupFailed(error instanceof Error ? error.name : 'UnknownError', options.projectIds.length)
      throw error
    } finally {
      isCleaning = false
    }
  },

  isProtected(project: Project, protectedPaths: string[]): boolean {
    // Only check if project is in user-configured protected paths
    // Note: We no longer block projects with uncommitted changes here
    // because the UI now shows a confirmation modal and lets the user proceed
    console.log('[Cleaner] isProtected check for:', project.path)
    console.log('[Cleaner] Against protected paths:', protectedPaths)
    for (const protectedPath of protectedPaths) {
      if (project.path.startsWith(protectedPath)) {
        console.log('[Cleaner] Project matches protected path:', protectedPath)
        return true
      }
    }

    console.log('[Cleaner] Project is NOT protected')
    return false
  },

  async preview(options: CleanOptions): Promise<CleanResult> {
    // For preview, calculate sizes without actually deleting
    const projects = scanCacheRepo.getByIds(options.projectIds)

    const result: CleanResult = {
      success: true,
      bytesFreed: 0,
      filesDeleted: 0,
      projectsCleaned: [],
      errors: [],
    }

    for (const project of projects) {
      const plugin = ecosystemRegistry.get(project.ecosystem)
      if (!plugin) continue

      try {
        const { totalSize, artifacts } = await plugin.calculateSize(project.path)
        result.bytesFreed += totalSize
        result.filesDeleted += artifacts.length
        result.projectsCleaned.push(project.id)
      } catch (error) {
        console.warn(`[Cleaner] Failed to calculate size for project ${project.path}:`, error)
      }
    }

    return result
  },

  getDeletionLog(): DeletionLogEntry[] {
    return deletionLogRepo.getRecent(30)
  },

  async cleanGlobalCaches(
    cacheIds: string[]
  ): Promise<{ success: boolean; bytesFreed: number; pathsCleaned: string[]; errors: string[] }> {
    console.log('[Cleaner] ========== CLEAN GLOBAL CACHES ==========')
    console.log('[Cleaner] Cache IDs to clean:', cacheIds.length)

    if (isCleaning) {
      throw new Error('Cleaning already in progress')
    }

    isCleaning = true

    const result = {
      success: true,
      bytesFreed: 0,
      pathsCleaned: [] as string[],
      errors: [] as string[],
    }

    try {
      // Look up cache items from the database (trusted source)
      const items = scanCacheRepo.getGlobalCachesByIds(cacheIds)
      console.log('[Cleaner] Found', items.length, 'caches in database')

      for (const item of items) {
        try {
          if (item.cleanCommand) {
            // Use custom clean command (e.g., xcrun simctl runtime delete)
            console.log(`[Cleaner] Running clean command: ${item.cleanCommand}`)
            await execAsync(item.cleanCommand, { timeout: 120000 })

            result.bytesFreed += item.size
            result.pathsCleaned.push(item.path)
            console.log(`[Cleaner] Successfully cleaned via command: ${item.path}`)
          } else {
            // Default: move directory to trash
            await access(item.path)

            const { stdout } = await execAsync(`du -sk "${item.path}" 2>/dev/null`)
            const sizeKB = parseInt(stdout.split('\t')[0], 10)
            const size = !isNaN(sizeKB) ? sizeKB * 1024 : 0

            console.log(`[Cleaner] Moving to trash: ${item.path} (${size} bytes)`)
            await shell.trashItem(item.path)

            result.bytesFreed += size
            result.pathsCleaned.push(item.path)
            console.log(`[Cleaner] Successfully cleaned: ${item.path}`)
          }
        } catch (error) {
          console.error(`[Cleaner] Failed to clean ${item.path}:`, error)
          result.errors.push(`${item.path}: ${String(error)}`)
        }
      }

      // Update statistics
      if (result.bytesFreed > 0) {
        statisticsRepo.recordCleanup(result.bytesFreed, 0)
      }

      console.log(`[Cleaner] Global cache clean complete. Freed ${result.bytesFreed} bytes`)
      return result
    } finally {
      isCleaning = false
    }
  },

  async restore(entryId: string): Promise<boolean> {
    const entry = deletionLogRepo.getById(entryId)
    if (!entry) {
      return false
    }

    try {
      // Attempt to restore files from Trash using AppleScript (macOS)
      for (const artifactPath of entry.artifacts) {
        const filename = basename(artifactPath)
        const targetDir = dirname(artifactPath)

        // Use AppleScript to restore from Trash
        const script = `
          tell application "Finder"
            set trashItems to every item of trash whose name is "${filename}"
            if (count of trashItems) > 0 then
              move item 1 of trashItems to POSIX file "${targetDir}"
              return "restored"
            else
              return "not_found"
            end if
          end tell
        `

        try {
          const { stdout } = await execAsync(`osascript -e '${script}'`)
          if (stdout.trim() === 'not_found') {
            console.warn(`Could not find ${filename} in Trash`)
          }
        } catch (scriptError) {
          console.error(`Failed to restore ${filename}:`, scriptError)
          // Continue trying to restore other artifacts
        }
      }

      // Remove entry from deletion log after restoration attempt
      deletionLogRepo.delete(entryId)
      return true
    } catch (error) {
      console.error('Restore failed:', error)
      throw new Error('Failed to restore from Trash. Please restore manually from Finder.')
    }
  },
}
