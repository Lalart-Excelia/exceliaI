'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { cn, Badge } from '@/components/ui'

const NAV_TOOLS = [
  { href: '/app',              icon: '⊞', label: 'Dashboard'          },
  { href: '/app/formulas',     icon: 'ƒ', label: 'Fórmulas'           },
  { href: '/app/chat',         icon: '◈', label: 'Chat with File'     },
  { href: '/app/templates',    icon: '▦', label: 'Templates'          },
  { href: '/app/insights',     icon: '◉', label: 'Insights'           },
]

const NAV_ACCOUNT = [
  { href: '/conta/creditos',   icon: '◎', label: 'Créditos'          },
  { href: '/conta/downloads',  icon: '↓', label: 'Downloads'         },
  { href: '/conta/templates',  icon: '▤', label: 'Meus Templates'    },
  { href: '/conta/fatura',     icon: '▣', label: 'Fatura'            },
  { href: '/conta/compras',    icon: '◈', label: 'Compras'           },
]

interface SidebarProps {
  plan:          string
  creditsUsed:   number
  creditsTotal:  number
}

export function Sidebar({ plan, creditsUsed, creditsTotal }: SidebarProps) {
  const pathname = usePathname()
  const pct = (creditsUsed / creditsTotal) * 100

  return (
    <aside className="w-[220px] flex-shrink-0 h-screen sticky top-0 bg-[#0f0f1a] border-r border-[#1c1c30] flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-[#1c1c30]">
        <Link href="/" className="flex items-center gap-2 text-base font-bold">
          <span className="text-[#7fff6e]">⬡</span>
          Sheet<span className="text-[#7fff6e]">Mind</span>
        </Link>
        <div className="mt-2">
          <Badge
            label={plan.toUpperCase()}
            variant={plan === 'pro' ? 'blue' : plan === 'starter' ? 'purple' : 'gray'}
          />
        </div>
      </div>

      {/* Ferramentas */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="text-[10px] font-mono text-[#3a3a60] tracking-widest px-3 mb-2 mt-1">FERRAMENTAS</div>
        {NAV_TOOLS.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold mb-0.5 transition-all',
              pathname === href
                ? 'bg-[#7fff6e]/10 text-[#7fff6e] border border-[#7fff6e]/20'
                : 'text-[#7070a0] hover:text-[#e8e8f8] hover:bg-[#141424]'
            )}
          >
            <span className="font-mono text-base">{icon}</span>
            {label}
          </Link>
        ))}

        <div className="text-[10px] font-mono text-[#3a3a60] tracking-widest px-3 mb-2 mt-5">MINHA CONTA</div>
        {NAV_ACCOUNT.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold mb-0.5 transition-all',
              pathname === href
                ? 'bg-[#7fff6e]/10 text-[#7fff6e] border border-[#7fff6e]/20'
                : 'text-[#7070a0] hover:text-[#e8e8f8] hover:bg-[#141424]'
            )}
          >
            <span className="font-mono text-base">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      {/* Créditos + upgrade */}
      <div className="p-4 border-t border-[#1c1c30]">
        {plan === 'free' && (
          <Link
            href="/#pricing"
            className="block w-full mb-3 text-center text-xs font-bold py-2 px-3 rounded-lg bg-[#7fff6e]/10 text-[#7fff6e] border border-[#7fff6e]/20 hover:bg-[#7fff6e]/20 transition-colors"
          >
            ⚡ Fazer upgrade
          </Link>
        )}
        <div className="text-xs font-mono text-[#3a3a60] mb-2">
          {creditsUsed}/{creditsTotal} créditos
        </div>
        <div className="h-1 bg-[#1c1c30] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: pct > 80 ? '#ff5a5a' : pct > 60 ? '#f5c842' : '#7fff6e',
            }}
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </aside>
  )
}
