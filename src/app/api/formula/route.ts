export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'
import { getCached, setCache, cacheKey } from '@/lib/redis'
import { debitCredit } from '@/lib/credits'
import { apiGuard } from '@/lib/api-guard'
import { PROMPTS } from '@/lib/prompts'
import { z } from 'zod'

const Schema = z.object({
  question: z.string().min(3).max(500),
  platform: z.enum(['excel', 'sheets', 'libreoffice', 'airtable']).default('excel'),
})

export async function POST(req: NextRequest) {
  // Guard: auth + rate limit + créditos
  const guard = await apiGuard()
  if (guard.error) return guard.error

  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { question, platform } = parsed.data

  // Cache — fórmulas são altamente cacheáveis
  const key = cacheKey('formula', question, platform)
  const cached = await getCached(key)

  if (cached) {
    // Hit de cache — debita crédito mas marca como cached (custo $0)
    await debitCredit(guard.userId!, 'formula', 'fast', 0, 0, 0, true)
    return NextResponse.json({ result: cached, cached: true })
  }

  // Chama IA
  const systemPrompt = PROMPTS.formula + `\nPlataforma alvo: ${platform.toUpperCase()}`
  const response = await callAI(
    systemPrompt,
    [{ role: 'user', content: question }],
    'fast' // sempre Haiku/Flash para fórmulas
  )

  // Salva cache + debita crédito
  await setCache(key, response.text)
  await debitCredit(
    guard.userId!, 'formula', 'fast',
    response.inputTokens, response.outputTokens, response.cost, false
  )

  return NextResponse.json({ result: response.text, cached: false })
}
