import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { UpgradeModal } from './UpgradeModal'
import { useLicenseStore } from '../store/licenseStore'

interface UpgradeButtonProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'subtle'
  className?: string
}

export function UpgradeButton({ size = 'md', variant = 'primary', className = '' }: UpgradeButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const isPro = useLicenseStore((s) => s.isPro)

  if (isPro) return null

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }

  const variantClasses = {
    primary: 'btn-primary',
    subtle: 'btn-subtle text-amber-400 hover:text-amber-300',
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          rounded-lg flex items-center gap-2
          ${className}
        `}
      >
        <Sparkles size={size === 'sm' ? 14 : 16} />
        <span>Upgrade to Pro</span>
      </button>

      <UpgradeModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
