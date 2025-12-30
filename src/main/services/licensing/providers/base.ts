import { ILicenseProvider, LicenseProvider, LicenseValidationResult, CheckoutResult } from '../types'

export abstract class BaseLicenseProvider implements ILicenseProvider {
  abstract readonly id: LicenseProvider

  abstract validateLicense(key: string): Promise<LicenseValidationResult>
  abstract getCheckoutUrl(email?: string): Promise<CheckoutResult>
  abstract canHandleKey(key: string): boolean

  /**
   * Helper for offline fallback validation.
   * Returns true if key format is valid (trust locally when offline).
   */
  protected createOfflineLicense(key: string): LicenseValidationResult {
    return {
      isValid: true,
      license: {
        licenseKey: key,
        email: null,
        provider: this.id,
        purchasedAt: new Date(),
        isValid: true,
      },
    }
  }
}
