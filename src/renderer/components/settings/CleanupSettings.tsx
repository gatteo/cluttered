import { useSettingsStore } from '../../store/settingsStore';
import { SettingsSection, SettingsToggle, SettingsRadio } from './SettingsComponents';

export function CleanupSettings() {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-xl font-bold">Cleanup Preferences</h2>

      <SettingsSection title="Deletion Method">
        <SettingsRadio
          value={settings.cleanup.moveToTrash ? 'trash' : 'permanent'}
          options={[
            {
              value: 'trash',
              label: 'Move to Trash',
              description: 'Safe option - files can be recovered from Trash',
            },
            {
              value: 'permanent',
              label: 'Permanent delete',
              description: 'Files are deleted immediately and cannot be recovered',
              warning: true,
            },
          ]}
          onChange={(value) => updateSettings({
            cleanup: { moveToTrash: value === 'trash' }
          })}
        />
      </SettingsSection>

      <SettingsSection title="Confirmations">
        <SettingsToggle
          label="Confirm before cleaning recent projects"
          description="Show a warning when cleaning projects modified in the last 30 days"
          value={settings.cleanup.confirmRecentProjects}
          onChange={(value) => updateSettings({
            cleanup: { confirmRecentProjects: value }
          })}
        />
      </SettingsSection>

      <SettingsSection title="Feedback">
        <SettingsToggle
          label="Sound effects"
          description="Play satisfying sounds during scanning and cleaning"
          value={settings.cleanup.soundEffects}
          onChange={(value) => updateSettings({
            cleanup: { soundEffects: value }
          })}
        />

        <SettingsToggle
          label="Haptic feedback"
          description="Enable trackpad haptics on MacBook (Force Touch)"
          value={settings.cleanup.hapticFeedback}
          onChange={(value) => updateSettings({
            cleanup: { hapticFeedback: value }
          })}
        />
      </SettingsSection>
    </div>
  );
}
