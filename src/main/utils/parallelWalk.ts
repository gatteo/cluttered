import { readdir, stat, lstat } from 'fs/promises'
import { join } from 'path'

export interface WalkOptions {
  maxDepth?: number
  excludePatterns?: string[]
  followSymlinks?: boolean
  onDirectory?: (path: string) => void
}

export async function parallelWalk(rootPaths: string[], options: WalkOptions = {}): Promise<string[]> {
  const results: string[] = []
  const { maxDepth = 10, excludePatterns = [], followSymlinks = false } = options

  async function walk(dirPath: string, depth: number) {
    if (depth > maxDepth) return

    try {
      const entries = await readdir(dirPath, { withFileTypes: true })

      const subdirs: Promise<void>[] = []

      for (const entry of entries) {
        if (!entry.isDirectory() && !entry.isSymbolicLink()) continue
        if (entry.name.startsWith('.')) continue

        const fullPath = join(dirPath, entry.name)

        // Check exclusions
        if (excludePatterns.some((p) => fullPath.includes(p))) continue

        // Handle symlinks
        if (entry.isSymbolicLink()) {
          if (!followSymlinks) continue

          try {
            const realStat = await stat(fullPath)
            if (!realStat.isDirectory()) continue
          } catch {
            continue // Broken symlink
          }
        }

        results.push(fullPath)
        options.onDirectory?.(fullPath)

        subdirs.push(walk(fullPath, depth + 1))
      }

      // Process subdirectories in parallel
      await Promise.all(subdirs)
    } catch {
      // Skip on error (permission denied, etc.)
    }
  }

  await Promise.all(rootPaths.map((path) => walk(path, 0)))

  return results
}

// Utility to calculate directory size quickly
export async function getDirectorySizeQuick(dirPath: string, maxFiles = 10000): Promise<number> {
  let totalSize = 0
  let fileCount = 0

  async function walk(path: string): Promise<void> {
    if (fileCount > maxFiles) return // Early termination for huge directories

    try {
      const entries = await readdir(path, { withFileTypes: true })

      for (const entry of entries) {
        if (fileCount > maxFiles) break

        const fullPath = join(path, entry.name)

        if (entry.isDirectory()) {
          await walk(fullPath)
        } else if (entry.isFile()) {
          try {
            const stats = await lstat(fullPath)
            totalSize += stats.size
            fileCount++
          } catch {
            // Skip inaccessible files
          }
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  await walk(dirPath)
  return totalSize
}
