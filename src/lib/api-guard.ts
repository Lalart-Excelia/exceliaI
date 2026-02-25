import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { rateLimiter } from './redis'
import { checkCredits } from './credits'

export async function apiGuard() {
  // 1. Auth
  const { userId } = await auth()
  if (!userId) {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }), userId: null }
  }

  // 2. Rate limit
  const { success } = await rateLimiter.limit(userId)
  if (!success) {
    return {
      error: NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 }),
      userId: null,
    }
  }

  // 3. Créditos
  const { ok, remaining, plan } = await checkCredits(userId)
  if (!ok) {
    return {
      error: NextResponse.json({
        error: 'Créditos esgotados.',
        remaining: 0,
        plan,
        upgradeUrl: '/#pricing',
      }, { status: 402 }),
      userId: null,
    }
  }

  return { error: null, userId, remaining, plan }
}
