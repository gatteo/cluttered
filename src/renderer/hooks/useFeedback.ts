import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { soundManager } from '../services/soundManager';

export function useFeedback() {
  const settings = useSettingsStore((s) => s.settings);

  useEffect(() => {
    soundManager.setEnabled(settings?.cleanup.soundEffects ?? true);
  }, [settings?.cleanup.soundEffects]);

  return {
    playSound: (sound: string) => soundManager.play(sound),
    triggerHaptic: (pattern: 'light' | 'medium' | 'heavy') => {
      if (settings?.cleanup.hapticFeedback) {
        window.electronAPI.triggerHaptic(pattern);
      }
    },
  };
}
