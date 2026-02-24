import { access } from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import { homedir } from 'os'
import { join } from 'path'
import { GlobalCache, GlobalCacheCategory } from '../../shared/types'

const execAsync = promisify(exec)

interface GlobalCacheDefinition {
  category: GlobalCacheCategory
  name: string
  description: string
  icon: string
  path: string
  alwaysSafe: boolean
  cautionNote?: string
}

function getCacheDefinitions(): GlobalCacheDefinition[] {
  const home = homedir()

  return [
    // Package Manager Caches
    {
      category: 'package-manager',
      name: 'npm cache',
      description: 'Downloaded npm packages',
      icon: '📦',
      path: join(home, '.npm'),
      alwaysSafe: true,
    },
    {
      category: 'package-manager',
      name: 'Yarn cache',
      description: 'Downloaded Yarn packages',
      icon: '🧶',
      path: join(home, 'Library/Caches/Yarn'),
      alwaysSafe: true,
    },
    {
      category: 'package-manager',
      name: 'pnpm store',
      description: 'Content-addressable package store',
      icon: '📦',
      path: join(home, 'Library/pnpm/store'),
      alwaysSafe: false,
      cautionNote: 'Shared store hard-linked by all pnpm projects. Deleting forces every project to re-download dependencies on next install.',
    },
    {
      category: 'package-manager',
      name: 'pnpm cache',
      description: 'pnpm metadata cache',
      icon: '📦',
      path: join(home, 'Library/Caches/pnpm'),
      alwaysSafe: true,
    },
    {
      category: 'package-manager',
      name: 'Bun cache',
      description: 'Bun install cache',
      icon: '🥟',
      path: join(home, '.bun/install/cache'),
      alwaysSafe: true,
    },
    {
      category: 'package-manager',
      name: 'CocoaPods cache',
      description: 'CocoaPods specs and download cache',
      icon: '🫛',
      path: join(home, 'Library/Caches/CocoaPods'),
      alwaysSafe: true,
    },
    {
      category: 'package-manager',
      name: 'Gradle caches',
      description: 'Gradle build and dependency cache',
      icon: '🐘',
      path: join(home, '.gradle/caches'),
      alwaysSafe: false,
      cautionNote: 'Contains build cache and downloaded dependencies. Deleting slows down first builds as everything re-downloads.',
    },
    {
      category: 'package-manager',
      name: 'Gradle wrapper',
      description: 'Gradle wrapper distributions',
      icon: '🐘',
      path: join(home, '.gradle/wrapper/dists'),
      alwaysSafe: true,
    },
    {
      category: 'package-manager',
      name: 'pip cache',
      description: 'Python pip download cache',
      icon: '🐍',
      path: join(home, 'Library/Caches/pip'),
      alwaysSafe: true,
    },
    {
      category: 'package-manager',
      name: 'Homebrew cache',
      description: 'Homebrew download cache',
      icon: '🍺',
      path: join(home, 'Library/Caches/Homebrew'),
      alwaysSafe: true,
    },

    // Dev Tool Caches
    {
      category: 'dev-tool',
      name: 'Playwright browsers',
      description: 'Playwright test browser binaries',
      icon: '🎭',
      path: join(home, 'Library/Caches/ms-playwright'),
      alwaysSafe: true,
    },
    {
      category: 'dev-tool',
      name: 'Electron cache',
      description: 'Electron prebuilt binaries',
      icon: '⚡',
      path: join(home, 'Library/Caches/electron'),
      alwaysSafe: true,
    },
    {
      category: 'dev-tool',
      name: 'node-gyp cache',
      description: 'Node.js native module build headers',
      icon: '🔧',
      path: join(home, 'Library/Caches/node-gyp'),
      alwaysSafe: true,
    },
    {
      category: 'dev-tool',
      name: 'TypeScript cache',
      description: 'TypeScript compiler cache',
      icon: '🔷',
      path: join(home, 'Library/Caches/typescript'),
      alwaysSafe: true,
    },
    {
      category: 'dev-tool',
      name: 'Docker data',
      description: 'Docker Desktop images, containers, volumes',
      icon: '🐳',
      path: join(home, 'Library/Containers/com.docker.docker'),
      alwaysSafe: false,
      cautionNote: 'Contains all Docker images, containers, and volumes. Deleting removes ALL Docker data and may break running containers.',
    },

    // Mobile Dev (static paths)
    {
      category: 'mobile-dev',
      name: 'Xcode DerivedData',
      description: 'Xcode build cache and indexes',
      icon: '🍎',
      path: join(home, 'Library/Developer/Xcode/DerivedData'),
      alwaysSafe: true,
    },
    {
      category: 'mobile-dev',
      name: 'iOS DeviceSupport',
      description: 'Debug symbols for connected iOS devices',
      icon: '📱',
      path: join(home, 'Library/Developer/Xcode/iOS DeviceSupport'),
      alwaysSafe: false,
      cautionNote: 'Debug symbols for physical iOS devices. Xcode will re-download them next time you connect a device.',
    },
    {
      category: 'mobile-dev',
      name: 'Xcode Archives',
      description: 'Archived app builds for distribution',
      icon: '📁',
      path: join(home, 'Library/Developer/Xcode/Archives'),
      alwaysSafe: false,
      cautionNote: 'Contains archived builds for App Store and TestFlight distribution. Deleting removes your distribution history permanently.',
    },
    {
      category: 'mobile-dev',
      name: 'iOS Simulator data',
      description: 'iOS Simulator app data and caches',
      icon: '📲',
      path: join(home, 'Library/Developer/CoreSimulator/Devices'),
      alwaysSafe: false,
      cautionNote: 'All simulator app data and settings. Deleting resets every simulator to factory state.',
    },
    {
      category: 'mobile-dev',
      name: 'Android AVDs',
      description: 'Android Virtual Device disk images',
      icon: '🤖',
      path: join(home, '.android/avd'),
      alwaysSafe: false,
      cautionNote: 'Virtual device disk images with all configured emulators. Deleting removes all AVDs and their data.',
    },
    {
      category: 'mobile-dev',
      name: 'Android NDK',
      description: 'Android Native Development Kit',
      icon: '🤖',
      path: join(home, 'Library/Android/sdk/ndk'),
      alwaysSafe: false,
      cautionNote: 'Required for compiling native C/C++ code in Android apps. Deleting breaks NDK builds until re-downloaded via SDK Manager.',
    },
    {
      category: 'mobile-dev',
      name: 'Android system images',
      description: 'Emulator system images for various API levels',
      icon: '🤖',
      path: join(home, 'Library/Android/sdk/system-images'),
      alwaysSafe: false,
      cautionNote: 'OS images that emulators boot from. Deleting means emulators won\'t start until images are re-downloaded.',
    },
    {
      category: 'mobile-dev',
      name: 'Android build-tools',
      description: 'Android SDK build tools (multiple versions)',
      icon: '🤖',
      path: join(home, 'Library/Android/sdk/build-tools'),
      alwaysSafe: false,
      cautionNote: 'SDK build tools required for compiling Android apps. Deleting breaks builds until re-downloaded via SDK Manager.',
    },
  ]
}

function generateId(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return `cache_${Math.abs(hash).toString(16)}`
}

async function getDirectorySize(dirPath: string): Promise<number> {
  try {
    await access(dirPath)
    const { stdout } = await execAsync(`du -sk "${dirPath}" 2>/dev/null`)
    const sizeKB = parseInt(stdout.split('\t')[0], 10)
    if (!isNaN(sizeKB)) {
      return sizeKB * 1024
    }
    return 0
  } catch {
    return 0
  }
}

interface SimulatorRuntime {
  identifier: string
  version: string
  build: string
  sizeBytes: number
  deletable: boolean
  state: string
  runtimeIdentifier: string
  lastUsedAt?: string
}

async function discoverSimulatorRuntimes(): Promise<GlobalCache[]> {
  const results: GlobalCache[] = []

  try {
    const { stdout } = await execAsync('xcrun simctl runtime list -j 2>/dev/null')
    const runtimes: Record<string, SimulatorRuntime> = JSON.parse(stdout)

    for (const [, runtime] of Object.entries(runtimes)) {
      if (!runtime.deletable || runtime.sizeBytes <= 0) continue

      const lastUsed = runtime.lastUsedAt ? new Date(runtime.lastUsedAt) : null
      const lastUsedStr = lastUsed ? formatLastUsed(lastUsed) : 'never used'

      results.push({
        id: generateId(`simruntime_${runtime.identifier}`),
        category: 'mobile-dev',
        name: `iOS ${runtime.version} Runtime`,
        description: `Build ${runtime.build} - ${lastUsedStr}`,
        icon: '📲',
        path: runtime.identifier,
        size: runtime.sizeBytes,
        alwaysSafe: false,
        cleanCommand: `xcrun simctl runtime delete ${runtime.identifier}`,
        cautionNote: 'Simulator runtime used to run iOS simulators at this version. Deleting prevents running simulators for this iOS version until re-downloaded.',
      })
    }
  } catch {
    // xcrun not available or simctl failed
  }

  return results
}

function formatLastUsed(date: Date): string {
  const now = Date.now()
  const diffDays = Math.floor((now - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'last used today'
  if (diffDays === 1) return 'last used yesterday'
  if (diffDays < 30) return `last used ${diffDays} days ago`
  if (diffDays < 365) return `last used ${Math.floor(diffDays / 30)} months ago`
  return `last used ${Math.floor(diffDays / 365)} years ago`
}

export async function discoverGlobalCaches(): Promise<GlobalCache[]> {
  const definitions = getCacheDefinitions()

  // Scan all sources in parallel
  const [staticResults, simulatorRuntimes] = await Promise.all([
    // Static cache directories
    Promise.all(
      definitions.map(async (def) => {
        const size = await getDirectorySize(def.path)
        if (size > 0) {
          return {
            id: generateId(def.path),
            category: def.category,
            name: def.name,
            description: def.description,
            icon: def.icon,
            path: def.path,
            size,
            alwaysSafe: def.alwaysSafe,
            cautionNote: def.cautionNote,
          } as GlobalCache
        }
        return null
      })
    ),
    // iOS simulator runtimes (require xcrun simctl)
    discoverSimulatorRuntimes(),
  ])

  const results: GlobalCache[] = []

  for (const cache of staticResults) {
    if (cache) results.push(cache)
  }

  results.push(...simulatorRuntimes)

  // Sort by size descending
  results.sort((a, b) => b.size - a.size)

  return results
}
