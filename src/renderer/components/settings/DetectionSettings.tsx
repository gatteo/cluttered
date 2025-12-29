import { useSettingsStore } from '../../store/settingsStore'
import { SettingsSection, SettingsToggle, SettingsSlider } from './SettingsComponents'

export function DetectionSettings() {
  const { settings, updateSettings } = useSettingsStore()

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-xl font-bold">Project Detection</h2>

      <p className="text-text-muted">Configure how Cluttered determines whether a project is active, recent, stale, or dormant.</p>

      <SettingsSection title="Activity Thresholds">
        <SettingsSlider
          label="Active threshold"
          description="Projects modified within this many days are considered active and protected"
          value={settings.detection.activeThresholdDays}
          min={1}
          max={30}
          unit="days"
          color="bg-green-500"
          onChange={(value) =>
            updateSettings({
              detection: { activeThresholdDays: value },
            })
          }
        />

        <SettingsSlider
          label="Recent threshold"
          description="Projects modified within this many days require confirmation before cleaning"
          value={settings.detection.recentThresholdDays}
          min={7}
          max={90}
          unit="days"
          color="bg-yellow-500"
          onChange={(value) =>
            updateSettings({
              detection: { recentThresholdDays: value },
            })
          }
        />

        <SettingsSlider
          label="Stale threshold"
          description="Projects older than this are considered stale and safe to clean"
          value={settings.detection.staleThresholdDays}
          min={30}
          max={365}
          unit="days"
          color="bg-orange-500"
          onChange={(value) =>
            updateSettings({
              detection: { staleThresholdDays: value },
            })
          }
        />
      </SettingsSection>

      <SettingsSection title="Activity Signals">
        <SettingsToggle
          label="Consider Git activity"
          description="Use last commit date to determine project activity"
          value={settings.detection.considerGitActivity}
          onChange={(value) =>
            updateSettings({
              detection: { considerGitActivity: value },
            })
          }
        />

        <SettingsToggle
          label="Consider IDE activity"
          description="Check .vscode and .idea folders for recent usage"
          value={settings.detection.considerIDEActivity}
          onChange={(value) =>
            updateSettings({
              detection: { considerIDEActivity: value },
            })
          }
        />
      </SettingsSection>
    </div>
  )
}
