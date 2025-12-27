import { BaseEcosystemPlugin } from '../base';

export class JavaPlugin extends BaseEcosystemPlugin {
  id = 'java';
  name = 'Java';
  icon = '☕';
  color = '#ED8B00';
  detectionFiles = ['pom.xml', 'build.gradle', 'build.gradle.kts'];
  cleanablePatterns = [
    {
      pattern: 'target',
      description: 'Maven build output',
      alwaysSafe: true,
    },
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
      pattern: 'out',
      description: 'IntelliJ output',
      alwaysSafe: true,
    },
  ];
}

export const javaPlugin = new JavaPlugin();
