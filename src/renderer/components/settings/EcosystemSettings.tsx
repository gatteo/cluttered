import { useSettingsStore } from '../../store/settingsStore'
import { ecosystemConfigs } from '../../config/ecosystems'

export function EcosystemSettings() {
  const { settings, updateSettings } = useSettingsStore()

  const toggleEcosystem = (id: string) => {
    updateSettings({
      ecosystems: {
        enabled: {
          ...settings.ecosystems.enabled,
          [id]: !settings.ecosystems.enabled[id],
        },
      },
    })
  }

  const ecosystems = Object.values(ecosystemConfigs)

  return (
    <div className='space-y-6 max-w-xl'>
      <h2 className='text-xl font-bold'>Ecosystems</h2>

      <p className='text-text-muted'>
        Choose which development ecosystems Cluttered should scan for. Disabling unused ecosystems can speed up
        scanning.
      </p>

      <div className='grid grid-cols-2 gap-3'>
        {ecosystems.map((eco) => (
          <button
            key={eco.id}
            type='button'
            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
              settings.ecosystems.enabled[eco.id]
                ? 'bg-surface-elevated border-accent-purple/50'
                : 'bg-surface-primary border-white/5 opacity-50'
            }`}
            onClick={() => toggleEcosystem(eco.id)}
          >
            {/* Icon - right side, centered vertically */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              {eco.iconImage ? (
                <img src={eco.iconImage} alt="" className="w-20 h-20 object-contain" />
              ) : (
                <span className='text-6xl'>{eco.icon}</span>
              )}
            </div>

            {/* Content */}
            <div className='relative z-10'>
              <div className='font-medium'>{eco.name}</div>
              <div className='text-xs text-text-muted'>
                {settings.ecosystems.enabled[eco.id] ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
