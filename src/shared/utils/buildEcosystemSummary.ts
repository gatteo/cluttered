import { EcosystemSummary, EcosystemId } from '../types'

interface ProjectLike {
  ecosystem: EcosystemId | string
  totalSize: number
  isProtected: boolean
}

/**
 * Build ecosystem summary statistics from a list of projects.
 * Aggregates project count, total size, and cleanable size per ecosystem.
 */
export function buildEcosystemSummary(projects: ProjectLike[]): EcosystemSummary[] {
  const ecosystemMap = new Map<string, { projectCount: number; totalSize: number; cleanableSize: number }>()

  for (const project of projects) {
    const existing = ecosystemMap.get(project.ecosystem) || { projectCount: 0, totalSize: 0, cleanableSize: 0 }
    existing.projectCount += 1
    existing.totalSize += project.totalSize
    if (!project.isProtected) {
      existing.cleanableSize += project.totalSize
    }
    ecosystemMap.set(project.ecosystem, existing)
  }

  return Array.from(ecosystemMap.entries()).map(([ecosystem, data]) => ({
    ecosystem: ecosystem as EcosystemId,
    ...data,
  }))
}
