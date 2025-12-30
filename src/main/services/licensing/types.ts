export type LicenseProvider = 'paddle' | 'stripe' | 'apple' | 'lemon_squeezy' | 'gumroad' | 'manual'

export interface License {
  licenseKey: string | null
  email: string | null
  provider: LicenseProvider
  providerCustomerId?: string
  providerTransactionId?: string
  purchasedAt: Date
  validatedAt?: Date
  isValid: boolean
  rawData?: Record<string, unknown>
}

export interface LicenseValidationResult {
  isValid: boolean
  license?: License
  error?: string
}

export interface CheckoutResult {
  success: boolean
  checkoutUrl?: string
  error?: string
}

/**
 * Provider interface - implement for each payment provider.
 * This abstraction allows swapping providers without changing app code.
 */
export interface ILicenseProvider {
  /** Unique provider identifier */
  readonly id: LicenseProvider

  /** Validate a license key with this provider */
  validateLicense(key: string): Promise<LicenseValidationResult>

  /** Generate a checkout URL for purchasing */
  getCheckoutUrl(email?: string): Promise<CheckoutResult>

  /** Check if this provider can handle a given license key format */
  canHandleKey(key: string): boolean
}
