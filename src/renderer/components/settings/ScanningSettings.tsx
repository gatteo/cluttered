import { useSettingsStore } from '../../store/settingsStore'
import { SettingsSection, SettingsToggle, PathListManager } from './SettingsComponents'

export function ScanningSettings() {
  const { settings, updateSettings } = useSettingsStore()

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-xl font-bold">Scanning Settings</h2>

      <SettingsSection title="Directories to Scan" description="Cluttered will look for projects in these directories">
        <PathListManager
          paths={settings.scanning.scanPaths}
          onChange={(paths) =>
            updateSettings({
              scanning: { scanPaths: paths },
            })
          }
          placeholder="Add directory to scan..."
        />
      </SettingsSection>

      <SettingsSection title="Excluded Directories" description="These directories will be skipped during scanning">
        <PathListManager
          paths={settings.scanning.excludePaths}
          onChange={(paths) =>
            updateSettings({
              scanning: { excludePaths: paths },
            })
          }
          placeholder="Add directory to exclude..."
        />
      </SettingsSection>

      <SettingsSection title="Protected Paths" description="Projects in these directories will never be cleaned">
        <PathListManager
          paths={settings.scanning.protectedPaths}
          onChange={(paths) =>
            updateSettings({
              scanning: { protectedPaths: paths },
            })
          }
          placeholder="Add protected path..."
        />
      </SettingsSection>

      <SettingsSection title="Advanced">
        <SettingsToggle
          label="Follow symbolic links"
          description="Include symlinked directories in scans (may slow down scanning)"
          value={settings.scanning.followSymlinks}
          onChange={(value) =>
            updateSettings({
              scanning: { followSymlinks: value },
            })
          }
        />
      </SettingsSection>
    </div>
  )
}
