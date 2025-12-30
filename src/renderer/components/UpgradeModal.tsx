import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Sparkles, Loader2 } from 'lucide-react'
import { useLicenseStore } from '../store/licenseStore'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

const PRO_FEATURES = ['Unlimited cleaning (no weekly limit)', 'Scheduled background scans', 'Auto-clean dormant projects', 'All future Pro features']

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [licenseKey, setLicenseKey] = useState('')
  const [isActivating, setIsActivating] = useState(false)
  const [showKeyInput, setShowKeyInput] = useState(false)

  const { activateLicense, openCheckout, error, clearError } = useLicenseStore()

  const handleActivate = async () => {
    if (!licenseKey.trim()) return

    setIsActivating(true)
    const result = await activateLicense(licenseKey.trim())
    setIsActivating(false)

    if (result.success) {
      onClose()
    }
  }

  const handlePurchase = () => {
    openCheckout()
  }

  const handleClose = () => {
    setLicenseKey('')
    setShowKeyInput(false)
    clearError()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="glass-card p-8 max-w-md mx-4 relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={handleClose} className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors">
              <X size={20} />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 mb-4">
                <Sparkles className="text-amber-400" size={32} />
              </div>
              <h2 className="text-2xl font-bold">Upgrade to Pro</h2>
              <p className="text-text-secondary mt-1">One-time purchase. Yours forever.</p>
            </div>

            {/* Price */}
            <div className="text-center mb-6">
              <span className="text-5xl font-bold">$29</span>
              <span className="text-text-muted ml-2">lifetime</span>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-6">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent-green/20 flex items-center justify-center">
                    <Check size={12} className="text-accent-green" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Purchase Button */}
            <button onClick={handlePurchase} className="btn-primary w-full py-3 rounded-xl text-lg font-medium mb-4">
              Purchase Now
            </button>

            {/* License Key Section */}
            <div className="border-t border-white/10 pt-4">
              {!showKeyInput ? (
                <button onClick={() => setShowKeyInput(true)} className="btn-ghost text-sm w-full">
                  I have a license key
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-text-muted text-center">Enter your license key:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                      placeholder="CLUT-XXXX-XXXX-XXXX"
                      className="flex-1 bg-surface-interactive border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent-purple"
                      disabled={isActivating}
                    />
                    <button
                      onClick={handleActivate}
                      disabled={isActivating || !licenseKey.trim()}
                      className="btn-secondary px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                    >
                      {isActivating ? <Loader2 size={16} className="animate-spin" /> : 'Activate'}
                    </button>
                  </div>
                  {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
