import { useMemo } from 'react'
import { useQuotaStore } from '../store/quotaStore'
import { useLicenseStore } from '../store/licenseStore'
import { formatBytes } from '../utils/format'
import { Sparkles } from 'lucide-react'

export function QuotaBar() {
  const quota = useQuotaStore((s) => s.quota)
  const isPro = useLicenseStore((s) => s.isPro)
  const openCheckout = useLicenseStore((s) => s.openCheckout)

  // Don't show for Pro users
  if (isPro || !quota || quota.isPro) {
    return null
  }

  const { used, limit, remaining, percentUsed, resetAt } = quota

  const isNearLimit = percentUsed >= 80
  const isAtLimit = remaining === 0

  const barColor = isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-accent-purple'

  const resetText = useMemo(() => {
    if (!resetAt) return null
    const resetDate = new Date(resetAt)
    const now = new Date()
    const diffHours = Math.floor((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `Resets in ${diffDays}d`
    if (diffHours > 0) return `Resets in ${diffHours}h`
    return 'Resets soon'
  }, [resetAt])

  if (isAtLimit) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="flex-1">
          <p className="text-sm text-red-400">Weekly limit reached</p>
          <p className="text-xs text-text-muted">{resetText}</p>
        </div>
        <button onClick={() => openCheckout()} className="btn-subtle text-amber-400 hover:text-amber-300 text-sm flex items-center gap-1">
          <Sparkles size={14} />
          Upgrade
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-[120px]">
        <div className="flex items-center justify-between text-xs text-text-muted mb-1">
          <span>Weekly usage</span>
          <span>
            {formatBytes(used)} / {formatBytes(limit)}
          </span>
        </div>
        <div className="h-1.5 bg-surface-interactive rounded-full overflow-hidden">
          <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${Math.min(100, percentUsed)}%` }} />
        </div>
      </div>

      {isNearLimit && (
        <button onClick={() => openCheckout()} className="btn-subtle text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1">
          <Sparkles size={12} />
          Upgrade
        </button>
      )}
    </div>
  )
}
