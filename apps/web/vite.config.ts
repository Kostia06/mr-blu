import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const supabaseModule = (pkg: string) =>
  path.resolve(__dirname, `../../node_modules/@supabase/${pkg}/dist/module/index.js`)

export default defineConfig({
  plugins: [preact(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
      '@supabase/auth-js': supabaseModule('auth-js'),
      '@supabase/functions-js': supabaseModule('functions-js'),
      '@supabase/realtime-js': supabaseModule('realtime-js'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
})
