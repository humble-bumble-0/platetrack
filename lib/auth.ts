// lib/auth.ts - re-exports from supabase for compatibility
export { createSupabaseServerClient, requireAuth, createSupabaseAdmin, isPro, requirePro } from './supabase-server'
export { success as apiSuccess, handleError as apiError } from './api'

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  // In production replace with Upstash Redis
  return true // stub - allows all requests
}

export function validateEmail(email: string): string | null {
  if (!email || email.length > 254) return 'Invalid email'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Invalid email format'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password required'
  if (password.length < 8) return 'Min 8 characters'
  if (password.length > 128) return 'Too long'
  return null
}

export function validateUsername(username: string): string | null {
  if (!username) return 'Username required'
  if (!/^[a-z0-9_]{3,30}$/.test(username)) return '3-30 chars, lowercase/numbers/underscores only'
  return null
}

export function generateShareToken(): string {
  const arr = new Uint8Array(18); crypto.getRandomValues(arr)
  return Buffer.from(arr).toString('base64url')
}
