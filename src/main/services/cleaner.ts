import { v4 as uuid } from 'uuid'
import { BaseService } from './base'
import { CleanOptions, CleanProgress, CleanResult, Project, DeletionLogEntry } from '../../shared/types'
import { ecosystemRegistry } from '../ecosystems'
import { deletionLogRepo } from '../database/repositories/deletionLog'
import { statisticsRepo } from '../database/repositories/statistics'
import { ProtectionAnalyzer } from './protectionAnalyzer'
import { quotaService } from './quotaService'

export class CleanerService extends BaseService {
  private protectionAnalyzer: ProtectionAnalyzer
  private isCleaning = false
  private shouldCancel = false

  constructor(protectedPaths: string[] = []) {
    super()
    this.protectionAnalyzer = new ProtectionAnalyzer(protectedPaths)
  }

  async clean(projects: Project[], options: CleanOptions): Promise<CleanResult> {
    if (this.isCleaning) {
      throw new Error('Cleaning already in progress')
    }

    // Check quota before cleaning (skip for dry run)
    if (!options.dryRun) {
      const totalBytesToClean = projects.reduce((sum, p) => sum + p.totalSize, 0)
      const quotaCheck = quotaService.canClean(totalBytesToClean)

      if (!quotaCheck.allowed) {
        return {
          success: false,
          bytesFreed: 0,
          filesDeleted: 0,
          projectsCleaned: [],
          errors: [{ projectId: 'quota', error: quotaCheck.reason || 'Weekly limit reached' }],
        }
      }
    }

    this.isCleaning = true
    this.shouldCancel = false

    const result: CleanResult = {
      success: true,
      bytesFreed: 0,
      filesDeleted: 0,
      projectsCleaned: [],
      errors: [],
    }

    try {
      for (let i = 0; i < projects.length; i++) {
        if (this.shouldCancel) break

        const project = projects[i]

        // Double-check protection
        const protection = await this.protectionAnalyzer.analyze(project.path)
        if (protection.isProtected) {
          result.errors.push({
            projectId: project.id,
            error: `Protected: ${protection.reasons.join(', ')}`,
          })
          continue
        }

        this.sendProgress({
          currentProject: project.name,
          projectsProcessed: i,
          totalProjects: projects.length,
          bytesFreed: result.bytesFreed,
          filesDeleted: result.filesDeleted,
        })

        try {
          const cleanResult = await this.cleanProject(project, options)

          result.bytesFreed += cleanResult.bytesFreed
          result.filesDeleted += cleanResult.filesDeleted
          result.projectsCleaned.push(project.id)

          // Log deletion for restore capability and record quota
          if (!options.dryRun) {
            await this.logDeletion(project, cleanResult.artifacts)
            quotaService.recordCleaning(cleanResult.bytesFreed, project.id, project.name)
          }
        } catch (error) {
          result.errors.push({
            projectId: project.id,
            error: String(error),
          })
        }
      }

      // Update statistics
      if (!options.dryRun && result.bytesFreed > 0) {
        statisticsRepo.recordCleanup(result.bytesFreed, result.projectsCleaned.length)
      }

      return result
    } finally {
      this.isCleaning = false
    }
  }

  private async cleanProject(project: Project, options: CleanOptions): Promise<{ bytesFreed: number; filesDeleted: number; artifacts: string[] }> {
    const plugin = ecosystemRegistry.get(project.ecosystem)
    if (!plugin) {
      throw new Error(`Unknown ecosystem: ${project.ecosystem}`)
    }

    if (options.dryRun) {
      // Just return what would be cleaned
      const { totalSize, artifacts } = await plugin.calculateSize(project.path)
      return {
        bytesFreed: totalSize,
        filesDeleted: artifacts.length,
        artifacts: artifacts.map((a) => a.path),
      }
    }

    // Actually clean
    const cleanResult = await plugin.clean(project.path, {
      dryRun: false,
      moveToTrash: options.moveToTrash,
    })

    return {
      bytesFreed: cleanResult.bytesFreed,
      filesDeleted: cleanResult.filesDeleted,
      artifacts: project.artifacts.map((a) => a.path),
    }
  }

  private async logDeletion(project: Project, artifactPaths: string[]) {
    const entry: DeletionLogEntry = {
      id: uuid(),
      timestamp: new Date(),
      projectPath: project.path,
      projectName: project.name,
      ecosystem: project.ecosystem,
      artifacts: artifactPaths,
      totalSize: project.totalSize,
    }

    deletionLogRepo.add(entry)
  }

  private sendProgress(progress: CleanProgress) {
    this.sendToRenderer('clean:progress', progress)
  }

  cancel() {
    this.shouldCancel = true
  }

  updateProtectedPaths(paths: string[]) {
    this.protectionAnalyzer.updateProtectedPaths(paths)
  }
}

export const cleanerService = new CleanerService()
