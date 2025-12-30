import { BaseLicenseProvider } from './base'
import { LicenseValidationResult, CheckoutResult } from '../types'

// Paddle license key format: CLUT-PXXX-XXXX-XXXX (P prefix distinguishes from Stripe)
// Also accepts legacy format: CLUT-XXXX-XXXX-XXXX (but not starting with S)
const PADDLE_KEY_REGEX = /^CLUT-(?!S)[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/

// Paddle URLs - use sandbox in development
const isDev = process.env.NODE_ENV !== 'production'
const PADDLE_API_URL = isDev
  ? 'https://sandbox-vendors.paddle.com/api/2.0'
  : 'https://vendors.paddle.com/api/2.0'
const PADDLE_CHECKOUT_URL = isDev
  ? 'https://sandbox-buy.paddle.com/checkout'
  : 'https://buy.paddle.com/checkout'

interface PaddleConfig {
  productId: string
  vendorId: string
  apiKey: string
}

export class PaddleLicenseProvider extends BaseLicenseProvider {
  readonly id = 'paddle' as const

  private readonly config: PaddleConfig

  constructor(config: PaddleConfig) {
    super()
    this.config = config
  }

  canHandleKey(key: string): boolean {
    return PADDLE_KEY_REGEX.test(key.toUpperCase())
  }

  async validateLicense(key: string): Promise<LicenseValidationResult> {
    const normalizedKey = key.toUpperCase()

    if (!this.canHandleKey(normalizedKey)) {
      return { isValid: false, error: 'Invalid license key format' }
    }

    // Skip API call if not configured (development mode)
    if (!this.config.apiKey || !this.config.vendorId) {
      console.warn('[Paddle] No API credentials, using offline validation')
      return this.createOfflineLicense(normalizedKey)
    }

    try {
      const response = await fetch(`${PADDLE_API_URL}/product/get_license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: this.config.vendorId,
          vendor_auth_code: this.config.apiKey,
          license_code: normalizedKey,
        }),
      })

      const data = await response.json()

      if (data.success && data.response) {
        return {
          isValid: true,
          license: {
            licenseKey: normalizedKey,
            email: data.response.email,
            provider: 'paddle',
            providerCustomerId: String(data.response.customer_id),
            providerTransactionId: String(data.response.order_id),
            purchasedAt: new Date(data.response.created_at),
            validatedAt: new Date(),
            isValid: true,
            rawData: data.response,
          },
        }
      }

      return { isValid: false, error: data.error?.message || 'Invalid license' }
    } catch (error) {
      // Offline fallback - trust the key format
      console.warn('[Paddle] Validation failed, using offline mode:', error)
      return this.createOfflineLicense(normalizedKey)
    }
  }

  async getCheckoutUrl(email?: string): Promise<CheckoutResult> {
    if (!this.config.productId) {
      return { success: false, error: 'Product ID not configured' }
    }

    const params = new URLSearchParams()
    if (email) params.set('email', email)

    const checkoutUrl = `${PADDLE_CHECKOUT_URL}/${this.config.productId}?${params}`

    return { success: true, checkoutUrl }
  }
}

export function createPaddleProvider(): PaddleLicenseProvider {
  return new PaddleLicenseProvider({
    productId: process.env.PADDLE_PRODUCT_ID || '',
    vendorId: process.env.PADDLE_VENDOR_ID || '',
    apiKey: process.env.PADDLE_API_KEY || '',
  })
}
