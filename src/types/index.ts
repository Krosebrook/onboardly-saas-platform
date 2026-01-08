export interface Company {
  id: string
  userId: string
  name: string
  logoUrl?: string
  domain?: string
  createdAt: string
  updatedAt: string
}

export interface OnboardingFlow {
  id: string
  userId: string
  companyId: string
  name: string
  description?: string
  isActive: string
  createdAt: string
  updatedAt: string
}

export interface Step {
  id: string
  userId: string
  flowId: string
  title: string
  description?: string
  content?: string
  stepOrder: number
  estimatedTime?: string
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  userId: string
  companyId: string
  email: string
  name?: string
  phone?: string
  metadata?: string
  createdAt: string
  updatedAt: string
}

export interface CustomerProgress {
  id: string
  userId: string
  customerId: string
  flowId: string
  stepId: string
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked'
  completedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Reminder {
  id: string
  userId: string
  customerId: string
  flowId: string
  stepId?: string
  message: string
  scheduledAt: string
  sentAt?: string
  status: 'pending' | 'sent' | 'failed'
  createdAt: string
}
