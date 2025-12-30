import { ScheduledScansSettings } from './ScheduledScansSettings'
import { AutoCleanSettings } from './AutoCleanSettings'

export function AutomationSettings() {
  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-6">Automation</h2>
        <p className="text-text-muted mb-6">Configure automatic scanning and cleaning.</p>
      </div>

      <div className="glass-card p-6">
        <ScheduledScansSettings />
      </div>

      <div className="glass-card p-6">
        <AutoCleanSettings />
      </div>
    </div>
  )
}
