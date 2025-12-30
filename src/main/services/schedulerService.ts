import { Notification, BrowserWindow } from 'electron'
import { scheduledScanRepo, ScheduledScanSettings } from '../database/repositories/scheduledScan'
import { settingsRepo } from '../database/repositories/settings'
import { scannerService } from './scanner'
import { autoCleanService } from './autoCleanService'
import { licenseService } from './licensing/licenseService'
import { formatBytes } from '../utils/format'
import { ScanOptions } from '../../shared/types'

class SchedulerService {
  private checkInterval: NodeJS.Timeout | null = null
  private isRunning = false

  /**
   * Start the scheduler. Call once at app startup.
   */
  start(): void {
    if (this.checkInterval) return

    console.log('[Scheduler] Starting...')

    // Check every 15 minutes if a scan is due
    this.checkInterval = setInterval(() => this.checkSchedule(), 15 * 60 * 1000)

    // Also check immediately on start (after 5 seconds)
    setTimeout(() => this.checkSchedule(), 5000)
  }

  /**
   * Stop the scheduler.
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
      console.log('[Scheduler] Stopped')
    }
  }

  /**
   * Check if a scheduled scan should run now.
   */
  private async checkSchedule(): Promise<void> {
    // Only for Pro users
    if (!licenseService.isPro()) {
      return
    }

    const settings = scheduledScanRepo.get()
    if (!settings.enabled) {
      return
    }

    if (this.isRunning) {
      console.log('[Scheduler] Scan already in progress, skipping')
      return
    }

    if (this.shouldRunNow(settings)) {
      await this.runScheduledScan(settings)
    }
  }

  /**
   * Determine if scan should run based on settings.
   */
  private shouldRunNow(settings: ScheduledScanSettings): boolean {
    const now = new Date()
    const lastRun = settings.lastRunAt

    // Check if it's the right time of day (within 30 min window)
    const targetMinutes = settings.timeHour * 60 + settings.timeMinute
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const timeDiff = Math.abs(currentMinutes - targetMinutes)

    if (timeDiff > 30) {
      return false // Not the right time
    }

    // Check frequency
    if (!lastRun) {
      return true // Never run before
    }

    const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60)

    switch (settings.frequency) {
      case 'daily':
        return hoursSinceLastRun >= 20 // At least 20 hours ago

      case 'weekly':
        if (hoursSinceLastRun < 144) return false // Less than 6 days
        return now.getDay() === settings.dayOfWeek

      case 'monthly':
        if (hoursSinceLastRun < 672) return false // Less than 28 days
        return now.getDate() === 1 // First of month

      default:
        return false
    }
  }

  /**
   * Run the scheduled scan.
   */
  private async runScheduledScan(settings: ScheduledScanSettings): Promise<void> {
    console.log('[Scheduler] Running scheduled scan...')
    this.isRunning = true

    try {
      // Build scan options from user settings
      const userSettings = settingsRepo.get()
      const ecosystems = Object.entries(userSettings.ecosystems.enabled)
        .filter(([_, enabled]) => enabled)
        .map(([id]) => id)

      const scanOptions: ScanOptions = {
        paths: userSettings.scanning.scanPaths,
        excludePaths: userSettings.scanning.excludePaths,
        ecosystems: ecosystems as ScanOptions['ecosystems'],
        followSymlinks: userSettings.scanning.followSymlinks,
      }

      const result = await scannerService.scan(scanOptions)

      scheduledScanRepo.updateLastRun()

      // Notify if cleanable space exceeds threshold
      if (result.totalSize >= settings.notifyThresholdBytes) {
        this.showNotification(result.totalSize, result.totalProjects)
      }

      console.log(`[Scheduler] Scan complete: ${result.totalProjects} projects, ${formatBytes(result.totalSize)} cleanable`)

      // Run auto-clean if enabled
      if (autoCleanService.shouldRun()) {
        console.log('[Scheduler] Triggering auto-clean...')
        await autoCleanService.run()
      }
    } catch (error) {
      console.error('[Scheduler] Scan failed:', error)
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Show system notification for cleanable space.
   */
  private showNotification(bytes: number, projectCount: number): void {
    const notification = new Notification({
      title: 'Disk space recoverable',
      body: `Cluttered found ${formatBytes(bytes)} across ${projectCount} projects.`,
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

  /**
   * Manually trigger a scheduled scan (for testing).
   */
  async runNow(): Promise<void> {
    if (!licenseService.isPro()) {
      throw new Error('Scheduled scans require Pro')
    }

    const settings = scheduledScanRepo.get()
    await this.runScheduledScan(settings)
  }
}

export const schedulerService = new SchedulerService()
