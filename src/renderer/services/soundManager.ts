import scanStartSound from '../assets/sounds/scan-start.mp3'
import scanCompleteSound from '../assets/sounds/scan-complete.mp3'
import cleanCompleteSound from '../assets/sounds/clean-complete.mp3'

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private enabled = true
  private initialized = false

  constructor() {
    // Delay initialization until first use
  }

  private init() {
    if (this.initialized || typeof window === 'undefined') return
    this.initialized = true
    this.preload()
  }

  private preload() {
    const soundFiles: Record<string, string> = {
      'scan-start': scanStartSound,
      'scan-complete': scanCompleteSound,
      'clean-complete': cleanCompleteSound,
    }

    for (const [name, path] of Object.entries(soundFiles)) {
      try {
        const audio = new Audio(path)
        audio.preload = 'auto'
        audio.volume = 0.5
        this.sounds.set(name, audio)
      } catch {
        // Ignore errors loading sounds
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  play(sound: string, options?: { volume?: number; rate?: number }) {
    if (!this.enabled) return
    this.init()

    const audio = this.sounds.get(sound)
    if (!audio) return

    try {
      // Clone for overlapping sounds
      const clone = audio.cloneNode() as HTMLAudioElement
      if (options?.volume) clone.volume = options.volume
      if (options?.rate) clone.playbackRate = options.rate

      clone.play().catch(() => {
        // Ignore autoplay errors
      })
    } catch {
      // Ignore errors
    }
  }

  // Play sound with pitch based on size
  playCleanSound(bytesFreed: number) {
    const gb = bytesFreed / (1024 * 1024 * 1024)
    // Higher pitch for bigger cleanup
    const rate = 0.8 + Math.min(gb / 10, 0.4)
    this.play('clean-complete', { rate })
  }
}

export const soundManager = new SoundManager()
