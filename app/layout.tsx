import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/layout/AppShell'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PlateTrack — Strength Tracker',
  description: 'Track strength. Build momentum.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'PlateTrack' },
}
export const viewport: Viewport = {
  themeColor: '#1A1D2E', width: 'device-width', initialScale: 1, maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><link rel="apple-touch-icon" href="/icons/icon-192.png"/></head>
      <body className={inter.className}>
        <AppShell>{children}</AppShell>
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js')` }}/>
      </body>
    </html>
  )
}
