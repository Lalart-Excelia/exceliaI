import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

export const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// ── CACHE DE RESPOSTAS IA ─────────────────────────────────
const CACHE_TTL = 60 * 60 * 24 // 24 horas

export async function getCached(key: string): Promise<string | null> {
  try {
    return await redis.get<string>(key)
  } catch {
    return null
  }
}

export async function setCache(key: string, value: string, ttl = CACHE_TTL) {
  try {
    await redis.setex(key, ttl, value)
  } catch {
    // falha silenciosa — cache não é crítico
  }
}

// Gera chave de cache determinística
export function cacheKey(tool: string, ...parts: string[]): string {
  const hash = parts.join('|').toLowerCase().trim()
  return `sm:${tool}:${Buffer.from(hash).toString('base64').slice(0, 32)}`
}

// ── RATE LIMITER ──────────────────────────────────────────
// Limita por userId para evitar abuso
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 req/min por usuário
  analytics: true,
})
