export type ServiceType =
  | 'AQUARIUM_CLEANING'
  | 'POND_CLEANING'
  | 'FILTER_MAINTENANCE'
  | 'WATER_TREATMENT'
  | 'OTHER'

export type Role = 'ADMIN' | 'DOCTOR'

export type ExpenseCategory = 'FUEL' | 'EQUIPMENT' | 'CHEMICALS' | 'MISCELLANEOUS'

export type WorkStatus = 'NOT_STARTED' | 'STARTED' | 'COMPLETED'

export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  NOT_STARTED: 'Not Started',
  STARTED: 'Started',
  COMPLETED: 'Completed',
}

export interface UserInfo {
  userId: string
  email: string
  role: Role
  name: string
}

export interface ServiceWithCustomer {
  id: string
  customerId: string
  doctorId: string | null
  serviceType: ServiceType
  serviceDate: string
  serviceTime: string | null
  nextServiceDate: string
  cost: number
  notes: string | null
  status: string
  reminderSent: boolean
  createdAt: string
  customer: {
    id: string
    name: string
    phone: string
    address: string
  }
  doctor?: {
    id: string
    name: string
    email: string
    phone: string
  } | null
}

export type ServiceStatus = 'ok' | 'soon' | 'overdue'

export function getStatus(nextServiceDate: string | Date): ServiceStatus {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const next = new Date(nextServiceDate)
  next.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 5) return 'soon'
  return 'ok'
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  AQUARIUM_CLEANING: 'Aquarium Cleaning',
  POND_CLEANING: 'Pond Cleaning',
  FILTER_MAINTENANCE: 'Filter Maintenance',
  WATER_TREATMENT: 'Water Treatment',
  OTHER: 'Other',
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  FUEL: 'Fuel',
  EQUIPMENT: 'Equipment',
  CHEMICALS: 'Chemicals',
  MISCELLANEOUS: 'Miscellaneous',
}
