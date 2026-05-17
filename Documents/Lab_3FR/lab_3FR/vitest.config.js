import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**'],
      exclude: [
        'src/app.js',
        'src/server.js',
        'src/constants/**',
        'src/data/**',
        'src/scripts/**',
        'src/migrations/**',
        'src/models/**',
        'src/transforms/**',
        'src/utils/backup.js',
        'src/utils/externalFetch.js',
        'src/routes/githubRoutesV1.js',
        'src/routes/githubRoutesV2.js',
        'src/routes/backupRoutes.js',
        'src/routes/healthRoutes.js',
        'src/controllers/githubController.js',
        'src/controllers/githubControllerV2.js',
        'src/controllers/healthController.js',
        'src/controllers/tasksController.js',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
