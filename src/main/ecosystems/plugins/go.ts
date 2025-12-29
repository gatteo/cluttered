import { BaseEcosystemPlugin } from '../base'
import { join } from 'path'
import { homedir } from 'os'

export interface GlobalCleanablePath {
  path: string
  description: string
}

export class GoPlugin extends BaseEcosystemPlugin {
  id = 'go'
  name = 'Go'
  icon = '🐹'
  color = '#00ADD8'
  detectionFiles = ['go.mod']
  cleanablePatterns = [
    {
      pattern: 'vendor',
      description: 'Vendored dependencies',
      alwaysSafe: false, // Might be committed intentionally
    },
  ]

  // Global Go cache
  globalCleanablePaths: GlobalCleanablePath[] = [
    {
      path: join(homedir(), 'go/pkg/mod/cache'),
      description: 'Module cache',
    },
  ]
}

export const goPlugin = new GoPlugin()
