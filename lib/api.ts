// lib/api.ts
import { NextResponse } from 'next/server'

export function success(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function handleError(err: unknown) {
  const e = err as any
  const status  = e?.status || 500
  const message = status < 500 ? e?.message || 'Request failed' : 'Internal server error'
  if (status >= 500) console.error('[API]', e?.message || err)
  return NextResponse.json({ success: false, error: message }, { status })
}
