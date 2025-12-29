import simpleGit, { SimpleGit, StatusResult } from 'simple-git'
import { stat } from 'fs/promises'
import { join } from 'path'

export interface GitProjectInfo {
  isGitRepo: boolean
  lastCommitDate?: Date
  hasUncommittedChanges: boolean
  uncommittedCount: number
  currentBranch?: string
  remoteUrl?: string
}

export class GitService {
  async getProjectInfo(projectPath: string): Promise<GitProjectInfo | null> {
    // Check if .git directory exists
    try {
      await stat(join(projectPath, '.git'))
    } catch {
      return null // Not a git repo
    }

    const git: SimpleGit = simpleGit(projectPath)

    try {
      const [status, log, remotes] = await Promise.all([
        git.status(),
        git.log({ maxCount: 1 }).catch(() => null),
        git.getRemotes(true).catch(() => []),
      ])

      return {
        isGitRepo: true,
        lastCommitDate: log?.latest?.date ? new Date(log.latest.date) : undefined,
        hasUncommittedChanges: this.hasChanges(status),
        uncommittedCount: this.countChanges(status),
        currentBranch: status.current || undefined,
        remoteUrl: remotes[0]?.refs?.fetch,
      }
    } catch {
      // Git command failed
      return {
        isGitRepo: true,
        hasUncommittedChanges: false,
        uncommittedCount: 0,
      }
    }
  }

  private hasChanges(status: StatusResult): boolean {
    return (
      status.not_added.length > 0 || status.modified.length > 0 || status.deleted.length > 0 || status.staged.length > 0 || status.renamed.length > 0
    )
  }

  private countChanges(status: StatusResult): number {
    return status.not_added.length + status.modified.length + status.deleted.length + status.staged.length + status.renamed.length
  }

  async isWorkingDirectoryClean(projectPath: string): Promise<boolean> {
    const info = await this.getProjectInfo(projectPath)
    return info ? !info.hasUncommittedChanges : true
  }

  async getLastCommitDate(projectPath: string): Promise<Date | null> {
    const info = await this.getProjectInfo(projectPath)
    return info?.lastCommitDate || null
  }
}
