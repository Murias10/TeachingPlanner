import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para tests E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  /* Ejecutar tests en paralelo */
  fullyParallel: true,

  /* Fallar si quedó test.only en CI */
  forbidOnly: !!process.env.CI,

  /* Reintentos solo en CI */
  retries: process.env.CI ? 2 : 0,

  /* Workers: paralelismo */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter a usar */
  reporter: 'html',

  /* Configuración compartida para todos los proyectos */
  use: {
    /* URL base de la aplicación */
    baseURL: 'http://localhost:5173',

    /* Capturar trazas en primer retry */
    trace: 'on-first-retry',

    /* Screenshots solo en fallos */
    screenshot: 'only-on-failure',

    /* Videos solo en primer retry */
    video: 'retain-on-failure',
  },

  /* Configurar proyectos para diferentes navegadores */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    /* Descomentar para testear en más navegadores
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    */
  ],

  /* Levantar servidor de desarrollo antes de los tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutos para levantar el servidor
  },
});
