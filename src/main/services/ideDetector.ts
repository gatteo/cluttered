import { stat, readdir } from 'fs/promises';
import { join } from 'path';

export interface IDEInfo {
  vsCode: boolean;
  vsCodeLastAccess?: Date;
  intelliJ: boolean;
  intelliJLastAccess?: Date;
  xcode: boolean;
  xcodeLastAccess?: Date;
  mostRecentAccess?: Date;
}

export class IDEDetectorService {
  async detectIDEUsage(projectPath: string): Promise<IDEInfo> {
    const result: IDEInfo = {
      vsCode: false,
      intelliJ: false,
      xcode: false,
    };

    let mostRecent: Date | undefined;

    // Check VS Code
    const vscodeResult = await this.checkIDEDir(projectPath, '.vscode');
    if (vscodeResult) {
      result.vsCode = true;
      result.vsCodeLastAccess = vscodeResult;
      if (!mostRecent || vscodeResult > mostRecent) mostRecent = vscodeResult;
    }

    // Check IntelliJ
    const ideaResult = await this.checkIDEDir(projectPath, '.idea');
    if (ideaResult) {
      result.intelliJ = true;
      result.intelliJLastAccess = ideaResult;
      if (!mostRecent || ideaResult > mostRecent) mostRecent = ideaResult;
    }

    // Check Xcode (by workspace files)
    const xcodeResult = await this.checkXcodeUsage(projectPath);
    if (xcodeResult) {
      result.xcode = true;
      result.xcodeLastAccess = xcodeResult;
      if (!mostRecent || xcodeResult > mostRecent) mostRecent = xcodeResult;
    }

    result.mostRecentAccess = mostRecent;
    return result;
  }

  private async checkIDEDir(projectPath: string, dirName: string): Promise<Date | null> {
    const dirPath = join(projectPath, dirName);

    try {
      const stats = await stat(dirPath);
      if (!stats.isDirectory()) return null;

      // Get most recent mtime of files in the directory
      const entries = await readdir(dirPath);
      let latestTime = stats.mtimeMs;

      for (const entry of entries.slice(0, 10)) {
        // Check first 10 files
        try {
          const entryStats = await stat(join(dirPath, entry));
          if (entryStats.mtimeMs > latestTime) {
            latestTime = entryStats.mtimeMs;
          }
        } catch {
          continue;
        }
      }

      return new Date(latestTime);
    } catch {
      return null;
    }
  }

  private async checkXcodeUsage(projectPath: string): Promise<Date | null> {
    try {
      const entries = await readdir(projectPath);
      const xcodeFiles = entries.filter(
        (e) => e.endsWith('.xcodeproj') || e.endsWith('.xcworkspace')
      );

      if (xcodeFiles.length === 0) return null;

      let latestTime = 0;
      for (const file of xcodeFiles) {
        try {
          const stats = await stat(join(projectPath, file));
          if (stats.mtimeMs > latestTime) {
            latestTime = stats.mtimeMs;
          }
        } catch {
          continue;
        }
      }

      return latestTime > 0 ? new Date(latestTime) : null;
    } catch {
      return null;
    }
  }
}
