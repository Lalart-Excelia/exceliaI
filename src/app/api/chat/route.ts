import { NextRequest, NextResponse } from 'next/server'
import { callAI, detectModel } from '@/lib/ai'
import { debitCredit } from '@/lib/credits'
import { apiGuard } from '@/lib/api-guard'
import { PROMPTS } from '@/lib/prompts'
import { z } from 'zod'
import * as XLSX from 'xlsx'

const Schema = z.object({
  question: z.string().min(1).max(1000),
  fileData: z.string(),       // base64 do arquivo
  fileName: z.string(),
  history:  z.array(z.object({
    role:    z.enum(['user', 'assistant']),
    content: z.string(),
  })).default([]),
})

// Extrai amostra dos dados (máx 500 linhas para não explodir tokens)
function extractSample(base64: string, fileName: string): string {
  try {
    const buffer = Buffer.from(base64, 'base64')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]

    const headers = data[0] as string[]
    const rows = data.slice(1, 501) // máx 500 linhas

    const sample = [
      `Arquivo: ${fileName}`,
      `Total de linhas: ${data.length - 1}`,
      `Colunas: ${headers.join(', ')}`,
      '',
      'Amostra dos dados (primeiras linhas):',
      headers.join('\t'),
      ...rows.slice(0, 20).map((r) => (r as string[]).join('\t')),
      rows.length > 20 ? `... e mais ${rows.length - 20} linhas` : '',
    ].join('\n')

    return sample
  } catch {
    return `Arquivo: ${fileName} (não foi possível extrair prévia)`
  }
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard()
  if (guard.error) return guard.error

  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { question, fileData, fileName, history } = parsed.data

  // Detecta complexidade → escolhe modelo
  const model = detectModel(question)
  const systemPrompt = model === 'smart' ? PROMPTS.chatComplex : PROMPTS.chatSimple

  // Monta contexto com dados do arquivo
  const fileContext = extractSample(fileData, fileName)
  const systemWithFile = `${systemPrompt}\n\n=== DADOS DO ARQUIVO ===\n${fileContext}`

  // Monta mensagens com histórico
  const messages = [
    ...history,
    { role: 'user' as const, content: question },
  ]

  const response = await callAI(systemWithFile, messages, model)

  await debitCredit(
    guard.userId!, 'chat', model,
    response.inputTokens, response.outputTokens, response.cost, false
  )

  return NextResponse.json({
    result: response.text,
    model,
    cost: response.cost,
  })
}
