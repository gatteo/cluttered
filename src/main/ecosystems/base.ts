import { stat, readdir, access, rm } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { shell } from 'electron';
import { EcosystemPlugin, ProjectActivity, SizeResult, CleanOptions } from './types';
import { CleanResult, ProjectArtifact } from '../../shared/types';

const execAsync = promisify(exec);

export abstract class BaseEcosystemPlugin implements EcosystemPlugin {
  abstract id: string;
  abstract name: string;
  abstract icon: string;
  abstract color: string;
  abstract detectionFiles: string[];
  abstract cleanablePatterns: Array<{
    pattern: string;
    description: string;
    alwaysSafe: boolean;
  }>;

  async detect(projectPath: string): Promise<boolean> {
    for (const file of this.detectionFiles) {
      try {
        await access(join(projectPath, file));
        return true;
      } catch {
        // File doesn't exist, continue checking
      }
    }
    return false;
  }

  async analyzeActivity(projectPath: string): Promise<ProjectActivity> {
    const activity: ProjectActivity = {
      lastModified: new Date(0),
      hasUncommittedChanges: false,
    };

    // Get last modified time from project directory
    try {
      const stats = await stat(projectPath);
      activity.lastModified = stats.mtime;
    } catch {
      // Use default
    }

    // Check git status
    try {
      const gitDir = join(projectPath, '.git');
      await access(gitDir);

      // Get last commit date
      try {
        const { stdout } = await execAsync('git log -1 --format=%cd --date=iso', {
          cwd: projectPath,
        });
        if (stdout.trim()) {
          activity.lastGitCommit = new Date(stdout.trim());
          // Use more recent of lastModified or lastGitCommit
          if (activity.lastGitCommit > activity.lastModified) {
            activity.lastModified = activity.lastGitCommit;
          }
        }
      } catch {
        // Git command failed
      }

      // Check for uncommitted changes
      try {
        const { stdout } = await execAsync('git status --porcelain', {
          cwd: projectPath,
        });
        activity.hasUncommittedChanges = stdout.trim().length > 0;
      } catch {
        // Git command failed
      }
    } catch {
      // Not a git repo
    }

    return activity;
  }

  async calculateSize(projectPath: string): Promise<SizeResult> {
    const artifacts: ProjectArtifact[] = [];
    let totalSize = 0;

    for (const pattern of this.cleanablePatterns) {
      const artifactPath = join(projectPath, pattern.pattern);

      try {
        const size = await this.getDirectorySize(artifactPath);
        if (size > 0) {
          artifacts.push({
            pattern: pattern.pattern,
            description: pattern.description,
            size,
            path: artifactPath,
          });
          totalSize += size;
        }
      } catch {
        // Artifact doesn't exist, skip
      }
    }

    return { totalSize, artifacts };
  }

  async clean(projectPath: string, options: CleanOptions): Promise<CleanResult> {
    console.log(`[BasePlugin] clean() called for ${projectPath}, dryRun: ${options.dryRun}, moveToTrash: ${options.moveToTrash}`);

    // Base implementation - will be overridden by specific ecosystems if needed
    const result: CleanResult = {
      success: true,
      bytesFreed: 0,
      filesDeleted: 0,
      projectsCleaned: [],
      errors: [],
    };

    if (options.dryRun) {
      // Just calculate what would be cleaned
      const { totalSize } = await this.calculateSize(projectPath);
      result.bytesFreed = totalSize;
      console.log(`[BasePlugin] Dry run - would free ${totalSize} bytes`);
      return result;
    }

    for (const pattern of this.cleanablePatterns) {
      const artifactPath = join(projectPath, pattern.pattern);

      try {
        const size = await this.getDirectorySize(artifactPath);
        console.log(`[BasePlugin] Pattern ${pattern.pattern}: ${size} bytes at ${artifactPath}`);

        if (size > 0) {
          if (options.moveToTrash) {
            console.log(`[BasePlugin] Moving to trash: ${artifactPath}`);
            await shell.trashItem(artifactPath);
          } else {
            console.log(`[BasePlugin] Deleting: ${artifactPath}`);
            await rm(artifactPath, { recursive: true, force: true });
          }

          result.bytesFreed += size;
          result.filesDeleted += 1;
          console.log(`[BasePlugin] Successfully cleaned ${pattern.pattern}, freed ${size} bytes`);
        }
      } catch (error) {
        console.log(`[BasePlugin] Failed to clean ${pattern.pattern}:`, error);
        // Artifact doesn't exist or couldn't be deleted
      }
    }

    result.projectsCleaned.push(projectPath);
    console.log(`[BasePlugin] Clean complete. Freed ${result.bytesFreed} bytes, deleted ${result.filesDeleted} items`);
    return result;
  }

  protected async getDirectorySize(dirPath: string): Promise<number> {
    try {
      // Check if path exists first
      await access(dirPath);

      // Use du command for much faster size calculation
      // -s = summarize, -k = block size of 1K
      const { stdout } = await execAsync(`du -sk "${dirPath}" 2>/dev/null`);
      const sizeKB = parseInt(stdout.split('\t')[0], 10);
      if (!isNaN(sizeKB)) {
        return sizeKB * 1024; // Convert KB to bytes
      }
      return 0;
    } catch {
      return 0;
    }
  }
}
