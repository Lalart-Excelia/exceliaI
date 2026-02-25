import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Syne, DM_Mono } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '600', '700', '800'],
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title:       'SheetMind — IA para Planilhas',
  description: 'Gere fórmulas, analise dados e crie templates com IA em segundos.',
  keywords:    ['excel', 'google sheets', 'fórmulas', 'IA', 'planilhas'],
  openGraph: {
    title:       'SheetMind',
    description: 'IA para planilhas. Fórmulas, análises e templates em segundos.',
    type:        'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="pt-BR" className={`${syne.variable} ${dmMono.variable}`}>
        <body className="bg-[#07070f] text-[#e8e8f8] font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
