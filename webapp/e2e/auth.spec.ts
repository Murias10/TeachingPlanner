import { test, expect } from '@playwright/test';

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
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // Esperar a que aparezca el formulario de login
    await page.waitForLoadState('networkidle');
  });

  test('should display login form', async ({ page }) => {
    // Verificar que estamos en la página de login
    await expect(page).toHaveURL('/login');

    // Verificar elementos del formulario
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesión|login/i })).toBeVisible();
  });

  test('should show validation error for empty fields', async ({ page }) => {
    // Click en el botón de login sin llenar campos
    const loginButton = page.getByRole('button', { name: /iniciar sesión|login|sign in/i }).last();
    await loginButton.click();

    // El formulario puede usar validación HTML5 o mostrar un mensaje
    // Verificar que no nos redirige (nos quedamos en /login) usando auto-wait de Playwright
    await expect(page).toHaveURL('/login', { timeout: 2000 });
  });

  test('should show error for incorrect credentials', async ({ page }) => {
    // Llenar con credenciales incorrectas
    await page.getByLabel(/email/i).fill('wrong@email.com');
    await page.getByLabel(/contraseña|password/i).fill('wrongpassword');

    // Click en login (usar last() para evitar conflictos con el botón de la página inicial)
    await page.getByRole('button', { name: /iniciar sesión|login|sign in/i }).last().click();

    // Debe mostrar error de credenciales (español o inglés)
    await expect(
      page.locator('text=/credenciales incorrectas|incorrect credentials|invalid.*email.*password/i')
    ).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // IMPORTANTE: Este test requiere un usuario válido en la DB
    // Ajusta las credenciales según tu entorno de prueba
    const testEmail = process.env.TEST_USER_EMAIL || 'admin@test.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'Admin123!';

    // Llenar formulario de login
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/contraseña|password/i).fill(testPassword);

    // Click en login
    await page.getByRole('button', { name: /iniciar sesión|login|sign in/i }).last().click();

    // Esperar redirección a /home (puede tomar un momento)
    await expect(page).toHaveURL('/home', { timeout: 10000 });

    // Verificar que estamos autenticados
    await expect(
      page.locator('text=/gestión académica|academic management/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to different pages after login', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL || 'admin@test.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'Admin123!';

    // Login
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/contraseña|password/i).fill(testPassword);
    await page.getByRole('button', { name: /iniciar sesión|login|sign in/i }).last().click();

    // Esperar redirección
    await expect(page).toHaveURL('/home', { timeout: 10000 });

    // Navegar a Classrooms
    await page.getByRole('link', { name: /aulas|classrooms/i }).click();
    await expect(page).toHaveURL('/classrooms', { timeout: 5000 });

    // Navegar a Degrees
    await page.getByRole('link', { name: /titulaciones|degrees/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/degrees', { timeout: 10000 });

    // Intentar navegar a Calendars (si existe el enlace)
    const calendarsLink = page.getByRole('link', { name: /calendarios|calendars/i });
    const linkExists = await calendarsLink.count() > 0;

    if (linkExists) {
      await calendarsLink.click();
      await expect(page).toHaveURL('/calendars', { timeout: 5000 });
    } else {
      // Si no existe el enlace, intentar navegar directamente
      await page.goto('/calendars');
      // Verificar que estamos autenticados (no redirige a login)
      await expect(page).not.toHaveURL('/login');
    }
  });

  test('should logout successfully', async ({ page }) => {
    const testEmail = process.env.TEST_USER_EMAIL || 'admin@test.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'Admin123!';

    // Login
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/contraseña|password/i).fill(testPassword);
    await page.getByRole('button', { name: /iniciar sesión|login|sign in/i }).last().click();
    await expect(page).toHaveURL('/home', { timeout: 10000 });

    // Buscar y hacer clic en el menú de usuario (botón en la parte inferior izquierda)
    const userButton = page.getByRole('button', { name: testEmail });
    await userButton.click({ timeout: 5000 });

    // Esperar a que el menú se abra y hacer click en "Log out"
    const logoutMenuItem = page.getByRole('menuitem', { name: /log out|cerrar sesión/i });
    await expect(logoutMenuItem).toBeVisible();
    await logoutMenuItem.click();

    // Debe redirigir a la página inicial
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });
});
