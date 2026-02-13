import { test, expect, Page } from '@playwright/test';

/**
 * Tests E2E de Gestión de Cursos (Courses)
 *
 * REQUISITOS:
 * - Backend services running (gateway_service, planner_service)
 * - Usuario de prueba autenticado con permisos de admin
 * - Base de datos de prueba limpia o con datos conocidos
 * - Al menos una titulación (Degree) creada en la base de datos
 *
 * NOTA: Los cursos dependen de Degrees, por lo que necesitan tener
 * al menos una titulación asociada en la base de datos.
 */

// ===== CONSTANTES =====
const TIMEOUTS = {
  STANDARD: 10000,
  SHORT: 5000,
  FILTER_APPLY: 500,
  DRAWER_ANIMATION: 500,
  NETWORK_IDLE: 1000,
} as const;

const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL || 'admin@test.com',
  password: process.env.TEST_USER_PASSWORD || 'Admin123!',
} as const;

const ALERT_MESSAGES = {
  CREATED: 'successfully created',
  UPDATED: 'successfully updated',
  DELETED: 'successfully deleted',
} as const;

const DIALOG_TITLES = {
  CONFIRM_DELETION: 'Confirm deletion',
} as const;

// ===== HELPERS =====

/**
 * Genera un año académico único basado en el año actual
 */
function getUniqueAcademicYear(): string {
  const currentYear = new Date().getFullYear();
  const randomOffset = Math.floor(Math.random() * 10) - 5; // -5 a +5
  const startYear = currentYear + randomOffset;
  return `${startYear}-${startYear + 1}`;
}

/**
 * Filtra la tabla y busca una fila específica por año académico
 */
async function filterAndFindRow(page: Page, searchText: string) {
  const filterInput = page.getByPlaceholder(/filtrar|filter.*curso|course/i);
  await filterInput.fill(searchText);
  await page.waitForTimeout(TIMEOUTS.FILTER_APPLY);

  const row = page.locator(`tr:has-text("${searchText}")`);
  await expect(row).toBeVisible({ timeout: TIMEOUTS.STANDARD });
  return row;
}

/**
 * Click en el botón de crear curso
 */
async function clickCreateButton(page: Page) {
  const createBtn = page.getByRole('button', { name: /create course/i });
  await createBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.STANDARD });
  await createBtn.click();
  await page.waitForTimeout(TIMEOUTS.DRAWER_ANIMATION);
}

/**
 * Espera y verifica que aparezca una alerta de éxito
 */
async function expectSuccessAlert(page: Page, messagePattern: string) {
  await expect(
    page.getByRole('alert').filter({ hasText: new RegExp(messagePattern, 'i') })
  ).toBeVisible({ timeout: TIMEOUTS.STANDARD });
}

/**
 * Crea un curso con el año académico proporcionado
 */
async function createCourse(page: Page, academicYear: string) {
  await clickCreateButton(page);

  await expect(
    page.getByRole('heading', { name: /crear.*curso|create course/i })
  ).toBeVisible({ timeout: TIMEOUTS.SHORT });

  // Seleccionar año académico del dropdown
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: academicYear }).click();

  // El estado por defecto es PLANIFICADO y está deshabilitado
  await page.getByRole('button', { name: /guardar|save.*course/i }).click();

  await expectSuccessAlert(page, ALERT_MESSAGES.CREATED);
  await page.waitForLoadState('networkidle');
}

// ===== TESTS =====

test.describe('Course Management', () => {
  let testDegreeAcronym: string;

  // Setup: Login y navegación antes de cada test
  test.beforeEach(async ({ page }) => {
    // Navegar a página inicial
    await page.goto('/');

    // Click en "Iniciar sesión"
    await page.getByRole('button', { name: /iniciar sesión|login/i }).click();
    await page.waitForLoadState('networkidle');

    // Login
    await page.getByLabel(/email/i).fill(TEST_CREDENTIALS.email);
    await page.getByLabel(/contraseña|password/i).fill(TEST_CREDENTIALS.password);
    await page.getByRole('button', { name: /iniciar sesión|login|sign in/i }).last().click();

    // Esperar redirección a home
    await expect(page).toHaveURL('/home', { timeout: TIMEOUTS.STANDARD });

    // Crear un Degree de prueba para los cursos
    await page.goto('/degrees');
    await page.waitForLoadState('networkidle');

    // Generar datos únicos para el degree
    const uniqueId = Date.now().toString().slice(-6);
    const degreeName = `INGENIERÍA DE PRUEBA`;
    testDegreeAcronym = `TEST${uniqueId}`;

    // Crear el degree
    const createBtn = page.getByRole('button', { name: /create degree/i });
    await createBtn.waitFor({ state: 'visible', timeout: TIMEOUTS.STANDARD });
    await createBtn.click();
    await page.waitForTimeout(TIMEOUTS.DRAWER_ANIMATION);

    await expect(
      page.getByRole('heading', { name: /crear.*titulación|create degree/i })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    await page.getByLabel(/nombre.*titulación|degree name/i).fill(degreeName);
    await page.getByLabel(/acrónimo|acronym/i).fill(testDegreeAcronym);
    await page.getByRole('button', { name: /guardar|save.*degree/i }).click();

    // Esperar a que se cierre el drawer y se actualice la tabla
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(TIMEOUTS.NETWORK_IDLE);

    // Navegar a la página de cursos de ese degree
    await page.goto(`/degrees/${testDegreeAcronym.toLowerCase()}/courses`);
    await page.waitForLoadState('networkidle');

    // Scroll hacia arriba para asegurar que el toolbar esté visible
    await page.evaluate(() => window.scrollTo(0, 0));
  });

  test('should display courses list', async ({ page }) => {
    // Verificar que existe la tabla con encabezados
    await expect(page.locator('th').filter({ hasText: /course|curso/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /state|estado/i })).toBeVisible();
  });

  test('should create new course successfully', async ({ page }) => {
    // Generar año académico único
    const academicYear = getUniqueAcademicYear();

    await createCourse(page, academicYear);

    // Verificar que el curso aparece en la tabla
    const filterInput = page.getByPlaceholder(/filtrar|filter.*curso|course/i);
    await filterInput.fill(academicYear);
    await page.waitForTimeout(TIMEOUTS.FILTER_APPLY);

    const row = page.locator(`tr:has-text("${academicYear}")`);
    await expect(row).toBeVisible({ timeout: TIMEOUTS.STANDARD });
    await expect(row).toContainText(/planificado|planned/i);
  });

  test('should show error when creating course with duplicate year', async ({ page }) => {
    // Crear primer curso
    const academicYear = getUniqueAcademicYear();

    await createCourse(page, academicYear);
    await page.waitForTimeout(TIMEOUTS.NETWORK_IDLE);

    // Intentar crear otro con el mismo año
    await clickCreateButton(page);
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: academicYear }).click();
    await page.getByRole('button', { name: /guardar|save.*course/i }).click();

    // Debe mostrar error
    await page.waitForTimeout(1000);
    const errorText = page.locator('text=/error.*course|ya existe|already exists/i');
    await expect(errorText.first()).toBeVisible({ timeout: TIMEOUTS.STANDARD });
  });

  test('should edit course state successfully', async ({ page }) => {
    // Crear curso para editar
    const academicYear = getUniqueAcademicYear();

    await createCourse(page, academicYear);

    // Buscar el curso en la tabla
    const filterInput = page.getByPlaceholder(/filtrar|filter.*curso|course/i);
    await filterInput.fill(academicYear);
    await page.waitForTimeout(TIMEOUTS.FILTER_APPLY);

    const tableRow = page.locator(`tr:has-text("${academicYear}")`);
    await expect(tableRow).toBeVisible({ timeout: TIMEOUTS.STANDARD });

    // Abrir el menú de acciones (MoreHorizontal button)
    const moreButton = tableRow.getByRole('button', { name: /open menu/i });
    await moreButton.click({ timeout: TIMEOUTS.STANDARD });

    // Click en editar del dropdown menu
    await page.getByRole('menuitem', { name: /edit/i }).click();

    // Esperar drawer de edición
    await expect(
      page.getByRole('heading', { name: /editar.*curso|edit course/i })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Cambiar estado a ACTIVO (el combobox de estado es el segundo, el primero es el año académico)
    const stateCombobox = page.getByRole('combobox').nth(1);
    await stateCombobox.click();
    await page.getByRole('option', { name: /activo|active/i }).click();

    // Guardar cambios
    await page.getByRole('button', { name: /guardar.*cambios|save.*changes/i }).click();

    // Esperar mensaje de éxito
    await expectSuccessAlert(page, ALERT_MESSAGES.UPDATED);

    // Verificar que el estado cambió
    await page.waitForLoadState('networkidle');
    await filterInput.clear();
    await filterInput.fill(academicYear);
    await page.waitForTimeout(TIMEOUTS.FILTER_APPLY);

    const updatedRow = page.locator(`tr:has-text("${academicYear}")`);
    await expect(updatedRow).toBeVisible({ timeout: TIMEOUTS.STANDARD });
    await expect(updatedRow).toContainText(/activo|active/i);
  });

  test('should delete course successfully', async ({ page }) => {
    // Crear curso para eliminar
    const academicYear = getUniqueAcademicYear();

    await createCourse(page, academicYear);

    // Buscar el curso en la tabla
    const filterInput = page.getByPlaceholder(/filtrar|filter.*curso|course/i);
    await filterInput.fill(academicYear);
    await page.waitForTimeout(TIMEOUTS.FILTER_APPLY);

    const row = page.locator(`tr:has-text("${academicYear}")`);
    await expect(row).toBeVisible({ timeout: TIMEOUTS.STANDARD });

    // Abrir el menú de acciones
    const moreButton = row.getByRole('button', { name: /open menu/i });
    await moreButton.click({ timeout: TIMEOUTS.STANDARD });

    // Click en delete del dropdown menu
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // Debe aparecer diálogo de confirmación
    const dialog = page.getByRole('alertdialog');
    await expect(
      dialog.getByRole('heading', { name: DIALOG_TITLES.CONFIRM_DELETION })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Debe mencionar que se eliminarán datos relacionados
    await expect(
      dialog.getByText(/groups|subjects|events|grupos|asignaturas/i)
    ).toBeVisible();

    // Confirmar eliminación
    await page.getByRole('button', { name: /confirmar|confirm/i }).click();

    // Esperar mensaje de éxito
    await expectSuccessAlert(page, ALERT_MESSAGES.DELETED);

    // Verificar que el curso ya no aparece en la tabla
    await page.waitForLoadState('networkidle');
    await filterInput.fill(academicYear);
    await page.waitForTimeout(TIMEOUTS.FILTER_APPLY);

    await expect(
      page.locator('table').getByText(academicYear)
    ).not.toBeVisible({ timeout: TIMEOUTS.SHORT });
  });

  test('should cancel delete operation', async ({ page }) => {
    // Crear curso
    const academicYear = getUniqueAcademicYear();

    await createCourse(page, academicYear);

    // Buscar el curso en la tabla
    const filterInput = page.getByPlaceholder(/filtrar|filter.*curso|course/i);
    await filterInput.fill(academicYear);
    await page.waitForTimeout(TIMEOUTS.FILTER_APPLY);

    const row = page.locator(`tr:has-text("${academicYear}")`);
    await expect(row).toBeVisible({ timeout: TIMEOUTS.STANDARD });

    // Abrir el menú de acciones
    const moreButton = row.getByRole('button', { name: /open menu/i });
    await moreButton.click({ timeout: TIMEOUTS.STANDARD });

    // Click en delete del dropdown menu
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // Apareció el diálogo
    await expect(
      page.getByRole('heading', { name: DIALOG_TITLES.CONFIRM_DELETION })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Click en cancelar
    await page.getByRole('button', { name: /cancelar|cancel/i }).click();

    // El curso debe seguir en la tabla
    await expect(
      page.locator('table').getByText(academicYear)
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });
  });

  test('should filter courses by academic year', async ({ page }) => {
    // Crear dos cursos con años diferentes
    const year1 = getUniqueAcademicYear();
    const year2 = getUniqueAcademicYear();

    // Asegurar que sean diferentes
    if (year1 === year2) {
      test.skip();
    }

    // Crear primer curso
    await createCourse(page, year1);
    await page.waitForLoadState('networkidle');

    // Crear segundo curso
    await createCourse(page, year2);
    await page.waitForLoadState('networkidle');

    // Filtrar por el primer año
    const filterInput = page.getByPlaceholder(/filtrar|filter.*curso|course/i);
    await filterInput.fill(year1);
    await page.waitForTimeout(TIMEOUTS.FILTER_APPLY);

    // Solo debe aparecer el primero
    await expect(page.locator(`tr:has-text("${year1}")`)).toBeVisible({ timeout: TIMEOUTS.STANDARD });
    await expect(page.locator(`tr:has-text("${year2}")`)).not.toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Cambiar filtro al segundo año
    await filterInput.clear();
    await filterInput.fill(year2);
    await page.waitForTimeout(TIMEOUTS.FILTER_APPLY);

    // Solo debe aparecer el segundo
    await expect(page.locator(`tr:has-text("${year2}")`)).toBeVisible({ timeout: TIMEOUTS.STANDARD });
    await expect(page.locator(`tr:has-text("${year1}")`)).not.toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Limpiar filtro
    await filterInput.clear();
    await page.waitForTimeout(TIMEOUTS.FILTER_APPLY);
  });

  test('should validate required fields in create form', async ({ page }) => {
    await clickCreateButton(page);

    await expect(
      page.getByRole('heading', { name: /crear.*curso|create course/i })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // El botón de guardar debe estar deshabilitado sin año académico
    const saveButton = page.getByRole('button', { name: /guardar|save.*course/i });
    await expect(saveButton).toBeDisabled();

    // Seleccionar año académico
    const academicYear = getUniqueAcademicYear();
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: academicYear }).click();

    // Ahora el botón debe estar habilitado
    await expect(saveButton).toBeEnabled();
  });

  test('should have default state as PLANIFICADO', async ({ page }) => {
    await clickCreateButton(page);

    await expect(
      page.getByRole('heading', { name: /crear.*curso|create course/i })
    ).toBeVisible({ timeout: TIMEOUTS.SHORT });

    // Verificar que el estado por defecto es PLANIFICADO y está deshabilitado
    const stateSelect = page.getByRole('combobox').nth(1);
    await expect(stateSelect).toBeDisabled();

    // Verificar que el texto muestra "PLANIFICADO" o "Planned" (usar .first() porque hay múltiples elementos)
    await expect(page.getByText(/planificado|planned/i).first()).toBeVisible();
  });
});
