import { Page, expect } from '@playwright/test';
import { API_BASE_URL, TEST_CREDENTIALS, TIMEOUTS } from './constants';

/**
 * Login via UI con las credenciales de prueba.
 * Navega a la raíz, rellena el formulario y verifica la redirección a /home.
 */
export async function loginUI(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/email/i).fill(TEST_CREDENTIALS.email);
  await page.getByLabel(/contraseña|password/i).fill(TEST_CREDENTIALS.password);
  await page.getByRole('button', { name: /iniciar sesión|sign in/i }).last().click();
  await expect(page).toHaveURL('/home', { timeout: TIMEOUTS.STANDARD });
}

/**
 * Obtiene un JWT de administrador vía API.
 * Úsalo en beforeAll para crear datos de prueba con autenticación.
 */
export async function getAuthToken(page: Page): Promise<string> {
  const response = await page.request.post(`${API_BASE_URL}/auth/login`, {
    data: {
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password,
    },
  });
  if (!response.ok()) {
    throw new Error(`Failed to get auth token: ${response.status()}`);
  }
  const data = await response.json();
  return data.data.token;
}
