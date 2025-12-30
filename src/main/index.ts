import dotenv from 'dotenv'
import path from 'path'
import { app, BrowserWindow } from 'electron'
import { initDatabase, closeDatabase } from './database'
import { registerIPCHandlers } from './ipc'
import { analyticsService } from './services/analyticsService'
import { licenseService } from './services/licensing/licenseService'
import { schedulerService } from './services/schedulerService'

// Load .env from project root (works in both dev and production)
// In dev: __dirname is dist/main/main/, so go up 3 levels to project root
// In production: .env should be in resources
const envPath = app.isPackaged ? path.join(process.resourcesPath, '.env') : path.join(__dirname, '../../../.env')
dotenv.config({ path: envPath })

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    backgroundColor: '#0A0A0F',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // Register IPC handlers with access to mainWindow
  registerIPCHandlers(mainWindow)

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  // Initialize database
  initDatabase()

  // Initialize license service (after database)
  licenseService.init()

  // Start scheduler service (after license service)
  schedulerService.start()

  // Initialize analytics (after database so settings are available)
  await analyticsService.init()

  // Create window
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  schedulerService.stop()
  await analyticsService.shutdown()
  closeDatabase()
})

export { mainWindow }
