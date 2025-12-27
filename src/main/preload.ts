import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),

  // Scanner (will be implemented in Task 03)
  startScan: (options?: any) => ipcRenderer.invoke('scan:start', options),
  cancelScan: () => ipcRenderer.invoke('scan:cancel'),
  getCachedResults: () => ipcRenderer.invoke('scan:getCached'),
  onScanProgress: (callback: (progress: any) => void) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on('scan:progress', subscription);
    return () => ipcRenderer.removeListener('scan:progress', subscription);
  },

  // Cleaner (will be implemented in Task 09)
  cleanProjects: (options: any) => ipcRenderer.invoke('clean:start', options),
  onCleanProgress: (callback: (progress: any) => void) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on('clean:progress', subscription);
    return () => ipcRenderer.removeListener('clean:progress', subscription);
  },

  // Settings (will be implemented in Task 10)
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: any) => ipcRenderer.invoke('settings:set', settings),

  // Statistics
  getStatistics: () => ipcRenderer.invoke('stats:get'),

  // Deletion Log
  getDeletionLog: () => ipcRenderer.invoke('deletionLog:get'),
  restoreFromLog: (entryId: string) => ipcRenderer.invoke('deletionLog:restore', entryId),

  // System actions
  openInFinder: (path: string) => ipcRenderer.invoke('system:openInFinder', path),
  openInTerminal: (path: string) => ipcRenderer.invoke('system:openInTerminal', path),
  openInVSCode: (path: string) => ipcRenderer.invoke('system:openInVSCode', path),
  getDiskSpace: () => ipcRenderer.invoke('system:getDiskSpace'),
  selectFolder: () => ipcRenderer.invoke('system:selectFolder'),
  triggerHaptic: (pattern: string) => ipcRenderer.invoke('system:haptic', pattern),

  // First run check
  isFirstRun: () => ipcRenderer.invoke('app:isFirstRun'),
});
