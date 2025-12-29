import { create } from 'zustand'

interface Settings {
  general: {
    startAtLogin: boolean
    checkForUpdates: boolean
    sendAnalytics: boolean
    theme: 'light' | 'dark' | 'system'
  }
  scanning: {
    scanPaths: string[]
    excludePaths: string[]
    protectedPaths: string[]
    followSymlinks: boolean
  }
  detection: {
    activeThresholdDays: number
    recentThresholdDays: number
    staleThresholdDays: number
    considerGitActivity: boolean
    considerIDEActivity: boolean
  }
  cleanup: {
    moveToTrash: boolean
    confirmRecentProjects: boolean
    soundEffects: boolean
    hapticFeedback: boolean
  }
  ecosystems: {
    enabled: Record<string, boolean>
  }
}

const defaultSettings: Settings = {
  general: {
    startAtLogin: false,
    checkForUpdates: true,
    sendAnalytics: true,
    theme: 'dark',
  },
  scanning: {
    scanPaths: ['~/'],
    excludePaths: [],
    protectedPaths: [],
    followSymlinks: false,
  },
  detection: {
    activeThresholdDays: 7,
    recentThresholdDays: 30,
    staleThresholdDays: 90,
    considerGitActivity: true,
    considerIDEActivity: true,
  },
  cleanup: {
    moveToTrash: true,
    confirmRecentProjects: true,
    soundEffects: true,
    hapticFeedback: true,
  },
  ecosystems: {
    enabled: {
      nodejs: true,
      rust: true,
      xcode: true,
      android: true,
      python: true,
      go: true,
      docker: true,
      ruby: true,
      php: true,
      java: true,
      elixir: true,
      dotnet: true,
    },
  },
}

interface SettingsState {
  settings: Settings
  isLoading: boolean

  loadSettings: () => Promise<void>
  updateSettings: (partial: DeepPartial<Settings>) => Promise<void>
  resetSettings: () => Promise<void>
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

function deepMerge<T extends Record<string, any>>(target: T, source: DeepPartial<T>): T {
  const result = { ...target }

  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null
      ) {
        result[key] = deepMerge(target[key], source[key] as any)
      } else {
        result[key] = source[key] as any
      }
    }
  }

  return result
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  isLoading: true,

  loadSettings: async () => {
    set({ isLoading: true })
    try {
      const settings = await window.electronAPI.getSettings()
      set({ settings: deepMerge(defaultSettings, settings), isLoading: false })
    } catch (error) {
      console.error('Failed to load settings:', error)
      set({ isLoading: false })
    }
  },

  updateSettings: async (partial) => {
    const merged = deepMerge(get().settings, partial)
    set({ settings: merged })
    try {
      await window.electronAPI.setSettings(merged)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  },

  resetSettings: async () => {
    set({ settings: defaultSettings })
    try {
      await window.electronAPI.setSettings(defaultSettings)
    } catch (error) {
      console.error('Failed to reset settings:', error)
    }
  },
}))
