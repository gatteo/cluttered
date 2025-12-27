import { BaseEcosystemPlugin } from '../base';
import { access } from 'fs/promises';
import { join } from 'path';

export class ReactNativePlugin extends BaseEcosystemPlugin {
  id = 'react-native';
  name = 'React Native';
  icon = '📱';
  color = '#61DAFB';
  detectionFiles = ['package.json']; // Will be refined in detect()
  cleanablePatterns = [
    // Node.js
    {
      pattern: 'node_modules',
      description: 'NPM dependencies',
      alwaysSafe: true,
    },
    // iOS
    {
      pattern: 'ios/Pods',
      description: 'iOS CocoaPods',
      alwaysSafe: true,
    },
    {
      pattern: 'ios/build',
      description: 'iOS build output',
      alwaysSafe: true,
    },
    {
      pattern: 'ios/DerivedData',
      description: 'iOS Xcode cache',
      alwaysSafe: true,
    },
    // Android
    {
      pattern: 'android/build',
      description: 'Android build output',
      alwaysSafe: true,
    },
    {
      pattern: 'android/.gradle',
      description: 'Android Gradle cache',
      alwaysSafe: true,
    },
    {
      pattern: 'android/app/build',
      description: 'Android app build',
      alwaysSafe: true,
    },
    // Expo
    {
      pattern: '.expo',
      description: 'Expo cache',
      alwaysSafe: true,
    },
    // Metro bundler
    {
      pattern: '.metro',
      description: 'Metro bundler cache',
      alwaysSafe: true,
    },
    // General
    {
      pattern: '.cache',
      description: 'General cache',
      alwaysSafe: true,
    },
  ];

  async detect(projectPath: string): Promise<boolean> {
    // Must have package.json
    try {
      await access(join(projectPath, 'package.json'));
    } catch {
      return false;
    }

    // Must have ios/ or android/ folder with their respective files
    const hasIos = await this.hasIosProject(projectPath);
    const hasAndroid = await this.hasAndroidProject(projectPath);

    return hasIos || hasAndroid;
  }

  private async hasIosProject(projectPath: string): Promise<boolean> {
    try {
      await access(join(projectPath, 'ios', 'Podfile'));
      return true;
    } catch {
      return false;
    }
  }

  private async hasAndroidProject(projectPath: string): Promise<boolean> {
    try {
      await access(join(projectPath, 'android', 'build.gradle'));
      return true;
    } catch {
      try {
        await access(join(projectPath, 'android', 'build.gradle.kts'));
        return true;
      } catch {
        return false;
      }
    }
  }
}

export const reactNativePlugin = new ReactNativePlugin();
