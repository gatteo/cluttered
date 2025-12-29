import { ProjectStatus, DetectionSettings } from '../../shared/types'
import { GitService, GitProjectInfo } from './git'
import { IDEDetectorService, IDEInfo } from './ideDetector'
import { ProjectClassifier } from './projectClassifier'
import { ProtectionAnalyzer } from './protectionAnalyzer'
import { stat } from 'fs/promises'

export interface ProjectAnalysis {
  lastModified: Date
  lastGitCommit?: Date
  lastIDEAccess?: Date
  hasUncommittedChanges: boolean
  status: ProjectStatus
  isProtected: boolean
  protectionReasons: string[]
  gitInfo?: GitProjectInfo
  ideInfo?: IDEInfo
}

async function getLastModifiedTime(projectPath: string): Promise<Date> {
  try {
    const stats = await stat(projectPath)
    return stats.mtime
  } catch {
    return new Date(0)
  }
}

export class ActivityAggregator {
  private gitService: GitService
  private ideDetector: IDEDetectorService
  private classifier: ProjectClassifier
  private protectionAnalyzer: ProtectionAnalyzer

  constructor(settings: DetectionSettings, protectedPaths: string[]) {
    this.gitService = new GitService()
    this.ideDetector = new IDEDetectorService()
    this.classifier = new ProjectClassifier(settings)
    this.protectionAnalyzer = new ProtectionAnalyzer(protectedPaths)
  }

  async analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
    // Run all analyses in parallel
    const [lastModified, gitInfo, ideInfo, protection] = await Promise.all([
      getLastModifiedTime(projectPath),
      this.gitService.getProjectInfo(projectPath).catch(() => null),
      this.ideDetector.detectIDEUsage(projectPath),
      this.protectionAnalyzer.analyze(projectPath),
    ])

    // Classify based on activity
    const status = this.classifier.classify(lastModified, gitInfo?.lastCommitDate, ideInfo.mostRecentAccess)

    return {
      lastModified,
      lastGitCommit: gitInfo?.lastCommitDate,
      lastIDEAccess: ideInfo.mostRecentAccess,
      hasUncommittedChanges: gitInfo?.hasUncommittedChanges ?? false,
      status,
      isProtected: protection.isProtected || status === 'active',
      protectionReasons: [...protection.reasons, ...(status === 'active' ? ['Project is actively used'] : [])],
      gitInfo: gitInfo ?? undefined,
      ideInfo,
    }
  }

  updateSettings(settings: DetectionSettings) {
    this.classifier.updateSettings(settings)
  }

  updateProtectedPaths(paths: string[]) {
    this.protectionAnalyzer.updateProtectedPaths(paths)
  }
}
