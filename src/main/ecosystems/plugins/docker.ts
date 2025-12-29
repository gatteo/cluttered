import { BaseEcosystemPlugin } from '../base'

export class DockerPlugin extends BaseEcosystemPlugin {
  id = 'docker'
  name = 'Docker'
  icon = '🐳'
  color = '#2496ED'
  detectionFiles = ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml']
  cleanablePatterns = []
  // Docker cleanup is handled differently - through Docker API
  // This plugin mainly detects Docker projects
}

export const dockerPlugin = new DockerPlugin()
