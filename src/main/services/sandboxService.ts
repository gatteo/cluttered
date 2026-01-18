import { app, dialog, BrowserWindow } from 'electron'
import { appStateRepo } from '../database/repositories/appState'

const BOOKMARKS_KEY = 'security_scoped_bookmarks'

/**
 * Detect if the app is running as a Mac App Store (MAS) build.
 * MAS builds are sandboxed and have different file access restrictions.
 */
export function isMASBuild(): boolean {
  // process.mas is set by electron-builder for MAS builds
  return !!(process as NodeJS.Process & { mas?: boolean }).mas
}

/**
 * Service to manage security-scoped bookmarks for sandboxed MAS apps.
 * Bookmarks allow the app to remember user-granted folder access between sessions.
 */
class SandboxService {
  private activeBookmarks: Map<string, () => void> = new Map()

  /**
   * Check if we have any stored bookmarks (folders the user has granted access to)
   */
  hasStoredBookmarks(): boolean {
    const bookmarks = this.getStoredBookmarks()
    return bookmarks.length > 0
  }

  /**
   * Get list of paths the user has granted access to
   */
  getAccessiblePaths(): string[] {
    const bookmarks = this.getStoredBookmarks()
    return bookmarks.map((b) => b.path)
  }

  /**
   * Show folder picker and create a security-scoped bookmark for the selected folder.
   * Returns the path if successful, null if cancelled.
   */
  async selectAndBookmarkFolder(mainWindow: BrowserWindow): Promise<string | null> {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Folder to Scan',
      message: 'Select a folder containing your development projects. Cluttered will remember this folder.',
      securityScopedBookmarks: isMASBuild(),
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const folderPath = result.filePaths[0]

    // For MAS builds, store the security-scoped bookmark
    if (isMASBuild() && result.bookmarks && result.bookmarks.length > 0) {
      this.storeBookmark(folderPath, result.bookmarks[0])
    }

    return folderPath
  }

  /**
   * Start accessing all stored bookmarks.
   * Must be called before scanning in MAS builds.
   */
  startAccessingBookmarks(): void {
    if (!isMASBuild()) return

    const bookmarks = this.getStoredBookmarks()

    for (const bookmark of bookmarks) {
      if (this.activeBookmarks.has(bookmark.path)) {
        continue // Already accessing this path
      }

      try {
        const stopFn = app.startAccessingSecurityScopedResource(bookmark.data) as () => void
        this.activeBookmarks.set(bookmark.path, stopFn)
        console.log(`[Sandbox] Started accessing: ${bookmark.path}`)
      } catch (error) {
        console.error(`[Sandbox] Failed to start accessing ${bookmark.path}:`, error)
        // Remove invalid bookmark
        this.removeBookmark(bookmark.path)
      }
    }
  }

  /**
   * Stop accessing all bookmarks.
   * Should be called after scanning is complete.
   */
  stopAccessingBookmarks(): void {
    if (!isMASBuild()) return

    for (const [path, stopFn] of this.activeBookmarks) {
      try {
        stopFn()
        console.log(`[Sandbox] Stopped accessing: ${path}`)
      } catch (error) {
        console.error(`[Sandbox] Error stopping access to ${path}:`, error)
      }
    }

    this.activeBookmarks.clear()
  }

  /**
   * Store a security-scoped bookmark for a path
   */
  private storeBookmark(path: string, bookmarkData: string): void {
    const bookmarks = this.getStoredBookmarks()
    const existingIndex = bookmarks.findIndex((b) => b.path === path)

    if (existingIndex >= 0) {
      bookmarks[existingIndex].data = bookmarkData
    } else {
      bookmarks.push({ path, data: bookmarkData })
    }

    appStateRepo.set(BOOKMARKS_KEY, JSON.stringify(bookmarks))
    console.log(`[Sandbox] Stored bookmark for: ${path}`)
  }

  /**
   * Remove a bookmark for a path
   */
  removeBookmark(path: string): void {
    const bookmarks = this.getStoredBookmarks()
    const filtered = bookmarks.filter((b) => b.path !== path)
    appStateRepo.set(BOOKMARKS_KEY, JSON.stringify(filtered))
    console.log(`[Sandbox] Removed bookmark for: ${path}`)
  }

  /**
   * Get all stored bookmarks from the database
   */
  private getStoredBookmarks(): Array<{ path: string; data: string }> {
    try {
      const stored = appStateRepo.get(BOOKMARKS_KEY)
      if (!stored) return []
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
}

export const sandboxService = new SandboxService()
