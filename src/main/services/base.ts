import { BrowserWindow } from 'electron'

export abstract class BaseService {
  private static mainWindow: BrowserWindow | null = null

  static setMainWindow(window: BrowserWindow) {
    console.log('[BaseService] setMainWindow called, window:', window ? 'set' : 'null')
    BaseService.mainWindow = window
  }

  protected sendToRenderer(channel: string, data: unknown) {
    if (BaseService.mainWindow && !BaseService.mainWindow.isDestroyed()) {
      BaseService.mainWindow.webContents.send(channel, data)
    } else {
      console.warn('[BaseService] Cannot send to renderer:', channel, '- mainWindow is', BaseService.mainWindow ? 'destroyed' : 'null')
    }
  }
}
