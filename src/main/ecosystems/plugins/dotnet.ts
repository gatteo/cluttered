import { BaseEcosystemPlugin } from '../base'
import { join } from 'path'
import { readdir } from 'fs/promises'

export class DotnetPlugin extends BaseEcosystemPlugin {
  id = 'dotnet'
  name = '.NET'
  icon = '🔵'
  color = '#512BD4'
  detectionFiles = ['*.csproj', '*.fsproj', '*.sln']
  cleanablePatterns = [
    {
      pattern: 'bin',
      description: 'Compiled binaries',
      alwaysSafe: true,
    },
    {
      pattern: 'obj',
      description: 'Build intermediates',
      alwaysSafe: true,
    },
    {
      pattern: 'packages',
      description: 'NuGet packages',
      alwaysSafe: true,
    },
  ]

  async detect(projectPath: string): Promise<boolean> {
    try {
      const entries = await readdir(projectPath, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isFile()) {
          if (entry.name.endsWith('.csproj') || entry.name.endsWith('.fsproj') || entry.name.endsWith('.sln')) {
            return true
          }
        }
      }
    } catch {
      // Can't read directory
    }
    return false
  }
}

export const dotnetPlugin = new DotnetPlugin()
