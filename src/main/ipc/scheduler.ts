import { scheduledScanRepo, ScanFrequency } from '../database/repositories/scheduledScan'
import { schedulerService } from '../services/schedulerService'
import { licenseService } from '../services/licensing/licenseService'

export const schedulerHandlers = {
  getSettings: () => {
    return scheduledScanRepo.get()
  },

  saveSettings: (settings: {
    enabled?: boolean
    frequency?: ScanFrequency
    timeHour?: number
    timeMinute?: number
    dayOfWeek?: number
    notifyThresholdBytes?: number
  }) => {
    if (!licenseService.isPro()) {
      throw new Error('Scheduled scans require Pro')
    }

    scheduledScanRepo.save(settings)
    return scheduledScanRepo.get()
  },

  runNow: async () => {
    if (!licenseService.isPro()) {
      throw new Error('Scheduled scans require Pro')
    }

    await schedulerService.runNow()
    return true
  },
}
