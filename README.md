# SheetMind

IA para planilhas — Fórmulas, Chat, Templates e Insights.

## Stack

| Camada       | Tecnologia              | Função                        |
|--------------|-------------------------|-------------------------------|
| Frontend     | Next.js 14 + Tailwind   | UI + SSR                      |
| IA (validação)| Gemini Flash/Pro (grátis)| Testar sem custo              |
| IA (produção)| Claude Haiku + Sonnet   | Baixo custo + alta qualidade  |
| Auth         | Clerk                   | Login/cadastro pronto         |
| Banco        | Supabase (PostgreSQL)   | Usuários, logs, templates     |
| Cache        | Upstash Redis           | Cache de IA + rate limiting   |
| Storage      | Cloudflare R2           | Arquivos e templates          |
| Pagamento    | Stripe                  | Assinaturas + avulso          |
| Deploy       | Vercel                  | Deploy automático             |

## Setup em 5 passos

### 1. Clone e instale
```bash
git clone ...
cd sheetmind
npm install
cp .env.local.example .env.local
```

### 2. Configure os serviços (em ordem)

**Gemini (grátis para validação)**
- Acesse: https://aistudio.google.com/app/apikey
- Crie uma chave e cole em `GEMINI_API_KEY`
- Mantenha `AI_PROVIDER=gemini`

**Clerk (auth)**
- Crie conta em https://clerk.com
- Novo projeto → copie as chaves para o `.env.local`
- Em Clerk Dashboard → Webhooks → adicione `/api/webhooks/clerk`

**Supabase (banco)**
- Crie projeto em https://supabase.com
- Vá em SQL Editor → cole o conteúdo de `supabase-schema.sql` → Execute
- Copie as chaves para o `.env.local`

**Upstash Redis (cache)**
- Crie banco em https://upstash.com
- Copie REST URL e token para o `.env.local`

**Stripe (pagamento)**
- Crie conta em https://stripe.com
- Crie 2 produtos: Starter ($9/mês) e Pro ($19/mês)
- Copie os Price IDs para o `.env.local`
- Para webhooks locais: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

**Cloudflare R2 (storage)**
- Crie bucket em https://dash.cloudflare.com → R2
- Crie API token com permissão de leitura/escrita
- Cole as credenciais no `.env.local`

### 3. Rode localmente
```bash
npm run dev
```
Acesse http://localhost:3000

### 4. Teste as ferramentas
1. Cadastre-se (Clerk)
2. Teste o Gerador de Fórmulas
3. Veja os logs de uso no Supabase → Table Editor → usage_logs

### 5. Deploy na Vercel
```bash
npm i -g vercel
vercel
```
- Adicione todas as variáveis de ambiente no painel da Vercel
- Configure o webhook do Stripe com a URL de produção

## Trocar para Anthropic (produção)

Quando quiser ir ao ar com Claude, mude só uma linha no `.env.local`:
```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

O código já está preparado — nenhuma outra alteração necessária.

## Estrutura de arquivos

```
src/
├── app/
│   ├── (public)/          # Landing, login, cadastro
│   ├── (app)/             # Área autenticada
│   │   ├── app/           # Ferramentas de IA
│   │   ├── conta/         # Área de membros
│   │   └── admin/         # Painel admin
│   └── api/               # API Routes
│       ├── formula/       # Gerador de fórmulas
│       ├── chat/          # Chat with File
│       ├── template/      # Gerador de templates
│       ├── insights/      # Dashboard de insights
│       ├── export/        # PDF/PPT
│       └── webhooks/      # Stripe webhook
├── components/
│   ├── ui/                # Button, Input, Card, Badge...
│   ├── tools/             # FormulasTool, ChatTool...
│   └── layout/            # Sidebar, Nav
└── lib/
    ├── ai.ts              # Abstração Gemini/Anthropic ← chave do projeto
    ├── credits.ts         # Sistema de créditos
    ├── redis.ts           # Cache + rate limiting
    ├── stripe.ts          # Pagamentos
    ├── supabase.ts        # Banco de dados
    ├── prompts.ts         # System prompts de cada ferramenta
    └── api-guard.ts       # Middleware auth + créditos
```

## Custos estimados (300 usuários pagantes)

| Item              | Custo/mês |
|-------------------|-----------|
| Vercel            | $20       |
| Supabase          | $25       |
| Upstash Redis     | $10       |
| Cloudflare R2     | $1        |
| Clerk             | $25       |
| Stripe (fees)     | ~$50      |
| API Claude        | ~$280     |
| **Total**         | **~$411** |
| **MRR estimado**  | **~$3.260** |
| **Margem**        | **~87%**  |
