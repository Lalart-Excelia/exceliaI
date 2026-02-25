-- ════════════════════════════════════════════════
-- SheetMind — Schema Supabase
-- Cole no SQL Editor do Supabase e execute
-- ════════════════════════════════════════════════

-- Usuários (sincronizado com Clerk via webhook)
CREATE TABLE users (
  id                     TEXT PRIMARY KEY,  -- = clerk user id
  email                  TEXT NOT NULL,
  plan                   TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','starter','pro')),
  credits_used           INT  NOT NULL DEFAULT 0,
  credits_reset_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Logs de uso da API
CREATE TABLE usage_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool          TEXT NOT NULL CHECK (tool IN ('formula','chat','template','insights','export')),
  model         TEXT NOT NULL CHECK (model IN ('fast','smart')),
  input_tokens  INT  NOT NULL DEFAULT 0,
  output_tokens INT  NOT NULL DEFAULT 0,
  cost_usd      NUMERIC(10,8) NOT NULL DEFAULT 0,
  cached        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Templates gerados
CREATE TABLE templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  content_json JSONB NOT NULL,
  expires_at   TIMESTAMPTZ,  -- NULL = permanente (pagos)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Histórico de downloads
CREATE TABLE downloads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename   TEXT NOT NULL,
  file_type  TEXT NOT NULL CHECK (file_type IN ('csv','xlsx','pdf','pptx')),
  tool       TEXT NOT NULL,
  r2_key     TEXT NOT NULL,
  expires_at TIMESTAMPTZ,  -- NULL = permanente
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compras / histórico de planos
CREATE TABLE purchases (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan           TEXT NOT NULL,
  stripe_session TEXT,
  amount         INT,  -- centavos
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ÍNDICES ────────────────────────────────────────────────
CREATE INDEX idx_usage_logs_user_id   ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created   ON usage_logs(created_at);
CREATE INDEX idx_templates_user_id    ON templates(user_id);
CREATE INDEX idx_templates_expires    ON templates(expires_at);
CREATE INDEX idx_downloads_user_id    ON downloads(user_id);
CREATE INDEX idx_purchases_user_id    ON purchases(user_id);

-- ── FUNÇÃO PARA INCREMENTAR CRÉDITOS ─────────────────────
CREATE OR REPLACE FUNCTION increment(x INT)
RETURNS INT AS $$
  SELECT credits_used + x FROM users WHERE id = id;
$$ LANGUAGE SQL;

-- ── RLS (Row Level Security) ──────────────────────────────
ALTER TABLE users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases   ENABLE ROW LEVEL SECURITY;

-- Usuários só veem seus próprios dados
CREATE POLICY "users_own" ON users       FOR ALL USING (id = auth.uid()::text);
CREATE POLICY "logs_own"  ON usage_logs  FOR ALL USING (user_id = auth.uid()::text);
CREATE POLICY "tmpl_own"  ON templates   FOR ALL USING (user_id = auth.uid()::text);
CREATE POLICY "dl_own"    ON downloads   FOR ALL USING (user_id = auth.uid()::text);
CREATE POLICY "pur_own"   ON purchases   FOR ALL USING (user_id = auth.uid()::text);

-- ── LIMPEZA AUTOMÁTICA DE TEMPLATES EXPIRADOS ─────────────
-- Rode via pg_cron ou Supabase Edge Functions diariamente:
-- DELETE FROM templates WHERE expires_at < NOW();
-- DELETE FROM downloads  WHERE expires_at < NOW();
