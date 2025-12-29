import { analyticsService } from '../services/analyticsService'

export const analyticsHandlers = {
  track(event: string, properties?: Record<string, unknown>): void {
    analyticsService.trackEvent(event, properties)
  },

  async updateEnabled(enabled: boolean): Promise<void> {
    await analyticsService.updateEnabled(enabled)
  },
}
