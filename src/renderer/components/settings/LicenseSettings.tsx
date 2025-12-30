import { useState } from 'react'
import { useLicenseStore } from '../../store/licenseStore'
import { ProBadge } from '../ProBadge'
import { UpgradeModal } from '../UpgradeModal'
import { formatRelativeTime } from '../../utils/format'
import { Shield, Mail, Calendar, AlertTriangle } from 'lucide-react'

export function LicenseSettings() {
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)

  const { isPro, license, deactivateLicense } = useLicenseStore()

  const handleDeactivate = async () => {
    await deactivateLicense()
    setShowDeactivateConfirm(false)
  }

  if (isPro && license) {
    return (
      <div className="max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold">License</h2>
          <ProBadge />
        </div>

        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-accent-green" />
            <div>
              <p className="text-text-muted text-sm">Status</p>
              <p className="font-medium text-accent-green">Active</p>
            </div>
          </div>

          {license.email && (
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-text-muted" />
              <div>
                <p className="text-text-muted text-sm">Licensed to</p>
                <p className="font-medium">{license.email}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-text-muted" />
            <div>
              <p className="text-text-muted text-sm">Purchased</p>
              <p className="font-medium">{formatRelativeTime(new Date(license.purchasedAt))}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            {!showDeactivateConfirm ? (
              <button onClick={() => setShowDeactivateConfirm(true)} className="btn-ghost text-sm text-red-400 hover:text-red-300">
                Deactivate License
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <AlertTriangle size={16} className="text-amber-400" />
                <span className="text-sm text-text-muted">Are you sure?</span>
                <button onClick={handleDeactivate} className="btn-ghost text-sm text-red-400">
                  Yes, deactivate
                </button>
                <button onClick={() => setShowDeactivateConfirm(false)} className="btn-ghost text-sm">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Free tier view
  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold mb-6">License</h2>

      <div className="glass-card p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-surface-interactive flex items-center justify-center">
          <Shield size={24} className="text-text-muted" />
        </div>

        <h3 className="font-medium mb-2">Free Version</h3>
        <p className="text-text-muted text-sm mb-6">
          You can clean up to 20 GB per week.
          <br />
          Upgrade for unlimited cleaning and automation features.
        </p>

        <button onClick={() => setShowUpgrade(true)} className="btn-primary px-6 py-3 rounded-xl">
          Upgrade to Pro - $29 lifetime
        </button>

        <button onClick={() => setShowUpgrade(true)} className="btn-ghost text-sm mt-4 block mx-auto">
          I have a license key
        </button>
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  )
}
