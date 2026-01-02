/**
 * Constantes para la gestión de caracteres de eventos periódicos
 *
 * Este archivo centraliza la definición de caracteres de eventos para evitar
 * valores hardcoded dispersos en el código y facilitar el mantenimiento.
 */

/**
 * Caracteres estándar para tipos de eventos predefinidos
 */
export const EVENT_CHARACTERS = {
  /** Evento Normal - Se repite semanalmente */
  NORMAL: 'N',

  /** Evento Par - Se repite en semanas pares (quincenalmente) */
  PAR: 'P',

  /** Evento Impar - Se repite en semanas impares (quincenalmente) */
  IMPAR: 'I',
} as const;

/**
 * Caracteres especiales para días del calendario
 */
export const DAY_CHARACTERS = {
  /** Día festivo o fin de semana (no lectivo) */
  NON_LECTIVE: 'F',
} as const;

/**
 * Pool de caracteres disponibles para eventos personalizados
 *
 * Incluye:
 * - Alfabeto latino básico (sin N, P, I ya reservados)
 * - Alfabeto griego (mayúsculas)
 * - Alfabeto cirílico (mayúsculas)
 * - Números 0-9
 *
 * Total: ~90 caracteres disponibles
 * Codificación: UTF-8
 */

// Alfabeto latino (excluyendo N, P, I ya asignados)
const LATIN_CHARS = 'ABCDEFGHJKLMOQRSTUVWXYZ';

// Alfabeto griego (mayúsculas) - 24 caracteres
const GREEK_CHARS = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';

// Alfabeto cirílico (mayúsculas) - 33 caracteres
const CYRILLIC_CHARS = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';

// Números
const NUMBERS = '0123456789';

/**
 * Pool completo de caracteres disponibles para asignación dinámica
 * Total aproximado: 90 caracteres
 */
export const AVAILABLE_CHARACTERS = LATIN_CHARS + GREEK_CHARS + CYRILLIC_CHARS + NUMBERS;

/**
 * Límite máximo de tipos de eventos diferentes por calendario
 */
export const MAX_EVENT_TYPES = AVAILABLE_CHARACTERS.length;

/**
 * Verifica si un carácter es uno de los caracteres estándar predefinidos
 */
export function isStandardCharacter(char: string): boolean {
  return Object.values(EVENT_CHARACTERS).includes(char as any);
}

/**
 * Encuentra el primer carácter disponible que no esté en uso
 * @param charactersInUse - String con los caracteres actualmente en uso
 * @returns El primer carácter disponible del pool
 * @throws Error si no hay caracteres disponibles (límite excedido)
 */
export function findAvailableCharacter(charactersInUse: string): string {
  for (const char of AVAILABLE_CHARACTERS) {
    if (!charactersInUse.includes(char)) {
      return char;
    }
  }

  throw new Error(
    `Se ha alcanzado el límite máximo de ${MAX_EVENT_TYPES} tipos de eventos por calendario`
  );
}

/**
 * Obtiene el nombre descriptivo de un carácter estándar
 * @param char - El carácter a describir
 * @returns Descripción del carácter o el carácter mismo si es personalizado
 */
export function getCharacterDescription(char: string): string {
  switch (char) {
    case EVENT_CHARACTERS.NORMAL:
      return 'Normal (Semanal)';
    case EVENT_CHARACTERS.PAR:
      return 'Par (Quincenal - Semanas Pares)';
    case EVENT_CHARACTERS.IMPAR:
      return 'Impar (Quincenal - Semanas Impares)';
    default:
      return `Personalizado (${char})`;
  }
}