import { memo, useMemo } from 'react'
import { EcosystemSummary, EcosystemId } from '../types'
import { EcosystemCard } from './EcosystemCard'
import { ecosystemConfigs } from '../config/ecosystems'

interface EcosystemGridProps {
  ecosystems: EcosystemSummary[]
}

export const EcosystemGrid = memo(function EcosystemGrid({ ecosystems }: EcosystemGridProps) {
  const { sorted, emptyEcosystems } = useMemo(() => {
    // Get all ecosystem IDs
    const allEcosystemIds = Object.keys(ecosystemConfigs) as EcosystemId[]
    const ecosystemsWithProjects = new Set(ecosystems.map((e) => e.ecosystem))

    // Sort ecosystems with projects by size
    const sorted = [...ecosystems].sort((a, b) => b.totalSize - a.totalSize)

    // Create empty summaries for ecosystems without projects
    const emptyEcosystems: EcosystemSummary[] = allEcosystemIds
      .filter((id) => !ecosystemsWithProjects.has(id))
      .map((id) => ({
        ecosystem: id,
        projectCount: 0,
        totalSize: 0,
        cleanableSize: 0,
      }))

    return { sorted, emptyEcosystems }
  }, [ecosystems])

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
      {sorted.map((ecosystem) => (
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
