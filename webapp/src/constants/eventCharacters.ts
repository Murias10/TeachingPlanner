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
