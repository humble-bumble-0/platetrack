'use client'
import { usePathname } from 'next/navigation'
import { SideMenu } from '@/components/layout/SideMenu'
import { BottomNav } from '@/components/layout/BottomNav'
import { XPToastProvider } from '@/components/rewards/XPToast'

const HIDE_NAV = ['/login','/signup','/onboarding','/reset-password','/privacy','/terms','/offline']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideNav = HIDE_NAV.some(p => pathname.startsWith(p))

  return (
    <XPToastProvider>
      {!hideNav && <SideMenu />}
      <main className="min-h-screen pb-16">{children}</main>
      {!hideNav && <BottomNav />}
    </XPToastProvider>
  )
}
