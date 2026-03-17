import { test, expect } from '@playwright/test';
import { TEST_CREDENTIALS, TIMEOUTS } from './helpers/constants';

/**
 * Tests E2E de Autenticación
 *
 * NOTA: Estos tests requieren que:
 * 1. Los servicios backend estén corriendo (auth_service, gateway_service, etc.)
 * 2. Exista un usuario de prueba en la base de datos
 *
 * Para crear usuario de prueba, ejecuta el script de seed o crea manualmente:
 * - Email: admin@test.com
 * - Password: Admin123!
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página inicial
    await page.goto('/');

    // Click en "Iniciar sesión" para ir al formulario de login
    await page.getByRole('button', { name: /iniciar sesión|sign in/i }).click();

    // Esperar a que aparezca el formulario de login
    await page.waitForLoadState('networkidle');
  });

  test('should display login form', async ({ page }) => {
    // Verificar que estamos en la página de login
    await expect(page).toHaveURL('/login');

    // Verificar elementos del formulario
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesión|sign in/i })).toBeVisible();
  });

  test('should show validation error for empty fields', async ({ page }) => {
    // Click en el botón de login sin llenar campos
    const loginButton = page.getByRole('button', { name: /iniciar sesión|sign in/i }).last();
    await loginButton.click();

    // Verificar que no nos redirige (nos quedamos en /login)
    await expect(page).toHaveURL('/login', { timeout: TIMEOUTS.VERY_SHORT });
  });

  test('should show error for incorrect credentials', async ({ page }) => {
    // Llenar con credenciales incorrectas
    await page.getByLabel(/email/i).fill('wrong@email.com');
    await page.getByLabel(/contraseña|password/i).fill('wrongpassword');

    // Click en login (usar last() para evitar conflictos con el botón de la página inicial)
    await page.getByRole('button', { name: /iniciar sesión|sign in/i }).last().click();

    // Debe mostrar error de credenciales
    await expect(
      page.getByRole('alert').filter({ hasText: /credenciales incorrectas|incorrect credentials|invalid.*email.*password/i })
    ).toBeVisible({ timeout: TIMEOUTS.STANDARD });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Llenar formulario de login
    await page.getByLabel(/email/i).fill(TEST_CREDENTIALS.email);
    await page.getByLabel(/contraseña|password/i).fill(TEST_CREDENTIALS.password);

    // Click en login
    await page.getByRole('button', { name: /iniciar sesión|sign in/i }).last().click();

    // Esperar redirección a /home
    await expect(page).toHaveURL('/home', { timeout: TIMEOUTS.STANDARD });

    // Verificar que estamos autenticados
    await expect(
      page.locator('text=/gestión académica|academic management/i')
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });
  });

  test('should navigate to different pages after login', async ({ page }) => {
    // Login
    await page.getByLabel(/email/i).fill(TEST_CREDENTIALS.email);
    await page.getByLabel(/contraseña|password/i).fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /iniciar sesión|sign in/i }).last().click();
    await expect(page).toHaveURL('/home', { timeout: TIMEOUTS.STANDARD });

    // Navegar a Classrooms
    await page.getByRole('link', { name: /aulas|classrooms/i }).click();
    await expect(page).toHaveURL('/classrooms', { timeout: TIMEOUTS.SHORT });

    // Navegar a Degrees
    await page.getByRole('link', { name: /titulaciones|degrees/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/(degrees|home)/, { timeout: TIMEOUTS.SHORT });

    // Intentar navegar a Calendars (si existe el enlace)
    const calendarsLink = page.getByRole('link', { name: /calendarios|calendars/i });
    const linkExists = await calendarsLink.count() > 0;

    if (linkExists) {
      await calendarsLink.click();
      await expect(page).toHaveURL('/calendars', { timeout: TIMEOUTS.SHORT });
    } else {
      // Si no existe el enlace, navegar directamente y verificar autenticación
      await page.goto('/calendars');
      await expect(page).not.toHaveURL('/login');
    }
  });

  test('should logout successfully', async ({ page }) => {
    // Login
    await page.getByLabel(/email/i).fill(TEST_CREDENTIALS.email);
    await page.getByLabel(/contraseña|password/i).fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /iniciar sesión|sign in/i }).last().click();
    await expect(page).toHaveURL('/home', { timeout: TIMEOUTS.STANDARD });

    // Buscar y hacer clic en el menú de usuario
    const userButton = page.getByRole('button', { name: TEST_CREDENTIALS.email });
    await userButton.click({ timeout: TIMEOUTS.SHORT });

    // Hacer click en "Log out"
    const logoutMenuItem = page.getByRole('menuitem', { name: /log out|cerrar sesión/i });
    await expect(logoutMenuItem).toBeVisible();
    await logoutMenuItem.click();

    // Debe redirigir a la página inicial
    await expect(page).toHaveURL('/', { timeout: TIMEOUTS.SHORT });
  });
});
