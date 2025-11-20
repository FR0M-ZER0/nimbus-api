import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {

    environment: 'node',


    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/src/generated/prisma/**',
    ],


    logHeapUsage: false, 
    sourcemapIgnoreList: (sourcePath, _mapPath) => {
      return sourcePath.includes('src/generated/prisma');
    },
  },
});