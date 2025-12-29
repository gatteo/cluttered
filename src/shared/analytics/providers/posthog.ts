import { PostHog } from 'posthog-node'
import { AnalyticsProvider } from './base'
import { ProviderConfig, UserProperties } from '../types'

/**
 * PostHog analytics provider.
 * Uses posthog-node SDK for server-side (main process) tracking.
 */
export class PostHogProvider extends AnalyticsProvider {
  private client: PostHog | null = null
  private debug: boolean = false

  async init(config: ProviderConfig): Promise<void> {
    this.config = config
    this.debug = config.debug ?? false

    this.client = new PostHog(config.apiKey, {
      host: config.apiHost ?? 'https://us.i.posthog.com',
      flushAt: 20,
      flushInterval: 10000,
    })

    this.initialized = true

    if (this.debug) {
      console.log('[Analytics] PostHog initialized')
    }
  }

  track(distinctId: string, event: string, properties?: Record<string, unknown>): void {
    if (!this.client || !this.initialized) return

    if (this.debug) {
      console.log('[Analytics] Track:', event, properties)
    }

    this.client.capture({
      distinctId,
      event,
      properties,
    })
  }

  identify(distinctId: string, properties?: UserProperties): void {
    if (!this.client || !this.initialized) return

    if (this.debug) {
      console.log('[Analytics] Identify:', distinctId, properties)
    }

    if (properties) {
      this.client.identify({
        distinctId,
        properties,
      })
    }
  }

  async flush(): Promise<void> {
    if (!this.client) return

    if (this.debug) {
      console.log('[Analytics] Flushing events')
    }

    await this.client.flush()
  }

  async shutdown(): Promise<void> {
    if (!this.client) return

    if (this.debug) {
      console.log('[Analytics] Shutting down')
    }

    await this.client.shutdown()
    this.client = null
    this.initialized = false
  }
}
