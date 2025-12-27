import { BaseEcosystemPlugin } from '../base';
import { join } from 'path';
import { access, readdir } from 'fs/promises';
import { homedir } from 'os';

export interface GlobalCleanablePath {
  path: string;
  description: string;
}

export class XcodePlugin extends BaseEcosystemPlugin {
  id = 'xcode';
  name = 'iOS / Xcode';
  icon = '🍎';
  color = '#007AFF';
  detectionFiles = ['Package.swift', 'Podfile', 'Podfile.lock'];
  cleanablePatterns = [
    {
      pattern: 'Pods',
      description: 'CocoaPods dependencies',
      alwaysSafe: true,
    },
    {
      pattern: 'DerivedData',
      description: 'Xcode build cache',
      alwaysSafe: true,
    },
    {
      pattern: 'build',
      description: 'Build output',
      alwaysSafe: true,
    },
    {
      pattern: '.build',
      description: 'Swift PM build cache',
      alwaysSafe: true,
    },
    {
      pattern: 'xcuserdata',
      description: 'Xcode user data',
      alwaysSafe: true,
    },
    {
      pattern: '*.xcodeproj/xcuserdata',
      description: 'Project user data',
      alwaysSafe: true,
    },
    {
      pattern: '*.xcworkspace/xcuserdata',
      description: 'Workspace user data',
      alwaysSafe: true,
    },
  ];

  // Global Xcode caches (not per-project)
  globalCleanablePaths: GlobalCleanablePath[] = [
    {
      path: join(homedir(), 'Library/Developer/Xcode/DerivedData'),
      description: 'Global DerivedData',
    },
    {
      path: join(homedir(), 'Library/Developer/Xcode/Archives'),
      description: 'Archives',
    },
    {
      path: join(homedir(), 'Library/Developer/Xcode/iOS DeviceSupport'),
      description: 'iOS Device Support',
    },
    {
      path: join(homedir(), 'Library/Developer/CoreSimulator/Caches'),
      description: 'Simulator Caches',
    },
  ];

  async detect(projectPath: string): Promise<boolean> {
    // Check for Package.swift (Swift Package)
    try {
      await access(join(projectPath, 'Package.swift'));
      return true;
    } catch {
      // Continue checking
    }

    // Check for .xcodeproj or .xcworkspace directories
    try {
      const entries = await readdir(projectPath, { withFileTypes: true });
      for (const entry of entries) {
        if (
          entry.isDirectory() &&
          (entry.name.endsWith('.xcodeproj') || entry.name.endsWith('.xcworkspace'))
        ) {
          return true;
        }
      }
    } catch {
      // Can't read directory
    }

    return false;
  }
}

export const xcodePlugin = new XcodePlugin();
