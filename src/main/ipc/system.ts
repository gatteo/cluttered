import { shell, dialog, BrowserWindow } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import checkDiskSpace from 'check-disk-space'
import { homedir } from 'os'
import { DiskSpace } from '../../shared/types'
import { sandboxService, isMASBuild } from '../services/sandboxService'

const execAsync = promisify(exec)

export const systemHandlers = {
  async openInFinder(path: string): Promise<void> {
    await shell.openPath(path)
  },

  async openInTerminal(path: string): Promise<void> {
    // macOS specific
    if (process.platform === 'darwin') {
      await execAsync(`open -a Terminal "${path}"`)
    } else if (process.platform === 'win32') {
      await execAsync(`start cmd /K "cd /d ${path}"`)
    } else {
      // Linux - try common terminals
      try {
        await execAsync(`gnome-terminal --working-directory="${path}"`)
      } catch {
        await execAsync(`xterm -e "cd ${path} && bash"`)
      }
    }
  },

  async openInVSCode(path: string): Promise<void> {
    try {
      await execAsync(`code "${path}"`)
    } catch {
      // VS Code not in PATH, try application directly on macOS
      if (process.platform === 'darwin') {
        await execAsync(`open -a "Visual Studio Code" "${path}"`)
      } else {
        throw new Error('VS Code not found')
      }
    }
  },

  async getDiskSpace(): Promise<DiskSpace> {
    const home = homedir()
    const space = await checkDiskSpace(home)

    return {
      total: space.size,
      free: space.free,
      used: space.size - space.free,
    }
  },

  async selectFolder(mainWindow: BrowserWindow): Promise<string | null> {
    // For MAS builds, use the sandbox service to create security-scoped bookmarks
    if (isMASBuild()) {
      return sandboxService.selectAndBookmarkFolder(mainWindow)
    }

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Folder',
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  },

  async isMASBuild(): Promise<boolean> {
    return isMASBuild()
  },

  async hasAccessiblePaths(): Promise<boolean> {
    if (!isMASBuild()) return true
    return sandboxService.hasStoredBookmarks()
  },

  async getAccessiblePaths(): Promise<string[]> {
    if (!isMASBuild()) return []
    return sandboxService.getAccessiblePaths()
  },

  async removeAccessiblePath(path: string): Promise<void> {
    if (isMASBuild()) {
      sandboxService.removeBookmark(path)
    }
  },

  async triggerHaptic(_pattern: 'light' | 'medium' | 'heavy'): Promise<void> {
    // Haptic feedback is primarily for macOS trackpads
    // This is a no-op on other platforms
    // The actual implementation would require native modules
    // For MVP, we'll skip actual haptic implementation
  },

  async openExternal(url: string): Promise<void> {
    await shell.openExternal(url)
  },
}
