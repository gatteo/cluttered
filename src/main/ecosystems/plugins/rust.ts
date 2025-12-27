import { BaseEcosystemPlugin } from '../base';

export class RustPlugin extends BaseEcosystemPlugin {
  id = 'rust';
  name = 'Rust';
  icon = '🦀';
  color = '#DEA584';
  detectionFiles = ['Cargo.toml'];
  cleanablePatterns = [
    {
      pattern: 'target',
      description: 'Rust build artifacts',
      alwaysSafe: true,
    },
  ];
}

export const rustPlugin = new RustPlugin();
