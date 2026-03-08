/**
 * Event character constants
 * IMPORTANT: These must match the backend EVENT_CHARACTERS in planner_service/src/constants/event-characters.constants.ts
 */

export const EVENT_CHARACTERS = {
  NORMAL: 'N',
  PAR: 'P',
  IMPAR: 'I',
  FESTIVO: 'F', // Días no lectivos (festivos, fines de semana)
} as const;

/**
 * Array of standard event characters (not custom)
 * Used to determine if an event is a custom periodic event
 */
export const STANDARD_EVENT_CHARACTERS = ['N', 'P', 'I', 'F'] as const;

/**
 * Check if a character is a custom event character (not standard)
 */
export const isCustomEventCharacter = (char: string | undefined): boolean => {
  if (!char) return false;
  return !STANDARD_EVENT_CHARACTERS.includes(char as any);
};

// ---------------------------------------------------------------------------
// Event types (must match backend EVENT_TYPES in event-characters.constants.ts)
// ---------------------------------------------------------------------------

export const EVENT_TYPES = {
  NORMAL: 'NORMAL',
  BLOCKER: 'BLOCKER',
  REVISION: 'REVISION',
  EVALUACION: 'EVALUACION',
  OTRO: 'OTRO',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

/** Tipos que NO cuentan para horas planificadas y NO se exportan a TXT */
export const isSpecialEventType = (type: string): boolean => type !== EVENT_TYPES.NORMAL;

/** Tipos que permiten multiselect de grupos y aulas */
export const isReviewOrEvalEventType = (type: string): boolean =>
  type === EVENT_TYPES.REVISION || type === EVENT_TYPES.EVALUACION || type === EVENT_TYPES.OTRO;

/** Labels de cada eventType para mostrar en la UI */
export const EVENT_TYPE_LABELS: Record<string, string> = {
  [EVENT_TYPES.NORMAL]:      'Clase',
  [EVENT_TYPES.BLOCKER]:     'Independiente',
  [EVENT_TYPES.REVISION]:    'Revisión',
  [EVENT_TYPES.EVALUACION]:  'Evaluación',
  [EVENT_TYPES.OTRO]:        'Otros',
};
