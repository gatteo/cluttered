export type EcosystemId =
  | 'react-native'
  | 'nodejs'
  | 'rust'
  | 'xcode'
  | 'android'
  | 'python'
  | 'go'
  | 'docker'
  | 'ruby'
  | 'php'
  | 'java'
  | 'elixir'
  | 'dotnet'

export type ProjectStatus = 'active' | 'recent' | 'stale' | 'dormant'

export interface ProjectArtifact {
  pattern: string
  description: string
  size: number
  path: string
}

export interface Project {
  id: string
  path: string
  name: string
  ecosystem: EcosystemId | string
  status: ProjectStatus
  lastModified: Date
  lastGitCommit?: Date
  hasUncommittedChanges: boolean
  isProtected: boolean
  protectionReason?: string
  totalSize: number
  artifacts: ProjectArtifact[]
}

export interface EcosystemSummary {
  ecosystem: EcosystemId | string
  projectCount: number
  totalSize: number
  cleanableSize: number
}
