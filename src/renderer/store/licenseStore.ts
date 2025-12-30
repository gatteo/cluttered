import { create } from 'zustand'

interface LicenseInfo {
  email: string | null
  provider: string
  purchasedAt: string
  isValid: boolean
}

interface LicenseState {
  isPro: boolean
  license: LicenseInfo | null
  isLoading: boolean
  error: string | null

  // Actions
  checkLicense: () => Promise<void>
  activateLicense: (key: string) => Promise<{ success: boolean; error?: string }>
  deactivateLicense: () => Promise<void>
  openCheckout: (email?: string) => Promise<void>
  clearError: () => void
}

export const useLicenseStore = create<LicenseState>((set) => ({
  isPro: false,
  license: null,
  isLoading: true,
  error: null,

  checkLicense: async () => {
    try {
      const [isPro, license] = await Promise.all([window.electronAPI.license.isPro(), window.electronAPI.license.get()])
      set({ isPro, license, isLoading: false })
    } catch (error) {
      console.error('[LicenseStore] Failed to check license:', error)
      set({ isLoading: false })
    }
  },

  activateLicense: async (key: string) => {
    set({ error: null })

    try {
      const result = await window.electronAPI.license.activate(key)

      if (result.isValid) {
        const license = await window.electronAPI.license.get()
        set({ isPro: true, license })
        return { success: true }
      }

      set({ error: result.error })
      return { success: false, error: result.error }
    } catch (error) {
      const errorMsg = String(error)
      set({ error: errorMsg })
      return { success: false, error: errorMsg }
    }
  },

  deactivateLicense: async () => {
    await window.electronAPI.license.deactivate()
    set({ isPro: false, license: null })
  },

  openCheckout: async (email?: string) => {
    await window.electronAPI.license.openCheckout(email)
  },

  clearError: () => set({ error: null }),
}))

// Check license on app start
if (typeof window !== 'undefined' && window.electronAPI?.license) {
  useLicenseStore.getState().checkLicense()
}
