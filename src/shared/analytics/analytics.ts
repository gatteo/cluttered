import { v4 as uuidv4 } from 'uuid'
import { AnalyticsProvider } from './providers/base'
import { NoopProvider } from './providers/noop'
import { PostHogProvider } from './providers/posthog'
import { ProviderConfig, UserProperties, AnalyticsEventName, EventProperties } from './types'

export type ProviderType = 'posthog' | 'noop'

interface AnalyticsConfig {
  provider: ProviderType
  config: ProviderConfig
  enabled?: boolean
}

/**
 * Main Analytics class - singleton that manages event tracking.
 * Provider-agnostic: can switch between PostHog, or other providers.
 */
class Analytics {
  private provider: AnalyticsProvider
  private enabled: boolean = false
  private distinctId: string | null = null
  private sessionStartTime: number = Date.now()
  private debug: boolean = false

  constructor() {
    // Start with NoopProvider
    this.provider = new NoopProvider()
  }

  /**
   * Initialize analytics with a specific provider.
   */
  async init(config: AnalyticsConfig): Promise<void> {
    this.debug = config.config.debug ?? false
    this.enabled = config.enabled ?? true
    this.sessionStartTime = Date.now()

    // Shutdown existing provider if any
    await this.provider.shutdown()

    // Create new provider based on type
    if (!this.enabled) {
      this.provider = new NoopProvider()
    } else {
      switch (config.provider) {
        case 'posthog':
          this.provider = new PostHogProvider()
          break
        case 'noop':
        default:
          this.provider = new NoopProvider()
          break
      }
    }

    await this.provider.init(config.config)

    if (this.debug) {
      console.log(`[Analytics] Initialized with provider: ${config.provider}, enabled: ${this.enabled}`)
    }
  }

  /**
   * Set the distinct ID for the user (anonymous).
   */
  setDistinctId(id: string): void {
    this.distinctId = id
  }

  /**
   * Get or generate a distinct ID.
   */
  getDistinctId(): string {
    if (!this.distinctId) {
      this.distinctId = uuidv4()
    }
    return this.distinctId
  }

  /**
   * Enable analytics tracking.
   */
  async enable(config: AnalyticsConfig): Promise<void> {
    this.enabled = true
    await this.init({ ...config, enabled: true })
  }

  /**
   * Disable analytics tracking.
   */
  async disable(): Promise<void> {
    this.enabled = false
    await this.provider.shutdown()
    this.provider = new NoopProvider()
    await this.provider.init({ apiKey: '' })
  }

  /**
   * Check if analytics is enabled.
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Track an analytics event.
   */
  track(event: AnalyticsEventName, properties?: EventProperties): void {
    if (!this.enabled) return

    const distinctId = this.getDistinctId()
    this.provider.track(distinctId, event, properties as Record<string, unknown>)
  }

  /**
   * Identify the user with properties.
   */
  identify(properties?: UserProperties): void {
    if (!this.enabled) return

    const distinctId = this.getDistinctId()
    this.provider.identify(distinctId, properties)
  }

  /**
   * Get session duration in milliseconds.
   */
  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime
  }

  /**
   * Flush pending events.
   */
  async flush(): Promise<void> {
    await this.provider.flush()
  }

  /**
   * Shutdown analytics.
   */
  async shutdown(): Promise<void> {
    // Track app closed event before shutting down
    if (this.enabled) {
      this.track('app_closed', {
        session_duration_ms: this.getSessionDuration(),
      })
      await this.flush()
    }

    await this.provider.shutdown()
  }
}

// Export singleton instance
export const analytics = new Analytics()

// Re-export types
export * from './types'
