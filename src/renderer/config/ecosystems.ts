import { EcosystemId } from '../types';
import reactNativeIcon from '../assets/icons/react_native.png';
import nodejsIcon from '../assets/icons/nodejs.png';
import dockerIcon from '../assets/icons/docker.png';
import androidIcon from '../assets/icons/android.png';
import pythonIcon from '../assets/icons/python.png';
import goIcon from '../assets/icons/go.png';
import rustIcon from '../assets/icons/rust.png';
import rubyIcon from '../assets/icons/ruby.png';
import phpIcon from '../assets/icons/php.png';
import javaIcon from '../assets/icons/java.png';
import dotnetIcon from '../assets/icons/dotnet.png';
import xcodeIcon from '../assets/icons/xcode.png';
import elixirIcon from '../assets/icons/elixir.png';

interface EcosystemConfig {
  id: EcosystemId;
  name: string;
  icon: string;
  iconImage?: string;
  color: string;
}

export const ecosystemConfigs: Record<EcosystemId, EcosystemConfig> = {
  'react-native': { id: 'react-native', name: 'React Native', icon: '📱', iconImage: reactNativeIcon, color: '#61DAFB' },
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
};
