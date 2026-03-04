import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px'
      },
      colors: {
        brand: 'var(--primary-color)'
      }
    }
  },
  plugins: []
}

export default config
