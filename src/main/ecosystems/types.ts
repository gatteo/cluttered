import { EcosystemId, ProjectArtifact, CleanResult } from '../../shared/types';

export interface ProjectActivity {
  lastModified: Date;
  lastGitCommit?: Date;
  hasUncommittedChanges: boolean;
  lastIDEAccess?: Date;
}

export interface SizeResult {
  totalSize: number;
  artifacts: ProjectArtifact[];
}

export interface CleanOptions {
  dryRun: boolean;
  moveToTrash: boolean;
}

export interface EcosystemPlugin {
  id: string;
  name: string;
  icon: string;
  color: string;
  detectionFiles: string[];
  cleanablePatterns: Array<{
    pattern: string;
    description: string;
    alwaysSafe: boolean;
  }>;

  detect(projectPath: string): Promise<boolean>;
  analyzeActivity(projectPath: string): Promise<ProjectActivity>;
  calculateSize(projectPath: string): Promise<SizeResult>;
  clean(projectPath: string, options: CleanOptions): Promise<CleanResult>;
}

// Base plugin implementation that ecosystems can extend
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

  abstract detect(projectPath: string): Promise<boolean>;
  abstract analyzeActivity(projectPath: string): Promise<ProjectActivity>;
  abstract calculateSize(projectPath: string): Promise<SizeResult>;
  abstract clean(projectPath: string, options: CleanOptions): Promise<CleanResult>;
}
