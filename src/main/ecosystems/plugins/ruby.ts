import { BaseEcosystemPlugin } from '../base';

export class RubyPlugin extends BaseEcosystemPlugin {
  id = 'ruby';
  name = 'Ruby';
  icon = '💎';
  color = '#CC342D';
  detectionFiles = ['Gemfile', '*.gemspec'];
  cleanablePatterns = [
    {
      pattern: 'vendor/bundle',
      description: 'Bundled gems',
      alwaysSafe: true,
    },
    {
      pattern: '.bundle',
      description: 'Bundle cache',
      alwaysSafe: true,
    },
    {
      pattern: 'tmp',
      description: 'Temporary files',
      alwaysSafe: true,
    },
    {
      pattern: 'log',
      description: 'Log files',
      alwaysSafe: true,
    },
  ];
}

export const rubyPlugin = new RubyPlugin();
