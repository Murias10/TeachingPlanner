import { EVENT_CHARACTERS } from '@/constants/eventCharacters';

/**
 * Obtiene el nombre descriptivo de un carácter de evento
 * @param char - El carácter a describir
 * @returns Descripción del carácter
 */
export function getCharacterDescription(char: string | undefined): string {
    if (!char) return 'Desconocido';

    switch (char) {
        case EVENT_CHARACTERS.NORMAL:
            return 'Semanal';
        case EVENT_CHARACTERS.PAR:
            return 'Quincenal (Semanas Pares)';
        case EVENT_CHARACTERS.IMPAR:
            return 'Quincenal (Semanas Impares)';
        default:
            return `Personalizado (${char})`;
    }
}

/**
 * Determina el tipo de frecuencia basado en el carácter del evento
 * @param eventCharacter - Carácter del evento
 * @returns Tipo de frecuencia
 */
export function getFrequencyFromCharacter(eventCharacter: string | undefined): 'weekly' | 'biweekly-even' | 'biweekly-odd' | 'custom' {
    if (!eventCharacter) return 'weekly';

    switch (eventCharacter) {
        case EVENT_CHARACTERS.NORMAL:
            return 'weekly';
        case EVENT_CHARACTERS.PAR:
            return 'biweekly-even';
        case EVENT_CHARACTERS.IMPAR:
            return 'biweekly-odd';
        default:
            return 'custom';
    }
}
