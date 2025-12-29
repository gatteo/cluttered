import { BaseEcosystemPlugin } from '../base'
import { join } from 'path'
import { homedir } from 'os'

export interface GlobalCleanablePath {
  path: string
  description: string
}

export class AndroidPlugin extends BaseEcosystemPlugin {
  id = 'android'
  name = 'Android'
  icon = '🤖'
  color = '#3DDC84'
  detectionFiles = ['build.gradle', 'build.gradle.kts', 'settings.gradle', 'settings.gradle.kts']
  cleanablePatterns = [
    {
      pattern: 'build',
      description: 'Gradle build output',
      alwaysSafe: true,
    },
    {
      pattern: '.gradle',
      description: 'Gradle cache',
      alwaysSafe: true,
    },
    {
      pattern: 'app/build',
      description: 'App module build output',
      alwaysSafe: true,
    },
    {
      pattern: '.cxx',
      description: 'Native build cache',
      alwaysSafe: true,
    },
    {
      pattern: 'captures',
      description: 'Android Studio captures',
      alwaysSafe: true,
    },
    {
      pattern: '.externalNativeBuild',
      description: 'External native build',
      alwaysSafe: true,
    },
    {
      pattern: 'local.properties',
      description: 'Local SDK path',
      alwaysSafe: true,
    },
  ]

  // Global Gradle cache
  globalCleanablePaths: GlobalCleanablePath[] = [
    {
      path: join(homedir(), '.gradle/caches'),
      description: 'Global Gradle cache',
    },
    {
      path: join(homedir(), '.gradle/wrapper/dists'),
      description: 'Gradle wrapper distributions',
    },
  ]
}

export const androidPlugin = new AndroidPlugin()
