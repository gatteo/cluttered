import { BaseEcosystemPlugin } from '../base';

export class ElixirPlugin extends BaseEcosystemPlugin {
  id = 'elixir';
  name = 'Elixir';
  icon = '💧';
  color = '#6E4A7E';
  detectionFiles = ['mix.exs'];
  cleanablePatterns = [
    {
      pattern: '_build',
      description: 'Build artifacts',
      alwaysSafe: true,
    },
    {
      pattern: 'deps',
      description: 'Dependencies',
      alwaysSafe: true,
    },
    {
      pattern: '.elixir_ls',
      description: 'ElixirLS cache',
      alwaysSafe: true,
    },
  ];
}

export const elixirPlugin = new ElixirPlugin();
