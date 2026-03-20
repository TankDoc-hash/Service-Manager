import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT = 'tankdoc-salt-v1' // Static salt for key derivation

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'tankdoc-default-encryption-key'
  return scryptSync(secret, SALT, 32)
}

export function encrypt(text: string): string {
  if (!text) return text
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()
  // Format: iv:authTag:encryptedData
  return `enc:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(data: string): string {
  if (!data) return data
  // If not encrypted (legacy data), return as-is
  if (!data.startsWith('enc:')) return data
  try {
    const key = getKey()
    const parts = data.split(':')
    if (parts.length !== 4) return data
    const iv = Buffer.from(parts[1], 'hex')
    const authTag = Buffer.from(parts[2], 'hex')
    const encrypted = parts[3]
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    // If decryption fails (wrong key, corrupted data), return original
    return data
  }
}

// Encrypt sensitive customer/user fields before storing
export function encryptCustomerData(data: { phone?: string; address?: string; notes?: string | null }) {
  const result: Record<string, string | null | undefined> = {}
  if (data.phone !== undefined) result.phone = encrypt(data.phone)
  if (data.address !== undefined) result.address = encrypt(data.address)
  if (data.notes !== undefined) result.notes = data.notes ? encrypt(data.notes) : null
  return result
}

// Decrypt sensitive customer fields after reading
export function decryptCustomerData<T extends { phone?: string; address?: string; notes?: string | null }>(data: T): T {
  return {
    ...data,
    phone: data.phone ? decrypt(data.phone) : data.phone,
    address: data.address ? decrypt(data.address) : data.address,
    notes: data.notes ? decrypt(data.notes) : data.notes,
  }
}

// Decrypt sensitive user fields
export function decryptUserPhone<T extends { phone?: string }>(data: T): T {
  return {
    ...data,
    phone: data.phone ? decrypt(data.phone) : data.phone,
  }
}
