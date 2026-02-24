import { memo } from 'react'
import { HardDrive } from 'lucide-react'
import { formatBytes } from '../utils/format'
import { useUIStore } from '../store/uiStore'
import { useScanStore } from '../store/scanStore'

const PURPLE = '#A855F7'

export const GlobalCachesCard = memo(function GlobalCachesCard() {
  const goToGlobalCaches = useUIStore((s) => s.goToGlobalCaches)
  const globalCaches = useScanStore((s) => s.result?.globalCaches)
  const globalCachesSize = useScanStore((s) => s.result?.globalCachesSize ?? 0)
  const selectedIds = useScanStore((s) => s.selectedGlobalCacheIds)

  const count = globalCaches?.length ?? 0
  if (count === 0) return null

  const selectedCount = selectedIds.size

  return (
    <button
      className="glass-card p-5 w-full text-left group relative overflow-hidden transition-transform duration-150 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
      onClick={goToGlobalCaches}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          background: `radial-gradient(circle at right, ${PURPLE}20 0%, transparent 70%)`,
        }}
      />

      {/* Icon - absolute top right, overflowing */}
      <div className="absolute -top-4 -right-10 opacity-20 group-hover:opacity-30 transition-opacity duration-200">
        <HardDrive size={128} strokeWidth={1} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="font-semibold text-white mb-1">Global Caches</h3>

        <div className="text-2xl font-bold text-white mb-1">{formatBytes(globalCachesSize)}</div>

        <div className="flex items-center justify-between">
          <p className="text-text-muted text-sm">
            {selectedCount > 0 ? (
              <>
                <span className="text-accent-purple">{selectedCount} selected</span>
                <span className="text-text-muted"> / {count}</span>
              </>
            ) : (
              <>
                {count} {count === 1 ? 'cache' : 'caches'}
              </>
            )}
          </p>
          <span className="text-[10px] uppercase tracking-wide text-text-secondary group-hover:text-white transition-colors px-2 py-1 rounded-md bg-surface-elevated border border-white/10 group-hover:border-white/20">
            Review
          </span>
        </div>

        {/* Progress indicator */}
        <div className="mt-3 h-1 bg-surface-interactive rounded-full overflow-hidden">
          <div className="h-full rounded-full animate-[grow_0.8s_ease-out_forwards]" style={{ backgroundColor: PURPLE, width: '100%' }} />
        </div>
      </div>
    </button>
  )
})
