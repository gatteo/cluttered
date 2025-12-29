import { ProviderConfig, UserProperties } from '../types'

export abstract class AnalyticsProvider {
  protected config: ProviderConfig | null = null
  protected initialized = false

  /** Initialize the provider */
  abstract init(config: ProviderConfig): Promise<void>

  /** Track an event */
  abstract track(distinctId: string, event: string, properties?: Record<string, unknown>): void

  /** Identify a user (anonymous ID) */
  abstract identify(distinctId: string, properties?: UserProperties): void

  /** Flush pending events */
  abstract flush(): Promise<void>

  /** Shutdown the provider */
  abstract shutdown(): Promise<void>

  /** Check if provider is initialized */
  isInitialized(): boolean {
    return this.initialized
  }
}
