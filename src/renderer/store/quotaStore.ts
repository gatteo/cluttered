import { create } from 'zustand'

interface QuotaInfo {
  isPro: boolean
  used: number
  limit: number
  remaining: number
  percentUsed: number
  resetAt: string | null
  canClean: boolean
}

interface QuotaState {
  quota: QuotaInfo | null
  isLoading: boolean

  loadQuota: () => Promise<void>
  checkCanClean: (bytes: number) => Promise<{ allowed: boolean; reason?: string }>
}

export const useQuotaStore = create<QuotaState>((set) => ({
  quota: null,
  isLoading: true,

  loadQuota: async () => {
    try {
      const quota = await window.electronAPI.quota.get()
      set({ quota, isLoading: false })
    } catch (error) {
      console.error('[QuotaStore] Failed to load quota:', error)
      set({ isLoading: false })
    }
  },

  checkCanClean: async (bytes: number) => {
    return window.electronAPI.quota.canClean(bytes)
  },
}))

// Load quota on app start
if (typeof window !== 'undefined' && window.electronAPI?.quota) {
  useQuotaStore.getState().loadQuota()
}
