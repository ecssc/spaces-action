import { resolve } from 'path'

import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'node22',
    ssr: true,
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['cjs'],
      fileName: () => 'index.cjs',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'index.cjs',
      },
    },
    minify: false,
    sourcemap: false,
  },
  ssr: {
    noExternal: true,
  },
})
