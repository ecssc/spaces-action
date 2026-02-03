import base from '@ecssc/eslint-config/default'
import typescript from '@ecssc/eslint-config/typescript'
import { defineConfig } from 'eslint/config'

export default defineConfig(
  { ignores: ['dist', '*.js', '*.mjs', '*.cjs'] },
  base,
  typescript
)
