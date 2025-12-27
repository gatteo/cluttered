import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { SettingsSection, SettingsToggle, SettingsSelect } from './SettingsComponents'

export function GeneralSettings() {
  const { settings, updateSettings, resetSettings } = useSettingsStore()
  const [isResetting, setIsResetting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleReset = async () => {
    setIsResetting(true)
    await resetSettings()
    setIsResetting(false)
    setShowConfirm(false)
  }

  return (
    <div className='space-y-6 max-w-xl'>
      <h2 className='text-xl font-bold'>General Settings</h2>

      <SettingsSection title='Startup'>
        <SettingsToggle
          label='Start Cluttered at login'
          description='Automatically launch when you log in to your Mac'
          value={settings.general.startAtLogin}
          onChange={(value) => updateSettings({ general: { startAtLogin: value } })}
        />
      </SettingsSection>

      <SettingsSection title='Updates'>
        <SettingsToggle
          label='Check for updates automatically'
          description='Notify when a new version is available'
          value={settings.general.checkForUpdates}
          onChange={(value) => updateSettings({ general: { checkForUpdates: value } })}
        />
      </SettingsSection>

      <SettingsSection title='Privacy'>
        <SettingsToggle
          label='Send anonymous usage statistics'
          description='Help improve Cluttered by sharing anonymous data'
          value={settings.general.sendAnalytics}
          onChange={(value) => updateSettings({ general: { sendAnalytics: value } })}
        />
      </SettingsSection>

      <SettingsSection title='Appearance'>
        <SettingsSelect
          label='Theme'
          value={settings.general.theme}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light (Coming Soon)', disabled: true },
            { value: 'system', label: 'System (Coming Soon)', disabled: true },
          ]}
          onChange={(value) => updateSettings({ general: { theme: value as 'dark' | 'light' | 'system' } })}
        />
      </SettingsSection>

      <SettingsSection title='Reset'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='font-medium'>Reset to Defaults</p>
            <p className='text-sm text-text-muted'>Restore all settings to their original values</p>
          </div>
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className='btn-secondary px-4 py-2 rounded-lg flex items-center gap-2'
            >
              <RotateCcw size={16} />
              Reset
            </button>
          ) : (
            <div className='flex items-center gap-2'>
              <button onClick={() => setShowConfirm(false)} className='btn-ghost px-3 py-2 rounded-lg text-sm'>
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className='btn-primary px-4 py-2 rounded-lg flex items-center gap-2 bg-red-500 hover:bg-red-600'
              >
                {isResetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          )}
        </div>
      </SettingsSection>
    </div>
  )
}
