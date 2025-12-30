import { quotaRepo } from '../database/repositories/quota'
import { licenseService } from './licensing/licenseService'
import { formatBytes } from '../utils/format'

export interface QuotaInfo {
  isPro: boolean
  used: number
  limit: number
  remaining: number
  percentUsed: number
  resetAt: Date | null
  canClean: boolean
}

export interface QuotaCheckResult {
  allowed: boolean
  reason?: string
  remaining?: number
}

class QuotaService {
  /**
   * Check if a cleaning operation is allowed.
   */
  canClean(bytesToClean: number): QuotaCheckResult {
    // Pro users have no limit
    if (licenseService.isPro()) {
      return { allowed: true }
    }

    const remaining = quotaRepo.getRemaining()

    if (remaining === 0) {
      const resetAt = quotaRepo.getNextResetTime()
      const resetStr = resetAt ? this.formatTimeUntil(resetAt) : 'soon'

      return {
        allowed: false,
        reason: `Weekly limit reached. Resets ${resetStr}.`,
        remaining: 0,
      }
    }

    if (bytesToClean > remaining) {
      return {
        allowed: false,
        reason: `Only ${formatBytes(remaining)} remaining this week.`,
        remaining,
      }
    }

    return { allowed: true, remaining }
  }

  /**
   * Record a completed cleaning operation.
   */
  recordCleaning(bytes: number, projectId?: string, projectName?: string): void {
    // Only track for free users
    if (!licenseService.isPro()) {
      quotaRepo.record(bytes, projectId, projectName)
    }
  }

  /**
   * Get full quota information.
   */
  getQuotaInfo(): QuotaInfo {
    const isPro = licenseService.isPro()

    if (isPro) {
      return {
        isPro: true,
        used: 0,
        limit: Infinity,
        remaining: Infinity,
        percentUsed: 0,
        resetAt: null,
        canClean: true,
      }
    }

    const limit = quotaRepo.getLimit()
    const used = quotaRepo.getWeeklyUsage()
    const remaining = Math.max(0, limit - used)
    const percentUsed = Math.min(100, (used / limit) * 100)

    return {
      isPro: false,
      used,
      limit,
      remaining,
      percentUsed,
      resetAt: quotaRepo.getNextResetTime(),
      canClean: remaining > 0,
    }
  }

  /**
   * Format time until a date (e.g., "in 3 days").
   */
  private formatTimeUntil(date: Date): string {
    const now = Date.now()
    const diff = date.getTime() - now

    if (diff < 0) return 'now'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`
    return 'soon'
  }

  /**
   * Prune old quota entries (call periodically).
   */
  prune(): void {
    const pruned = quotaRepo.prune()
    if (pruned > 0) {
      console.log(`[Quota] Pruned ${pruned} old entries`)
    }
  }
}

export const quotaService = new QuotaService()
