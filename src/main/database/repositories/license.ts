import { getDatabase } from '../index'
import { License, LicenseProvider } from '../../services/licensing/types'

interface LicenseRow {
  id: number
  license_key: string
  email: string | null
  provider: string
  provider_customer_id: string | null
  provider_transaction_id: string | null
  purchased_at: number
  validated_at: number | null
  is_valid: number
  raw_data: string | null
}

export const licenseRepo = {
  get(): License | null {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM license WHERE id = 1').get() as LicenseRow | undefined
    if (!row) return null

    return {
      licenseKey: row.license_key,
      email: row.email,
      provider: row.provider as LicenseProvider,
      providerCustomerId: row.provider_customer_id ?? undefined,
      providerTransactionId: row.provider_transaction_id ?? undefined,
      purchasedAt: new Date(row.purchased_at),
      validatedAt: row.validated_at ? new Date(row.validated_at) : undefined,
      isValid: Boolean(row.is_valid),
      rawData: row.raw_data ? JSON.parse(row.raw_data) : undefined,
    }
  },

  save(license: License): void {
    const db = getDatabase()
    db.prepare(
      `
      INSERT OR REPLACE INTO license (
        id, license_key, email, provider, provider_customer_id,
        provider_transaction_id, purchased_at, validated_at, is_valid, raw_data
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      license.licenseKey,
      license.email,
      license.provider,
      license.providerCustomerId || null,
      license.providerTransactionId || null,
      license.purchasedAt.getTime(),
      license.validatedAt?.getTime() || null,
      license.isValid ? 1 : 0,
      license.rawData ? JSON.stringify(license.rawData) : null
    )
  },

  delete(): void {
    const db = getDatabase()
    db.prepare('DELETE FROM license WHERE id = 1').run()
  },

  exists(): boolean {
    const db = getDatabase()
    const row = db.prepare('SELECT 1 FROM license WHERE id = 1').get()
    return !!row
  },
}
