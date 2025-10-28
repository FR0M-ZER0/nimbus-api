import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/src/generated/prisma/**',
    ],
  },

  build: {
    sourcemap: 'inline', 
    rollupOptions: {
      output: {
        sourcemapIgnoreList: (relativeSourcePath, sourcemapPath) => {
          return relativeSourcePath.includes('src/generated/prisma');
        },
      },
    },
  },

});