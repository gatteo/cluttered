import { AnalyticsProvider } from './base'
import { ProviderConfig, UserProperties } from '../types'

/**
 * No-op analytics provider.
 * Used when analytics is disabled - all methods do nothing.
 */
export class NoopProvider extends AnalyticsProvider {
  async init(_config: ProviderConfig): Promise<void> {
    this.initialized = true
  }

  track(_distinctId: string, _event: string, _properties?: Record<string, unknown>): void {
    // No-op
  }

  identify(_distinctId: string, _properties?: UserProperties): void {
    // No-op
  }

  async flush(): Promise<void> {
    // No-op
  }

  async shutdown(): Promise<void> {
    this.initialized = false
  }
}
