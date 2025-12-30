import { quotaService } from '../services/quotaService'

export const quotaHandlers = {
  get: () => {
    return quotaService.getQuotaInfo()
  },

  canClean: (bytes: number) => {
    return quotaService.canClean(bytes)
  },
}
