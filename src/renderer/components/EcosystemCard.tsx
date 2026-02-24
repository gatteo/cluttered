import { memo, useCallback } from 'react'
import { EcosystemSummary, EcosystemId, Project } from '../types'
import { formatBytes } from '../utils/format'
import { useUIStore } from '../store/uiStore'
import { useProjectStore } from '../store/projectStore'
import { useScanStore } from '../store/scanStore'
import { ecosystemConfigs } from '../config/ecosystems'

// Stable empty array to prevent Zustand selector infinite loop
const EMPTY_PROJECTS: Project[] = []

interface EcosystemCardProps {
  ecosystem: EcosystemSummary
  disabled?: boolean
  loading?: boolean
}

export const EcosystemCard = memo(function EcosystemCard({ ecosystem, disabled = false, loading = false }: EcosystemCardProps) {
  const goToEcosystem = useUIStore((s) => s.goToEcosystem)
  const selectedIds = useProjectStore((s) => s.selectedIds)
  const projects = useScanStore((s) => s.result?.projects ?? EMPTY_PROJECTS)
  const config = ecosystemConfigs[ecosystem.ecosystem as EcosystemId]

  // Count selected projects in this ecosystem
  const selectedInEcosystem = projects.filter((p) => p.ecosystem === ecosystem.ecosystem && selectedIds.has(p.id)).length

  const handleClick = useCallback(() => {
    if (!disabled && !loading && config) {
      goToEcosystem(ecosystem.ecosystem as EcosystemId)
    }
  }, [disabled, loading, goToEcosystem, ecosystem.ecosystem, config])

  // Handle unknown ecosystem
  if (!config) return null

  return (
    <button
      className={`glass-card p-5 w-full text-left group relative overflow-hidden transition-transform duration-150 ${
        disabled || loading ? 'opacity-40 cursor-default' : 'hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]'
      }`}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          background: `radial-gradient(circle at right, ${config.color}20 0%, transparent 70%)`,
        }}
      />

      {/* Icon - absolute top right, overflowing */}
      <div className="absolute -top-4 -right-10 opacity-20 group-hover:opacity-30 transition-opacity duration-200">
        {config.iconImage ? (
          <img src={config.iconImage} alt="" className="w-32 h-32 object-contain" loading="lazy" />
        ) : (
          <span className="text-8xl">{config.icon}</span>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="font-semibold text-white mb-1">{config.name}</h3>

        {loading ? (
          <>
            <div className="h-7 w-20 bg-white/10 rounded animate-pulse mb-1" />
            <div className="flex items-center justify-between">
              <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="mt-3 h-1 bg-surface-interactive rounded-full overflow-hidden">
              <div className="h-full w-full rounded-full animate-pulse" style={{ backgroundColor: `${config.color}40` }} />
            </div>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold text-white mb-1">{formatBytes(ecosystem.totalSize)}</div>

            <div className="flex items-center justify-between">
              <p className="text-text-muted text-sm">
                {disabled ? (
                  'No projects'
                ) : selectedInEcosystem > 0 ? (
                  <>
                    <span className="text-accent-purple">{selectedInEcosystem} selected</span>
                    <span className="text-text-muted"> / {ecosystem.projectCount}</span>
                  </>
                ) : (
                  <>
                    {ecosystem.projectCount} {ecosystem.projectCount === 1 ? 'project' : 'projects'}
                  </>
                )}
              </p>
              {!disabled && (
                <span className="text-[10px] uppercase tracking-wide text-text-secondary group-hover:text-white transition-colors px-2 py-1 rounded-md bg-surface-elevated border border-white/10 group-hover:border-white/20">
                  Review
                </span>
              )}
            </div>

            {/* Progress indicator */}
            <div className="mt-3 h-1 bg-surface-interactive rounded-full overflow-hidden">
              <div className="h-full rounded-full animate-[grow_0.8s_ease-out_forwards]" style={{ backgroundColor: config.color, width: '100%' }} />
            </div>
          </>
        )}
      </div>
    </button>
  )
})
