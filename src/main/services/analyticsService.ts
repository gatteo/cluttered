import { app } from 'electron'
import os from 'os'
import { analytics } from '../../shared/analytics'
import { settingsRepo } from '../database/repositories/settings'
import { appStateRepo } from '../database/repositories/appState'

const DISTINCT_ID_KEY = 'analytics_distinct_id'

// Read env vars at runtime (not at module load time, since dotenv loads later)
function getPostHogConfig() {
  return {
    apiKey: process.env.POSTHOG_API_KEY || '',
    apiHost: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
  }
}

class AnalyticsService {
  private initialized = false
  private posthogApiKey = ''
  private posthogHost = ''

  /**
   * Initialize analytics based on user settings.
   */
  async init(): Promise<void> {
    if (this.initialized) return

    // Read env vars at runtime
    const config = getPostHogConfig()
    this.posthogApiKey = config.apiKey
    this.posthogHost = config.apiHost

    const settings = settingsRepo.get()
    const isEnabled = settings.general.sendAnalytics
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

    // Get or create distinct ID
    let distinctId = appStateRepo.get(DISTINCT_ID_KEY)
    if (!distinctId) {
      distinctId = crypto.randomUUID()
      appStateRepo.set(DISTINCT_ID_KEY, distinctId)
    }

    const provider = isEnabled && this.posthogApiKey ? 'posthog' : 'noop'
    const enabled = isEnabled && !!this.posthogApiKey

    console.log(`[Analytics] Initializing with provider: ${provider}, enabled: ${enabled}`)

    await analytics.init({
      provider,
      config: {
        apiKey: this.posthogApiKey,
        apiHost: this.posthogHost,
        debug: isDev,
      },
      enabled,
    })

    analytics.setDistinctId(distinctId)

    // Identify user with app properties
    if (isEnabled) {
      analytics.identify({
        app_version: app.getVersion(),
        platform: process.platform as 'darwin' | 'win32' | 'linux',
        arch: process.arch,
        os_version: os.release(),
        locale: app.getLocale(),
        theme: settings.general.theme,
      })

      // Track app opened
      this.trackAppOpened()
    }

    this.initialized = true
  }

  /**
   * Update analytics enabled state based on settings change.
   */
  async updateEnabled(enabled: boolean): Promise<void> {
    if (enabled && this.posthogApiKey) {
      await analytics.enable({
        provider: 'posthog',
        config: {
          apiKey: this.posthogApiKey,
          apiHost: this.posthogHost,
          debug: process.env.NODE_ENV === 'development' || !app.isPackaged,
        },
      })

      // Re-identify user after enabling
      const settings = settingsRepo.get()
      analytics.identify({
        app_version: app.getVersion(),
        platform: process.platform as 'darwin' | 'win32' | 'linux',
        arch: process.arch,
        os_version: os.release(),
        locale: app.getLocale(),
        theme: settings.general.theme,
      })
    } else {
      await analytics.disable()
    }
  }

  /**
   * Track app opened event.
   */
  trackAppOpened(): void {
    console.log('[Analytics] Tracking: app_opened')
    analytics.track('app_opened', {
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
    })
  }

  /**
   * Track scan started event.
   */
  trackScanStarted(scanPathsCount: number): void {
    analytics.track('scan_started', {
      scan_paths_count: scanPathsCount,
    })
  }

  /**
   * Track scan completed event.
   */
  trackScanCompleted(durationMs: number, projectsFound: number, totalSizeBytes: number, ecosystems: string[]): void {
    analytics.track('scan_completed', {
      duration_ms: durationMs,
      projects_found: projectsFound,
      total_size_bytes: totalSizeBytes,
      ecosystems,
    })
  }

  /**
   * Track scan cancelled event.
   */
  trackScanCancelled(durationMs: number, projectsFound: number): void {
    analytics.track('scan_cancelled', {
      duration_ms: durationMs,
      projects_found: projectsFound,
    })
  }

  /**
   * Track cleanup started event.
   */
  trackCleanupStarted(projectCount: number, estimatedBytes: number): void {
    analytics.track('cleanup_started', {
      project_count: projectCount,
      estimated_bytes: estimatedBytes,
    })
  }

  /**
   * Track cleanup completed event.
   */
  trackCleanupCompleted(projectCount: number, bytesFreed: number, durationMs: number): void {
    analytics.track('cleanup_completed', {
      project_count: projectCount,
      bytes_freed: bytesFreed,
      duration_ms: durationMs,
    })
  }

  /**
   * Track cleanup failed event.
   */
  trackCleanupFailed(errorType: string, projectCount: number): void {
    analytics.track('cleanup_failed', {
      error_type: errorType,
      project_count: projectCount,
    })
  }

  /**
   * Track generic event from renderer (via IPC).
   */
  trackEvent(event: string, properties?: Record<string, unknown>): void {
    analytics.track(event as any, properties)
  }

  /**
   * Shutdown analytics.
   */
  async shutdown(): Promise<void> {
    await analytics.shutdown()
  }
}

export const analyticsService = new AnalyticsService()
