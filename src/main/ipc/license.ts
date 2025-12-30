import { shell } from 'electron'
import { licenseService } from '../services/licensing/licenseService'

export const licenseHandlers = {
  isPro: () => {
    return licenseService.isPro()
  },

  get: () => {
    return licenseService.getLicense()
  },

  activate: async (key: string) => {
    return licenseService.activateLicense(key)
  },

  deactivate: () => {
    licenseService.deactivateLicense()
    return true
  },

  getCheckoutUrl: async (email?: string) => {
    return licenseService.getCheckoutUrl('stripe', email)
  },

  openCheckout: async (email?: string) => {
    const url = await licenseService.getCheckoutUrl('stripe', email)
    if (url) {
      shell.openExternal(url)
      return true
    }
    return false
  },
}
