import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f4fb',
          100: '#cce9f7',
          200: '#99d3ef',
          300: '#66bde7',
          400: '#33a7df',
          500: '#0684c7',
          600: '#056fa6',
          700: '#045a85',
          800: '#034564',
          900: '#023043',
        },
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
        },
        blu: {
          primary: '#0066FF',
          'primary-light': '#3385FF',
          'primary-hover': '#0052CC',
          accent: '#00D4AA',
          'accent-cyan': '#0EA5E9',
          bg: '#DBE8F4',
          'bg-secondary': '#E8F0F7',
          'bg-dark': '#0a0a0a',
          'bg-dark-secondary': '#171717',
        },
        data: {
          green: '#10B981',
          amber: '#F59E0B',
          indigo: '#6366F1',
          red: '#EF4444',
        },
      },
      borderRadius: {
        card: '20px',
        button: '14px',
        input: '12px',
        chip: '100px',
      },
      fontFamily: {
        display: ['SpaceGrotesk'],
        body: ['Inter'],
        mono: ['JetBrainsMono'],
      },
    },
  },
  plugins: [],
} satisfies Config
