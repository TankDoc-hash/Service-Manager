// Input validation helpers

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPhone(phone: string): boolean {
  // Allow 7-15 digits, optional + prefix
  return /^\+?\d{7,15}$/.test(phone.replace(/[\s-]/g, ''))
}

export function isValidMonth(month: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
}

export function isValidCost(val: unknown): boolean {
  const n = typeof val === 'string' ? parseFloat(val) : val
  return typeof n === 'number' && !isNaN(n) && isFinite(n) && n >= 0 && n < 10000000
}

export function isValidDate(dateStr: string): boolean {
  const d = new Date(dateStr)
  return !isNaN(d.getTime())
}

export function isValidRole(role: string): boolean {
  return role === 'ADMIN' || role === 'DOCTOR'
}

export function isValidStatus(status: string): boolean {
  return status === 'ACTIVE' || status === 'DISABLED'
}

export function isValidServiceType(type: string): boolean {
  return ['AQUARIUM_CLEANING', 'POND_CLEANING', 'FILTER_MAINTENANCE', 'WATER_TREATMENT', 'OTHER'].includes(type)
}

export function isValidWorkStatus(status: string): boolean {
  return ['NOT_STARTED', 'STARTED', 'COMPLETED'].includes(status)
}

export function isValidExpenseCategory(cat: string): boolean {
  return ['FUEL', 'EQUIPMENT', 'CHEMICALS', 'MISCELLANEOUS'].includes(cat)
}

export function clampPagination(page: number, limit: number) {
  return {
    page: Math.max(1, Math.min(page || 1, 10000)),
    limit: Math.max(1, Math.min(limit || 50, 500)),
  }
}

export function sanitizeString(str: string, maxLength = 500): string {
  return str.trim().slice(0, maxLength)
}
