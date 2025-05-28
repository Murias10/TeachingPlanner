import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['cjs'],// CommonJS format for Node.js compatibility
    target: 'node18',
    sourcemap: true,
    clean: true,
    dts: false,
})
