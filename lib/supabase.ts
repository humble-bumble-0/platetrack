// lib/supabase.ts — client-safe (no next/headers import)
import { createBrowserClient } from '@supabase/ssr'

// Client-side singleton
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  )
}

