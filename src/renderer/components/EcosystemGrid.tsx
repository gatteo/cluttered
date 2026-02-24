import { memo, useMemo } from 'react'
import { EcosystemSummary, EcosystemId } from '../types'
import { EcosystemCard } from './EcosystemCard'
import { GlobalCachesCard } from './GlobalCachesCard'
import { ecosystemConfigs } from '../config/ecosystems'
import { useScanStore } from '../store/scanStore'

interface EcosystemGridProps {
  ecosystems: EcosystemSummary[]
  loading?: boolean
}

export const EcosystemGrid = memo(function EcosystemGrid({ ecosystems, loading = false }: EcosystemGridProps) {
  const globalCachesSize = useScanStore((s) => s.result?.globalCachesSize ?? 0)
  const globalCachesCount = useScanStore((s) => s.result?.globalCaches?.length ?? 0)

  const { sorted, globalCachePosition, emptyEcosystems } = useMemo(() => {
    const allEcosystemIds = Object.keys(ecosystemConfigs) as EcosystemId[]
    const ecosystemsWithProjects = new Set(ecosystems.map((e) => e.ecosystem))

    // Sort ecosystems with projects by size
    const sorted = [...ecosystems].sort((a, b) => b.totalSize - a.totalSize)

    // Find where global caches card should be inserted (sorted by size)
    let globalCachePosition = sorted.length // default: after all ecosystem cards
    if (globalCachesCount > 0) {
      for (let i = 0; i < sorted.length; i++) {
        if (globalCachesSize >= sorted[i].totalSize) {
          globalCachePosition = i
          break
        }
      }
    }

    // Create empty summaries for ecosystems without projects
    const emptyEcosystems: EcosystemSummary[] = allEcosystemIds
      .filter((id) => !ecosystemsWithProjects.has(id))
      .map((id) => ({
        ecosystem: id,
        projectCount: 0,
        totalSize: 0,
        cleanableSize: 0,
      }))

    return { sorted, globalCachePosition, emptyEcosystems }
  }, [ecosystems, globalCachesSize, globalCachesCount])

  // When loading, show all ecosystems as skeleton cards
  if (loading) {
    const allEcosystemIds = Object.keys(ecosystemConfigs) as EcosystemId[]
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
        {allEcosystemIds.map((id) => (
          <div key={id}>
            <EcosystemCard ecosystem={{ ecosystem: id, projectCount: 0, totalSize: 0, cleanableSize: 0 }} loading />
          </div>
        ))}
      </div>
    )
  }

  // Build ordered list: ecosystem cards with global caches card inserted at the right position
  const beforeGlobal = sorted.slice(0, globalCachePosition)
  const afterGlobal = sorted.slice(globalCachePosition)

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
      {beforeGlobal.map((ecosystem) => (
        <div key={ecosystem.ecosystem}>
          <EcosystemCard ecosystem={ecosystem} />
        </div>
      ))}
      {globalCachesCount > 0 && (
        <div key="global-caches">
          <GlobalCachesCard />
        </div>
      )}
      {afterGlobal.map((ecosystem) => (
        <div key={ecosystem.ecosystem}>
          <EcosystemCard ecosystem={ecosystem} />
        </div>
      ))}
      {emptyEcosystems.map((ecosystem) => (
        <div key={ecosystem.ecosystem}>
          <EcosystemCard ecosystem={ecosystem} disabled />
        </div>
      ))}
    </div>
  )
})
