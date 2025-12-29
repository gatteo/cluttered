import { BrowserWindow } from 'electron'
import { ScanOptions, ScanResult } from '../../shared/types'
import { scannerService } from '../services/scanner'
import { scanCacheRepo } from '../database/repositories/scanCache'
import { settingsRepo } from '../database/repositories/settings'
import { BaseService } from '../services/base'
import { analyticsService } from '../services/analyticsService'

export const scannerHandlers = {
  async start(mainWindow: BrowserWindow, customOptions?: Partial<ScanOptions>): Promise<ScanResult> {
    console.log('[Scanner] ========== SCAN STARTING ==========')

    // Set main window for progress updates
    BaseService.setMainWindow(mainWindow)

    const settings = settingsRepo.get()
    console.log('[Scanner] Full settings:', JSON.stringify(settings, null, 2))

    const ecosystems = Object.entries(settings.ecosystems.enabled)
      .filter(([_, enabled]) => enabled)
      .map(([id]) => id)
    console.log('[Scanner] Enabled ecosystems:', ecosystems)

    const options: ScanOptions = {
      paths: customOptions?.paths ?? settings.scanning.scanPaths,
      excludePaths: settings.scanning.excludePaths,
      ecosystems: ecosystems as ScanOptions['ecosystems'],
      followSymlinks: settings.scanning.followSymlinks,
    }

    console.log('[Scanner] Final options:', JSON.stringify(options, null, 2))
    console.log('[Scanner] Paths to scan:', options.paths)
    console.log('[Scanner] Paths length:', options.paths?.length ?? 0)

    // Track scan started
    const scanStartTime = Date.now()
    analyticsService.trackScanStarted(options.paths?.length ?? 0)

    try {
      const result = await scannerService.scan(options)
      console.log('[Scanner] Scan complete. Found', result.projects.length, 'projects,', result.totalSize, 'bytes')

      // Track scan completed
      const ecosystemIds = [...new Set(result.projects.map((p) => p.ecosystem))]
      analyticsService.trackScanCompleted(
        Date.now() - scanStartTime,
        result.projects.length,
        result.totalSize,
        ecosystemIds
      )

      // Cache results
      console.log('[Scanner] Clearing cache and saving', result.projects.length, 'projects')
      scanCacheRepo.clear()
      if (result.projects.length > 0) {
        scanCacheRepo.saveProjects(result.projects)
        console.log(
          '[Scanner] Projects saved to cache. Sample IDs:',
          result.projects.slice(0, 3).map((p) => p.id)
        )
      }

      // Verify cache was populated
      const cachedCount = scanCacheRepo.getProjectCount()
      console.log('[Scanner] Verified cache contains', cachedCount, 'projects')

      return result
    } catch (error) {
      console.error('[Scanner] Scan error:', error)
      throw error
    }
  },

  cancel() {
    scannerService.cancel()
  },

  getCached() {
    const projects = scanCacheRepo.getAll()
    const lastScanTime = scanCacheRepo.getLastScanTime()

    return {
      projects,
      lastScanTime,
    }
  },
}
