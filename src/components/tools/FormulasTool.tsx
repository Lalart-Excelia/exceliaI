'use client'

import { useState } from 'react'
import { Button, Input, Card } from '@/components/ui'

const PLATFORMS = [
  { id: 'excel',       label: 'Excel'        },
  { id: 'sheets',      label: 'Google Sheets'},
  { id: 'libreoffice', label: 'LibreOffice'  },
  { id: 'airtable',    label: 'Airtable'     },
]

export function FormulasTool() {
  const [question, setQuestion]   = useState('')
  const [platform, setPlatform]   = useState('excel')
  const [result, setResult]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [cached, setCached]       = useState(false)
  const [error, setError]         = useState('')

  async function generate() {
    if (!question.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/formula', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ question, platform }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.result)
      setCached(data.cached)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8 animate-fade-up">
        <div className="text-xs font-mono text-[#7070a0] tracking-widest mb-2">FORMULA GENERATOR</div>
        <h1 className="text-3xl font-bold tracking-tight">
          Descreva o que precisa.<br/>
          <span className="text-[#7fff6e]">Receba a fórmula.</span>
        </h1>
      </div>

      <Card className="animate-fade-up delay-100">
        {/* Plataforma */}
        <div className="flex gap-2 mb-5">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                platform === p.id
                  ? 'bg-[#7fff6e]/10 text-[#7fff6e] border border-[#7fff6e]/25'
                  : 'text-[#7070a0] border border-[#1c1c30] hover:border-[#3a3a60]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generate()}
            placeholder="ex: somar vendas da coluna B onde a coluna A for 'Sul'"
            className="flex-1 bg-[#141424] border border-[#1c1c30] rounded-lg px-4 py-3 text-sm text-[#e8e8f8] placeholder:text-[#3a3a60] focus:outline-none focus:border-[#7fff6e] transition-colors"
          />
          <Button onClick={generate} loading={loading} disabled={!question.trim()}>
            Gerar
          </Button>
        </div>

        {error && (
          <p className="mt-3 text-xs text-[#ff5a5a] font-mono">{error}</p>
        )}
      </Card>

      {/* Resultado */}
      {result && (
        <Card className="mt-4 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-[#7070a0] tracking-widest">RESULTADO</span>
            <div className="flex items-center gap-2">
              {cached && (
                <span className="text-[10px] font-mono text-[#f5c842] bg-[#f5c842]/10 px-2 py-0.5 rounded border border-[#f5c842]/20">
                  ⚡ CACHE
                </span>
              )}
              <button
                onClick={() => navigator.clipboard.writeText(result)}
                className="text-xs font-mono text-[#7070a0] hover:text-[#7fff6e] transition-colors"
              >
                Copiar
              </button>
            </div>
          </div>
          <div className="text-sm text-[#e8e8f8] leading-relaxed whitespace-pre-wrap font-mono">
            {result}
          </div>
        </Card>
      )}
    </div>
  )
}
