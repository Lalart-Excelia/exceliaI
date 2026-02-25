export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai'
import { getCached, setCache, cacheKey } from '@/lib/redis'
import { debitCredit } from '@/lib/credits'
import { apiGuard } from '@/lib/api-guard'
import { PROMPTS } from '@/lib/prompts'
import { z } from 'zod'
import * as XLSX from 'xlsx'

const Schema = z.object({
  fileData:  z.string(),
  fileName:  z.string(),
  analyses:  z.array(z.enum(['diagnosis', 'executive', 'anomalies', 'trend', 'charts'])),
})

function extractMetadata(base64: string, fileName: string) {
  try {
    const buffer   = Buffer.from(base64, 'base64')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheet    = workbook.Sheets[workbook.SheetNames[0]]
    const data     = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]

    const headers = data[0] as string[]
    const rows    = data.slice(1, 501)

    // Estatísticas básicas por coluna numérica
    const stats: Record<string, object> = {}
    headers.forEach((header, i) => {
      const values = rows
        .map((r) => Number((r as string[])[i]))
        .filter((v) => !isNaN(v))
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0)
        stats[header] = {
          min:   Math.min(...values),
          max:   Math.max(...values),
          avg:   (sum / values.length).toFixed(2),
          count: values.length,
        }
      }
    })

    return {
      fileName,
      totalRows:   data.length - 1,
      columns:     headers,
      sampleData:  rows.slice(0, 30).map((r) => (r as string[]).join('\t')),
      stats,
    }
  } catch {
    return { fileName, error: 'Não foi possível ler o arquivo' }
  }
}

const PROMPT_MAP = {
  diagnosis: PROMPTS.insightsDiagnosis,
  executive: PROMPTS.insightsExecutive,
  anomalies: PROMPTS.insightsAnomalies,
  trend:     PROMPTS.insightsTrend,
  charts:    PROMPTS.insightsCharts,
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard()
  if (guard.error) return guard.error

  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { fileData, fileName, analyses } = parsed.data
  const metadata = extractMetadata(fileData, fileName)
  const context  = JSON.stringify(metadata)

  const results: Record<string, string> = {}
  let totalCost = 0
  let totalInput = 0
  let totalOutput = 0

  for (const analysis of analyses) {
    // Cache por análise + conteúdo do arquivo
    const key    = cacheKey('insights', analysis, context.slice(0, 200))
    const cached = await getCached(key)

    if (cached) {
      results[analysis] = cached
      continue
    }

    const prompt   = PROMPT_MAP[analysis]
    const response = await callAI(
      prompt,
      [{ role: 'user', content: `Dados da planilha:\n${context}` }],
      'smart' // sempre Sonnet/Pro para insights
    )

    results[analysis] = response.text
    totalCost  += response.cost
    totalInput += response.inputTokens
    totalOutput+= response.outputTokens

    await setCache(key, response.text)
  }

  await debitCredit(
    guard.userId!, 'insights', 'smart',
    totalInput, totalOutput, totalCost, false
  )

  return NextResponse.json({ results })
}
