import { ProjectStatus, DetectionSettings } from '../../shared/types';

export class ProjectClassifier {
  private settings: DetectionSettings;

  constructor(settings: DetectionSettings) {
    this.settings = settings;
  }

  updateSettings(settings: DetectionSettings) {
    this.settings = settings;
  }

  classify(lastModified: Date, lastGitCommit?: Date, lastIDEAccess?: Date): ProjectStatus {
    // Determine the most relevant date
    const relevantDate = this.getMostRelevantDate(lastModified, lastGitCommit, lastIDEAccess);

    const daysSinceActivity = this.daysSince(relevantDate);

    if (daysSinceActivity < this.settings.activeThresholdDays) {
      return 'active';
    }
    if (daysSinceActivity < this.settings.recentThresholdDays) {
      return 'recent';
    }
    if (daysSinceActivity < this.settings.staleThresholdDays) {
      return 'stale';
    }
    return 'dormant';
  }

  private getMostRelevantDate(
    lastModified: Date,
    lastGitCommit?: Date,
    lastIDEAccess?: Date
  ): Date {
    let mostRecent = lastModified;

    if (this.settings.considerGitActivity && lastGitCommit) {
      if (lastGitCommit > mostRecent) {
        mostRecent = lastGitCommit;
      }
    }

    if (this.settings.considerIDEActivity && lastIDEAccess) {
      if (lastIDEAccess > mostRecent) {
        mostRecent = lastIDEAccess;
      }
    }

    return mostRecent;
  }

  private daysSince(date: Date): number {
    const now = Date.now();
    const diffMs = now - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  getStatusInfo(status: ProjectStatus): {
    label: string;
    color: string;
    description: string;
    icon: string;
  } {
    const statusInfo: Record<
      ProjectStatus,
      { label: string; color: string; description: string; icon: string }
    > = {
      active: {
        label: 'Active',
        color: '#22C55E',
        description: `Modified in last ${this.settings.activeThresholdDays} days`,
        icon: '🟢',
      },
      recent: {
        label: 'Recent',
        color: '#F59E0B',
        description: `Modified ${this.settings.activeThresholdDays}-${this.settings.recentThresholdDays} days ago`,
        icon: '🟡',
      },
      stale: {
        label: 'Stale',
        color: '#F97316',
        description: `Modified ${this.settings.recentThresholdDays}-${this.settings.staleThresholdDays} days ago`,
        icon: '🟠',
      },
      dormant: {
        label: 'Dormant',
        color: '#EF4444',
        description: `Modified over ${this.settings.staleThresholdDays} days ago`,
        icon: '🔴',
      },
    };

    return statusInfo[status];
  }
}
