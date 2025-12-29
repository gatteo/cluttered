import { BaseEcosystemPlugin } from '../base'

export class NodejsPlugin extends BaseEcosystemPlugin {
  id = 'nodejs'
  name = 'Node.js'
  icon = '📦'
  color = '#22C55E'
  detectionFiles = ['package.json']
  cleanablePatterns = [
    {
      pattern: 'node_modules',
      description: 'NPM dependencies',
      alwaysSafe: true,
    },
    {
      pattern: '.next',
      description: 'Next.js build cache',
      alwaysSafe: true,
    },
    {
      pattern: '.nuxt',
      description: 'Nuxt.js build cache',
      alwaysSafe: true,
    },
    {
      pattern: '.output',
      description: 'Nuxt 3 output',
      alwaysSafe: true,
    },
    {
      pattern: 'dist',
      description: 'Build output',
      alwaysSafe: true,
    },
    {
      pattern: 'build',
      description: 'Build output',
      alwaysSafe: true,
    },
    {
      pattern: '.turbo',
      description: 'Turborepo cache',
      alwaysSafe: true,
    },
    {
      pattern: '.parcel-cache',
      description: 'Parcel cache',
      alwaysSafe: true,
    },
    {
      pattern: '.cache',
      description: 'General cache',
      alwaysSafe: true,
    },
    {
      pattern: 'coverage',
      description: 'Test coverage reports',
      alwaysSafe: true,
    },
    {
      pattern: '.nyc_output',
      description: 'NYC coverage output',
      alwaysSafe: true,
    },
    {
      pattern: '.svelte-kit',
      description: 'SvelteKit cache',
      alwaysSafe: true,
    },
    {
      pattern: '.astro',
      description: 'Astro cache',
      alwaysSafe: true,
    },
    {
      pattern: '.vercel',
      description: 'Vercel cache',
      alwaysSafe: true,
    },
    {
      pattern: 'storybook-static',
      description: 'Storybook build',
      alwaysSafe: true,
    },
  ]
}

export const nodejsPlugin = new NodejsPlugin()
