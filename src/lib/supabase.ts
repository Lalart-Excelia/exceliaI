import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Cliente com service role (só server-side)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── TIPOS DO BANCO ────────────────────────────────────────
export type Plan = 'free' | 'starter' | 'pro'

export interface UserProfile {
  id: string              // = clerk user id
  email: string
  plan: Plan
  credits_used: number
  credits_reset_at: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export interface UsageLog {
  id: string
  user_id: string
  tool: 'formula' | 'chat' | 'template' | 'insights' | 'export'
  model: 'fast' | 'smart'
  input_tokens: number
  output_tokens: number
  cost_usd: number
  cached: boolean
  created_at: string
}

export interface Template {
  id: string
  user_id: string
  name: string
  description: string
  content_json: object    // estrutura da planilha
  created_at: string
  expires_at: string | null  // null = permanente (pagos)
}

export interface Download {
  id: string
  user_id: string
  filename: string
  file_type: 'csv' | 'xlsx' | 'pdf' | 'pptx'
  tool: string
  r2_key: string
  expires_at: string | null
  created_at: string
}

// ── LIMITES POR PLANO ─────────────────────────────────────
export const PLAN_LIMITS: Record<Plan, {
  credits: number
  maxFileSizeMb: number
  insightSessions: number
  templateRetentionDays: number | null
}> = {
  free:    { credits: 10,   maxFileSizeMb: 5,  insightSessions: 2,  templateRetentionDays: 30   },
  starter: { credits: 600,  maxFileSizeMb: 50, insightSessions: 10, templateRetentionDays: null },
  pro:     { credits: 1500, maxFileSizeMb: 100,insightSessions: 999,templateRetentionDays: null },
}
