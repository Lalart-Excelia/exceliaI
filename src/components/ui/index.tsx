import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Button ─────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  size?:    'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary', size = 'md', loading, children, className, disabled, ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-sans'

  const variants = {
    primary: 'bg-[#7fff6e] text-[#07070f] hover:bg-[#6be05c] active:scale-[.98]',
    outline: 'border border-[#1c1c30] text-[#e8e8f8] hover:border-[#3a3a60] hover:bg-[#0f0f1a]',
    ghost:   'text-[#7070a0] hover:text-[#e8e8f8] hover:bg-[#0f0f1a]',
    danger:  'bg-[#ff5a5a] text-white hover:bg-[#e84444]',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}

// ── Input ──────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-mono text-[#7070a0] uppercase tracking-widest">{label}</label>
      )}
      <input
        className={cn(
          'w-full bg-[#0f0f1a] border border-[#1c1c30] rounded-lg px-4 py-2.5',
          'text-[#e8e8f8] text-sm placeholder:text-[#3a3a60]',
          'focus:outline-none focus:border-[#7fff6e] transition-colors',
          error && 'border-[#ff5a5a]',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-[#ff5a5a]">{error}</span>}
    </div>
  )
}

// ── Card ───────────────────────────────────────────────────
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-[#0f0f1a] border border-[#1c1c30] rounded-2xl p-6', className)}>
      {children}
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────
type BadgeVariant = 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'gray'

export function Badge({ label, variant = 'gray' }: { label: string; variant?: BadgeVariant }) {
  const colors: Record<BadgeVariant, string> = {
    green:  'bg-[#7fff6e]/10 text-[#7fff6e] border-[#7fff6e]/25',
    blue:   'bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/25',
    yellow: 'bg-[#f5c842]/10 text-[#f5c842] border-[#f5c842]/25',
    red:    'bg-[#ff5a5a]/10 text-[#ff5a5a] border-[#ff5a5a]/25',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
    gray:   'bg-white/5 text-[#7070a0] border-white/10',
  }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-medium border', colors[variant])}>
      {label}
    </span>
  )
}

// ── Loader ─────────────────────────────────────────────────
export function Loader({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-block border-2 border-current border-t-transparent rounded-full animate-spin"
    />
  )
}

// ── Credits Bar ────────────────────────────────────────────
export function CreditsBar({ used, total }: { used: number; total: number }) {
  const pct = Math.min((used / total) * 100, 100)
  const color = pct > 80 ? '#ff5a5a' : pct > 60 ? '#f5c842' : '#7fff6e'
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs font-mono text-[#7070a0]">
        <span>{used} usados</span>
        <span>{total - used} restantes</span>
      </div>
      <div className="h-1.5 bg-[#1c1c30] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}
