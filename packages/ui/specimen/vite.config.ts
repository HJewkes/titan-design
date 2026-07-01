import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import path from 'path'

export default defineConfig({
  plugins: [react({ jsxImportSource: 'nativewind' })],
  root: __dirname,
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: path.resolve(__dirname, '../tailwind.config.js') }),
        autoprefixer(),
      ],
    },
  },
})
