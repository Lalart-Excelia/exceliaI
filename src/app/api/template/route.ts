import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'
import { debitCredit } from '@/lib/credits'
import { apiGuard } from '@/lib/api-guard'
import { supabaseAdmin } from '@/lib/supabase'
import { PROMPTS } from '@/lib/prompts'
import { PLAN_LIMITS } from '@/lib/supabase'
import { z } from 'zod'
import * as XLSX from 'xlsx'

const Schema = z.object({
  description: z.string().min(5).max(500),
  history: z.array(z.object({
    role:    z.enum(['user', 'assistant']),
    content: z.string(),
  })).default([]),
  confirmed: z.boolean().default(false), // true = gerar, false = conversar
})

export async function POST(req: NextRequest) {
  const guard = await apiGuard()
  if (guard.error) return guard.error

  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { description, history, confirmed } = parsed.data

  const messages = [
    ...history,
    { role: 'user' as const, content: description },
  ]

  const response = await callAI(PROMPTS.templateDiagnosis, messages, 'fast')

  await debitCredit(
    guard.userId!, 'template', 'fast',
    response.inputTokens, response.outputTokens, response.cost, false
  )

  // Tenta parsear JSON da resposta
  let templateJson = null
  try {
    const jsonMatch = response.text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      templateJson = JSON.parse(jsonMatch[0])
    }
  } catch {
    // ainda em fase de perguntas
  }

  // Se temos a estrutura confirmada, salvar no banco
  if (templateJson && confirmed) {
    const { data: user } = await supabaseAdmin
      .from('users').select('plan').eq('id', guard.userId).single()

    const plan = user?.plan ?? 'free'
    const retentionDays = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].templateRetentionDays
    const expiresAt = retentionDays
      ? new Date(Date.now() + retentionDays * 86400000).toISOString()
      : null

    await supabaseAdmin.from('templates').insert({
      user_id:      guard.userId,
      name:         templateJson.name,
      description:  templateJson.description,
      content_json: templateJson,
      expires_at:   expiresAt,
    })
  }

  return NextResponse.json({
    result:       response.text,
    templateJson,
    ready:        !!templateJson,
  })
}

// Gera arquivo XLSX a partir do JSON do template
export async function GET(req: NextRequest) {
  const guard = await apiGuard()
  if (guard.error) return guard.error

  const templateId = req.nextUrl.searchParams.get('id')
  const format      = req.nextUrl.searchParams.get('format') ?? 'xlsx'

  const { data: template } = await supabaseAdmin
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .eq('user_id', guard.userId)
    .single()

  if (!template) {
    return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
  }

  const content = template.content_json as {
    name: string
    columns: { name: string; example: string }[]
    sample_rows: number
  }

  // Monta dados da planilha
  const headers = content.columns.map((c) => c.name)
  const sampleRow = content.columns.map((c) => c.example)
  const aoa = [headers, sampleRow] // array of arrays

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  XLSX.utils.book_append_sheet(wb, ws, content.name.slice(0, 31))

  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(ws)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${content.name}.csv"`,
      },
    })
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${content.name}.xlsx"`,
    },
  })
}
