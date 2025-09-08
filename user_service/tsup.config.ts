import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['cjs'],
    target: 'node22',
    sourcemap: true,
    clean: true,
    dts: false,
})
