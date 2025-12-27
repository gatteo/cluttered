import { BaseEcosystemPlugin } from '../base';

export class PhpPlugin extends BaseEcosystemPlugin {
  id = 'php';
  name = 'PHP';
  icon = '🐘';
  color = '#777BB4';
  detectionFiles = ['composer.json'];
  cleanablePatterns = [
    {
      pattern: 'vendor',
      description: 'Composer dependencies',
      alwaysSafe: true,
    },
    {
      pattern: 'storage/framework/cache',
      description: 'Laravel cache',
      alwaysSafe: true,
    },
    {
      pattern: 'bootstrap/cache',
      description: 'Laravel bootstrap cache',
      alwaysSafe: true,
    },
  ];
}

export const phpPlugin = new PhpPlugin();
