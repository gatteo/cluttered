import { EcosystemId } from '../types'
import reactNativeIcon from '../assets/icons/react_native.webp'
import nodejsIcon from '../assets/icons/nodejs.webp'
import dockerIcon from '../assets/icons/docker.webp'
import androidIcon from '../assets/icons/android.webp'
import pythonIcon from '../assets/icons/python.webp'
import goIcon from '../assets/icons/go.webp'
import rustIcon from '../assets/icons/rust.webp'
import rubyIcon from '../assets/icons/ruby.webp'
import phpIcon from '../assets/icons/php.webp'
import javaIcon from '../assets/icons/java.webp'
import dotnetIcon from '../assets/icons/dotnet.webp'
import xcodeIcon from '../assets/icons/xcode.webp'
import elixirIcon from '../assets/icons/elixir.webp'

interface EcosystemConfig {
  id: EcosystemId
  name: string
  icon: string
  iconImage?: string
  color: string
}

export type { EcosystemConfig }

export const ecosystemConfigs: Record<EcosystemId, EcosystemConfig> & Record<string, EcosystemConfig | undefined> = {
  'react-native': {
    id: 'react-native',
    name: 'React Native',
    icon: '📱',
    iconImage: reactNativeIcon,
    color: '#61DAFB',
  },
  nodejs: { id: 'nodejs', name: 'Node.js', icon: '📦', iconImage: nodejsIcon, color: '#22C55E' },
  rust: { id: 'rust', name: 'Rust', icon: '🦀', iconImage: rustIcon, color: '#DEA584' },
  xcode: { id: 'xcode', name: 'iOS / Xcode', icon: '🍎', iconImage: xcodeIcon, color: '#007AFF' },
  android: { id: 'android', name: 'Android', icon: '🤖', iconImage: androidIcon, color: '#3DDC84' },
  python: { id: 'python', name: 'Python', icon: '🐍', iconImage: pythonIcon, color: '#EAB308' },
  go: { id: 'go', name: 'Go', icon: '🐹', iconImage: goIcon, color: '#00ADD8' },
  docker: { id: 'docker', name: 'Docker', icon: '🐳', iconImage: dockerIcon, color: '#2496ED' },
  ruby: { id: 'ruby', name: 'Ruby', icon: '💎', iconImage: rubyIcon, color: '#CC342D' },
  php: { id: 'php', name: 'PHP', icon: '🐘', iconImage: phpIcon, color: '#777BB4' },
  java: { id: 'java', name: 'Java', icon: '☕', iconImage: javaIcon, color: '#ED8B00' },
  elixir: { id: 'elixir', name: 'Elixir', icon: '💧', iconImage: elixirIcon, color: '#6E4A7E' },
  dotnet: { id: 'dotnet', name: '.NET', icon: '🔵', iconImage: dotnetIcon, color: '#512BD4' },
}
