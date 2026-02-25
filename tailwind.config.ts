import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-syne)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        bg:     '#07070f',
        surf:   '#0f0f1a',
        surf2:  '#141424',
        border: '#1c1c30',
        tx:     '#e8e8f8',
        tx2:    '#7070a0',
        tx3:    '#3a3a60',
        ac:     '#7fff6e',
        ac2:    '#00d4ff',
        warn:   '#f5c842',
        danger: '#ff5a5a',
      },
    },
  },
  plugins: [],
}

export default config
