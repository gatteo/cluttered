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

export interface EcosystemSummary {
  ecosystem: EcosystemId
  projectCount: number
  totalSize: number
  cleanableSize: number
}
