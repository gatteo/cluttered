import { create } from 'zustand'

type ViewType = 'dashboard' | 'ecosystem' | 'settings'
type EcosystemId = string

interface UIState {
  currentView: ViewType
  selectedEcosystem: EcosystemId | null
  showConfirmDialog: boolean
  showDryRunPreview: boolean

  // Actions
  setView: (view: ViewType) => void
  setSelectedEcosystem: (ecosystem: EcosystemId | null) => void
  goToEcosystem: (ecosystem: EcosystemId) => void
  goBack: () => void
  showConfirm: () => void
  hideConfirm: () => void
  showPreview: () => void
  hidePreview: () => void
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'dashboard',
  selectedEcosystem: null,
  showConfirmDialog: false,
  showDryRunPreview: false,

  setView: (view) => set({ currentView: view }),

  setSelectedEcosystem: (ecosystem) => set({ selectedEcosystem: ecosystem }),

  goToEcosystem: (ecosystem) =>
    set({
      currentView: 'ecosystem',
      selectedEcosystem: ecosystem,
    }),

  goBack: () =>
    set({
      currentView: 'dashboard',
      selectedEcosystem: null,
    }),

  showConfirm: () => set({ showConfirmDialog: true }),
  hideConfirm: () => set({ showConfirmDialog: false }),

  showPreview: () => set({ showDryRunPreview: true }),
  hidePreview: () => set({ showDryRunPreview: false }),
}))
