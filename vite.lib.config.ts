import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const peerDeps = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  '@dnd-kit/core',
  '@dnd-kit/sortable',
  '@dnd-kit/utilities',
  '@tanstack/react-virtual',
]

export default defineConfig({
  publicDir: false,
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.resolve(__dirname, 'tsconfig.app.json'),
      insertTypesEntry: false,
      exclude: ['src/App.tsx', 'src/App.css', 'src/main.tsx', 'src/data/**'],
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: peerDeps,
      output: {
        assetFileNames: 'edge-table[extname]',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: false,
  },
})
