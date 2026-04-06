'use client'
// lib/notifications.ts
export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export function scheduleLocalNotification(title: string, body: string, delayMs: number) {
  setTimeout(() => {
    if (Notification.permission === 'granted') new Notification(title, { body, icon: '/icons/icon-192.png' })
  }, delayMs)
}
