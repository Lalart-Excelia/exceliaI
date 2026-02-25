import { NextRequest, NextResponse } from 'next/server'

// Export de PDF/PPT será implementado na Fase 3
// Por enquanto retorna mensagem informativa
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'Export em PDF/PPT disponível em breve. Por enquanto faça download em CSV ou XLSX.' },
    { status: 501 }
  )
}
