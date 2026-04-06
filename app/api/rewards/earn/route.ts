import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'
import { earnXP } from '@/lib/xpIntegration'
import { XP } from '@/lib/rewards'

// Only allow low-value, client-triggerable events (not PR_ACHIEVED, WORKOUT_COMPLETED, etc.)
const CLIENT_ALLOWED: Set<string> = new Set(['WEIGHT_LOGGED','BODY_COMP_LOGGED','PROGRESS_SHARED'])

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { event_type, metadata } = await req.json()
    if (!event_type||(!(event_type in XP))) throw Object.assign(new Error('Invalid event_type'),{status:400})
    if (!CLIENT_ALLOWED.has(event_type)) throw Object.assign(new Error('This event cannot be triggered directly'),{status:403})
    // Strip xp_override from client-supplied metadata
    const safeMetadata = metadata ? { ...metadata, xp_override: undefined } : undefined
    const result = await earnXP(user.id, event_type, safeMetadata)
    return success(result)
  } catch (err) { return handleError(err) }
}
