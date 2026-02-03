import { resolve } from 'path'

import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'node24',
    ssr: true,
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['cjs'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'index.js',
      },
    },
    minify: false,
    sourcemap: false,
  },
  ssr: {
    noExternal: true,
  },
})
