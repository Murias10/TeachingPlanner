/**
 * Constantes para tipos de grupos y sus traducciones
 */

export const GROUP_TYPE_LABELS = {
  'L': 'Laboratorio',
  'S': 'Seminario',
  'T': 'Teoría',
  'TG': 'Tutoría Grupal'
} as const;

export const LANGUAGE_LABELS = {
  'ES': 'Español',
  'EN': 'Inglés'
} as const;

export const GROUP_TYPE_ORDER = {
  'L': 0,
  'S': 1,
  'T': 2,
  'TG': 3
} as const;
