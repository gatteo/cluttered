import { ipcMain, BrowserWindow } from 'electron'
import { scannerHandlers } from './scanner'
import { cleanerHandlers } from './cleaner'
import { settingsHandlers } from './settings'
import { systemHandlers } from './system'
import { analyticsHandlers } from './analytics'
import { licenseHandlers } from './license'
import { quotaHandlers } from './quota'
import { schedulerHandlers } from './scheduler'
import { autoCleanHandlers } from './autoClean'

export function registerIPCHandlers(mainWindow: BrowserWindow) {
  // Scanner
  ipcMain.handle('scan:start', (event, options) => scannerHandlers.start(mainWindow, options))
  ipcMain.handle('scan:cancel', () => scannerHandlers.cancel())
  ipcMain.handle('scan:getCached', () => scannerHandlers.getCached())

  // Cleaner
  ipcMain.handle('clean:start', (event, options) => cleanerHandlers.start(mainWindow, options))
  ipcMain.handle('clean:preview', (event, options) => cleanerHandlers.preview(options))

  // Settings
  ipcMain.handle('settings:get', () => settingsHandlers.get())
  ipcMain.handle('settings:set', (event, settings) => settingsHandlers.set(settings))
  ipcMain.handle('settings:reset', () => settingsHandlers.reset())

  // Statistics
  ipcMain.handle('stats:get', () => settingsHandlers.getStats())

  // Deletion Log
  ipcMain.handle('deletionLog:get', () => cleanerHandlers.getDeletionLog())
  ipcMain.handle('deletionLog:restore', (event, entryId) => cleanerHandlers.restore(entryId))

  // System
  ipcMain.handle('system:openInFinder', (event, path) => systemHandlers.openInFinder(path))
  ipcMain.handle('system:openInTerminal', (event, path) => systemHandlers.openInTerminal(path))
  ipcMain.handle('system:openInVSCode', (event, path) => systemHandlers.openInVSCode(path))
  ipcMain.handle('system:getDiskSpace', () => systemHandlers.getDiskSpace())
  ipcMain.handle('system:selectFolder', () => systemHandlers.selectFolder(mainWindow))
  ipcMain.handle('system:haptic', (event, pattern) => systemHandlers.triggerHaptic(pattern))

  // App state
  ipcMain.handle('app:isFirstRun', () => settingsHandlers.isFirstRun())

  // Analytics
  ipcMain.handle('analytics:track', (event, eventName, properties) => analyticsHandlers.track(eventName, properties))
  ipcMain.handle('analytics:updateEnabled', (event, enabled) => analyticsHandlers.updateEnabled(enabled))

  // License
  ipcMain.handle('license:isPro', () => licenseHandlers.isPro())
  ipcMain.handle('license:get', () => licenseHandlers.get())
  ipcMain.handle('license:activate', (event, key: string) => licenseHandlers.activate(key))
  ipcMain.handle('license:deactivate', () => licenseHandlers.deactivate())
  ipcMain.handle('license:getCheckoutUrl', (event, email?: string) => licenseHandlers.getCheckoutUrl(email))
  ipcMain.handle('license:openCheckout', (event, email?: string) => licenseHandlers.openCheckout(email))

  // Quota
  ipcMain.handle('quota:get', () => quotaHandlers.get())
  ipcMain.handle('quota:canClean', (event, bytes: number) => quotaHandlers.canClean(bytes))

  // Scheduler
  ipcMain.handle('scheduler:getSettings', () => schedulerHandlers.getSettings())
  ipcMain.handle('scheduler:saveSettings', (event, settings) => schedulerHandlers.saveSettings(settings))
  ipcMain.handle('scheduler:runNow', () => schedulerHandlers.runNow())

  // Auto-clean
  ipcMain.handle('autoClean:getSettings', () => autoCleanHandlers.getSettings())
  ipcMain.handle('autoClean:saveSettings', (event, settings) => autoCleanHandlers.saveSettings(settings))
  ipcMain.handle('autoClean:runNow', () => autoCleanHandlers.runNow())
}
