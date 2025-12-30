import { ReactNode } from 'react'
import { useLicenseStore } from '../store/licenseStore'
import { ProBadge } from './ProBadge'
import { Lock } from 'lucide-react'

interface ProFeatureGateProps {
  children: ReactNode
  feature: string
  /** Show blurred preview of the feature */
  showPreview?: boolean
  /** Custom fallback content */
  fallback?: ReactNode
}

export function ProFeatureGate({ children, feature, showPreview = true, fallback }: ProFeatureGateProps) {
  const isPro = useLicenseStore((s) => s.isPro)
  const openCheckout = useLicenseStore((s) => s.openCheckout)

  if (isPro) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (!showPreview) {
    return (
      <div className="flex items-center gap-2 text-text-muted">
        <Lock size={16} />
        <span>{feature} requires Pro</span>
        <ProBadge size="sm" />
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Blurred preview */}
      <div className="opacity-40 pointer-events-none select-none blur-[2px]">{children}</div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-void/50 rounded-lg">
        <div className="glass-card p-6 text-center max-w-xs">
          <ProBadge className="mb-3" />
          <p className="text-sm text-text-secondary mb-4">{feature} is a Pro feature</p>
          <button onClick={() => openCheckout()} className="btn-primary px-4 py-2 rounded-lg text-sm">
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  )
}
