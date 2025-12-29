import { GitService } from './git'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface ProtectionResult {
  isProtected: boolean
  reasons: string[]
}

export class ProtectionAnalyzer {
  private gitService: GitService
  private protectedPaths: Set<string>

  constructor(protectedPaths: string[] = []) {
    this.gitService = new GitService()
    this.protectedPaths = new Set(protectedPaths)
  }

  updateProtectedPaths(paths: string[]) {
    this.protectedPaths = new Set(paths)
  }

  async analyze(projectPath: string): Promise<ProtectionResult> {
    const reasons: string[] = []

    // Check if in protected paths
    if (this.isInProtectedPath(projectPath)) {
      reasons.push('In protected paths list')
    }

    // Check for uncommitted git changes
    const gitInfo = await this.gitService.getProjectInfo(projectPath)
    if (gitInfo?.hasUncommittedChanges) {
      reasons.push(`Uncommitted git changes (${gitInfo.uncommittedCount} files)`)
    }

    // Check if project is currently open in an IDE
    const isOpenInIDE = await this.isProjectOpenInIDE(projectPath)
    if (isOpenInIDE) {
      reasons.push('Currently open in IDE')
    }

    return {
      isProtected: reasons.length > 0,
      reasons,
    }
  }

  private isInProtectedPath(projectPath: string): boolean {
    for (const protectedPath of this.protectedPaths) {
      if (projectPath.startsWith(protectedPath)) {
        return true
      }
    }
    return false
  }

  private async isProjectOpenInIDE(projectPath: string): Promise<boolean> {
    // Check VS Code
    try {
      const { stdout } = await execAsync(`lsof +D "${projectPath}" 2>/dev/null | grep -i "code" | head -1`)
      if (stdout.trim()) return true
    } catch {
      // No VS Code process found
    }

    // Check Xcode
    try {
      const { stdout } = await execAsync(`lsof +D "${projectPath}" 2>/dev/null | grep -i "xcode" | head -1`)
      if (stdout.trim()) return true
    } catch {
      // No Xcode process found
    }

    return false
  }
}
