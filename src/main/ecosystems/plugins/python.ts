import { BaseEcosystemPlugin } from '../base'

export class PythonPlugin extends BaseEcosystemPlugin {
  id = 'python'
  name = 'Python'
  icon = '🐍'
  color = '#EAB308'
  detectionFiles = ['requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile']
  cleanablePatterns = [
    {
      pattern: '__pycache__',
      description: 'Python bytecode cache',
      alwaysSafe: true,
    },
    {
      pattern: '.venv',
      description: 'Virtual environment',
      alwaysSafe: true,
    },
    {
      pattern: 'venv',
      description: 'Virtual environment',
      alwaysSafe: true,
    },
    {
      pattern: 'env',
      description: 'Virtual environment',
      alwaysSafe: false, // Could be config folder
    },
    {
      pattern: '.pytest_cache',
      description: 'Pytest cache',
      alwaysSafe: true,
    },
    {
      pattern: '.mypy_cache',
      description: 'Mypy cache',
      alwaysSafe: true,
    },
    {
      pattern: '.ruff_cache',
      description: 'Ruff cache',
      alwaysSafe: true,
    },
    {
      pattern: 'dist',
      description: 'Build distribution',
      alwaysSafe: true,
    },
    {
      pattern: 'build',
      description: 'Build output',
      alwaysSafe: true,
    },
    {
      pattern: '.tox',
      description: 'Tox environments',
      alwaysSafe: true,
    },
    {
      pattern: '.nox',
      description: 'Nox environments',
      alwaysSafe: true,
    },
    {
      pattern: 'htmlcov',
      description: 'Coverage HTML report',
      alwaysSafe: true,
    },
  ]
}

export const pythonPlugin = new PythonPlugin()
