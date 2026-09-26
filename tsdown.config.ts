import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { index: 'src/index.ts', cli: 'src/cli.ts' },
  format: ['esm', 'cjs'],
  fixedExtension: false,
  dts: true,
  sourcemap: true,
  outDir: 'dist'
});
