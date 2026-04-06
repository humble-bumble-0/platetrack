'use client'
// lib/analytics.ts
let posthog: any = null

export function initAnalytics() {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  import('posthog-js').then(({ default: ph }) => {
    ph.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, { api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com', person_profiles: 'identified_only' })
    posthog = ph
  })
}

export function track(event: string, props?: Record<string,any>) {
  posthog?.capture(event, props)
}

export function identifyUser(userId: string, props?: Record<string,any>) {
  posthog?.identify(userId, props)
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  // Use a ref-based check to avoid calling during render (React strict mode safe)
  if (typeof window !== 'undefined' && !(window as any).__pt_analytics) {
    (window as any).__pt_analytics = true
    initAnalytics()
  }
  return children as any
}
