import { ILicenseProvider, License, LicenseProvider, LicenseValidationResult } from './types'
import { licenseRepo } from '../../database/repositories/license'
import { createPaddleProvider } from './providers/paddle'
import { createStripeProvider } from './providers/stripe'

class LicenseService {
  private providers: Map<LicenseProvider, ILicenseProvider> = new Map()
  private cachedLicense: License | null = null
  private initialized = false

  /**
   * Initialize the service. Call once at app startup.
   */
  init(): void {
    if (this.initialized) return

    // Register providers
    this.registerProvider(createPaddleProvider())
    this.registerProvider(createStripeProvider())

    // TODO: Add Apple IAP provider when implementing MAS
    // this.registerProvider(createAppleProvider())

    // Load cached license
    this.loadCachedLicense()
    this.initialized = true
  }

  registerProvider(provider: ILicenseProvider): void {
    this.providers.set(provider.id, provider)
  }

  private loadCachedLicense(): void {
    try {
      const stored = licenseRepo.get()
      if (stored && stored.isValid) {
        this.cachedLicense = stored
      }
    } catch (error) {
      console.error('[License] Failed to load cached license:', error)
    }
  }

  /**
   * Fast in-memory check - use this for feature gating.
   */
  isPro(): boolean {
    return this.cachedLicense?.isValid ?? false
  }

  /**
   * Get current license info (safe to expose to renderer).
   */
  getLicense(): Omit<License, 'rawData' | 'licenseKey'> | null {
    if (!this.cachedLicense) return null

    return {
      email: this.cachedLicense.email,
      provider: this.cachedLicense.provider,
      providerCustomerId: this.cachedLicense.providerCustomerId,
      providerTransactionId: this.cachedLicense.providerTransactionId,
      purchasedAt: this.cachedLicense.purchasedAt,
      validatedAt: this.cachedLicense.validatedAt,
      isValid: this.cachedLicense.isValid,
    }
  }

  /**
   * Activate a license key. Tries all registered providers.
   */
  async activateLicense(key: string): Promise<LicenseValidationResult> {
    const normalizedKey = key.trim().toUpperCase()

    // Find provider that can handle this key
    for (const provider of this.providers.values()) {
      if (provider.canHandleKey(normalizedKey)) {
        const result = await provider.validateLicense(normalizedKey)

        if (result.isValid && result.license) {
          licenseRepo.save(result.license)
          this.cachedLicense = result.license
          console.log('[License] Activated successfully via', provider.id)
        }

        return result
      }
    }

    return { isValid: false, error: 'Unrecognized license key format' }
  }

  /**
   * Get checkout URL for a specific provider.
   */
  async getCheckoutUrl(providerType: LicenseProvider = 'paddle', email?: string): Promise<string | null> {
    const provider = this.providers.get(providerType)
    if (!provider) return null

    const result = await provider.getCheckoutUrl(email)
    return result.success ? result.checkoutUrl ?? null : null
  }

  /**
   * Deactivate and remove license.
   */
  deactivateLicense(): void {
    licenseRepo.delete()
    this.cachedLicense = null
    console.log('[License] Deactivated')
  }

  /**
   * Periodic revalidation (call every 30 days or on app start).
   */
  async revalidate(): Promise<boolean> {
    if (!this.cachedLicense?.licenseKey) return false

    const provider = this.providers.get(this.cachedLicense.provider)
    if (!provider) return false

    try {
      const result = await provider.validateLicense(this.cachedLicense.licenseKey)

      if (result.isValid && result.license) {
        licenseRepo.save(result.license)
        this.cachedLicense = result.license
        return true
      }

      // Don't immediately invalidate on failure - could be network issue
      console.warn('[License] Revalidation failed:', result.error)
      return this.cachedLicense.isValid // Keep current state
    } catch (error) {
      console.warn('[License] Revalidation error:', error)
      return this.cachedLicense.isValid
    }
  }
}

export const licenseService = new LicenseService()
