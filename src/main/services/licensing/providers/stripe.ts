import { BaseLicenseProvider } from './base'
import { LicenseValidationResult, CheckoutResult } from '../types'

// Stripe license key format: CLUT-SXXXX-XXXX-XXXX (S prefix + 4-4-4)
const STRIPE_KEY_REGEX = /^CLUT-S[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/

// Lazy getter for API URL (env vars loaded after module import)
function getApiBaseUrl(): string {
  const url = process.env.CLUTTERED_API_URL || 'https://cluttered.dev'
  console.log('[Stripe] API Base URL:', url)
  return url
}

export class StripeLicenseProvider extends BaseLicenseProvider {
  readonly id = 'stripe' as const

  canHandleKey(key: string): boolean {
    return STRIPE_KEY_REGEX.test(key.toUpperCase())
  }

  async validateLicense(key: string): Promise<LicenseValidationResult> {
    const normalizedKey = key.toUpperCase()
    const apiBaseUrl = getApiBaseUrl()

    if (!this.canHandleKey(normalizedKey)) {
      return { isValid: false, error: 'Invalid license key format' }
    }

    try {
      console.log('[Stripe] Validating license:', normalizedKey)
      const response = await fetch(`${apiBaseUrl}/api/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: normalizedKey }),
      })

      const data = await response.json()

      if (data.valid) {
        return {
          isValid: true,
          license: {
            licenseKey: normalizedKey,
            email: data.email || null,
            provider: 'stripe',
            providerCustomerId: undefined,
            providerTransactionId: undefined,
            purchasedAt: new Date(),
            validatedAt: new Date(),
            isValid: true,
            rawData: data,
          },
        }
      }

      return { isValid: false, error: data.error || 'Invalid license' }
    } catch (error) {
      // Offline fallback - trust the key format
      console.warn('[Stripe] Validation failed, using offline mode:', error)
      return this.createOfflineLicense(normalizedKey)
    }
  }

  async getCheckoutUrl(email?: string): Promise<CheckoutResult> {
    const apiBaseUrl = getApiBaseUrl()
    const params = new URLSearchParams()
    params.set('provider', 'stripe')
    if (email) params.set('email', email)

    // Direct to checkout page with stripe param
    const checkoutUrl = `${apiBaseUrl}/checkout/stripe?${params}`
    console.log('[Stripe] Checkout URL:', checkoutUrl)

    return { success: true, checkoutUrl }
  }
}

export function createStripeProvider(): StripeLicenseProvider {
  return new StripeLicenseProvider()
}
