/**
 * lib/ai.ts
 * Abstração de provedor de IA.
 * Troca entre Gemini (validação grátis) e Anthropic (produção)
 * apenas mudando AI_PROVIDER no .env.local
 */

export type AIModel = 'fast' | 'smart'
// fast  → Haiku (Anthropic) | gemini-1.5-flash (Gemini)
// smart → Sonnet (Anthropic) | gemini-1.5-pro   (Gemini)

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  text: string
  inputTokens: number
  outputTokens: number
  cost: number
}

// ── CUSTOS por token (USD) ────────────────────────────────
const COSTS = {
  anthropic: {
    fast:  { input: 1.00 / 1_000_000, output: 5.00  / 1_000_000 }, // Haiku
    smart: { input: 3.00 / 1_000_000, output: 15.00 / 1_000_000 }, // Sonnet
  },
  gemini: {
    fast:  { input: 0, output: 0 }, // Flash — gratuito no tier free
    smart: { input: 0, output: 0 }, // Pro   — gratuito no tier free
  },
}

// ── GEMINI ────────────────────────────────────────────────
async function callGemini(
  systemPrompt: string,
  messages: AIMessage[],
  model: AIModel
): Promise<AIResponse> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

  const modelName = model === 'fast' ? 'gemini-1.5-flash' : 'gemini-1.5-pro'
  const geminiModel = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
  })

  // Monta histórico no formato Gemini
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const chat = geminiModel.startChat({ history })
  const lastMessage = messages[messages.length - 1].content
  const result = await chat.sendMessage(lastMessage)
  const text = result.response.text()

  // Gemini retorna metadados de tokens na resposta
  const usage = result.response.usageMetadata
  const inputTokens  = usage?.promptTokenCount     ?? 0
  const outputTokens = usage?.candidatesTokenCount ?? 0

  return { text, inputTokens, outputTokens, cost: 0 }
}

// ── ANTHROPIC ─────────────────────────────────────────────
async function callAnthropic(
  systemPrompt: string,
  messages: AIMessage[],
  model: AIModel
): Promise<AIResponse> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const modelName =
    model === 'fast'
      ? 'claude-haiku-4-5-20251001'
      : 'claude-sonnet-4-6'

  const response = await client.messages.create({
    model: modelName,
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const inputTokens  = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const c = COSTS.anthropic[model]
  const cost = inputTokens * c.input + outputTokens * c.output

  return { text, inputTokens, outputTokens, cost }
}

// ── EXPORT PRINCIPAL ──────────────────────────────────────
export async function callAI(
  systemPrompt: string,
  messages: AIMessage[],
  model: AIModel = 'fast'
): Promise<AIResponse> {
  const provider = process.env.AI_PROVIDER ?? 'gemini'

  if (provider === 'anthropic') {
    return callAnthropic(systemPrompt, messages, model)
  }
  return callGemini(systemPrompt, messages, model)
}

// ── DETECTOR DE COMPLEXIDADE ─────────────────────────────
// Decide automaticamente se usa fast (Haiku) ou smart (Sonnet)
const COMPLEX_KEYWORDS = [
  'analise', 'análise', 'analisa', 'tendência', 'tendencia',
  'tendências', 'previsão', 'previsao', 'anomalia', 'anomalias',
  'compare', 'compara', 'correlação', 'correlacao', 'padrão',
  'padrao', 'insight', 'por que', 'porque', 'explique',
  'identifique', 'projeção', 'projecao', 'forecast',
]

export function detectModel(question: string): AIModel {
  const lower = question.toLowerCase()
  return COMPLEX_KEYWORDS.some((kw) => lower.includes(kw)) ? 'smart' : 'fast'
}
