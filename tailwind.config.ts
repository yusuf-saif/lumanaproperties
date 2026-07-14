import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#0F172A',
        surface: '#F8FAFC',
        card: '#FFFFFF',
        primary: '#2563EB',
        danger: '#DC2626',
        warning: '#D97706',
        success: '#16A34A',
        purple: '#8B5CF6',
        border: '#E2E8F0',
        'text-main': '#0F172A',
        'text-sub': '#64748B',
      },
    },
  },
  plugins: [],
}

export default config
