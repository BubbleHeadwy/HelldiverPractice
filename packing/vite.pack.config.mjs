import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const outDir = path.resolve(__dirname, '.artifacts', 'web')

export default defineConfig({
  root: projectRoot,
  plugins: [vue()],
  build: {
    outDir,
    emptyOutDir: true,
  },
})
