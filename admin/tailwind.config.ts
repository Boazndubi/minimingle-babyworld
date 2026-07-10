import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0e27',
          800: '#0f1535',
          700: '#162044',
          600: '#1e2a5a',
          500: '#2a3a6e',
        },
        glass: {
          DEFAULT: 'rgba(30, 42, 90, 0.6)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        accent: {
          blue: '#3b82f6',
          cyan: '#06b6d4',
          purple: '#8b5cf6',
          pink: '#ec4899',
          green: '#10b981',
          red: '#ef4444',
          orange: '#f59e0b',
          yellow: '#eab308',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'dashboard': 'linear-gradient(135deg, #0a0e27 0%, #0f1535 50%, #162044 100%)',
      },
      backdropBlur: {
        'glass': '16px',
      }
    },
  },
  plugins: [],
}
export default config