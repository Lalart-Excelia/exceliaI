import { supabaseAdmin, PLAN_LIMITS, type Plan } from './supabase'

export async function getUser(clerkId: string) {
  const { data } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', clerkId)
    .single()
  return data
}

export async function checkCredits(clerkId: string): Promise<{
  ok: boolean
  remaining: number
  plan: Plan
}> {
  const user = await getUser(clerkId)
  if (!user) return { ok: false, remaining: 0, plan: 'free' }

  const limit = PLAN_LIMITS[user.plan as Plan].credits
  const remaining = limit - user.credits_used

  return { ok: remaining > 0, remaining, plan: user.plan }
}

export async function debitCredit(
  clerkId: string,
  tool: string,
  model: 'fast' | 'smart',
  inputTokens: number,
  outputTokens: number,
  costUsd: number,
  cached: boolean
) {
  // Debita 1 crédito
  await supabaseAdmin
    .from('users')
    .update({ credits_used: supabaseAdmin.rpc('increment', { x: 1 }) })
    .eq('id', clerkId)

  // Registra no log de uso
  await supabaseAdmin.from('usage_logs').insert({
    user_id:       clerkId,
    tool,
    model,
    input_tokens:  inputTokens,
    output_tokens: outputTokens,
    cost_usd:      costUsd,
    cached,
  })
}
