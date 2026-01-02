import { useMemo } from "react";

/**
 * Pool de caracteres disponibles para eventos personalizados
 * (debe coincidir con el backend)
 */
const LATIN_CHARS = 'ABCDEFGHJKLMOQRSTUVWXYZ';
const GREEK_CHARS = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
const CYRILLIC_CHARS = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const NUMBERS = '0123456789';

export const AVAILABLE_CHARACTERS = LATIN_CHARS + GREEK_CHARS + CYRILLIC_CHARS + NUMBERS;
export const MAX_EVENT_TYPES = AVAILABLE_CHARACTERS.length;

/**
 * Encuentra el primer carácter disponible que no esté en uso
 * @param charactersInUse - String con los caracteres actualmente en uso
 * @returns El primer carácter disponible del pool o null si no hay disponibles
 */
export function findAvailableCharacter(charactersInUse: string): string | null {
    for (const char of AVAILABLE_CHARACTERS) {
        if (!charactersInUse.includes(char)) {
            return char;
        }
    }
    return null;
}

/**
 * Hook para obtener el primer carácter disponible de un calendario
 * @param charactersInUse - String con los caracteres en uso del calendario
 * @returns El primer carácter disponible o null si se alcanzó el límite
 */
export function useAvailableCharacter(charactersInUse: string | undefined): {
    availableCharacter: string | null;
    hasAvailableCharacters: boolean;
    totalUsed: number;
    totalAvailable: number;
} {
    const result = useMemo(() => {
        const inUse = charactersInUse || '';
        const available = findAvailableCharacter(inUse);

        return {
            availableCharacter: available,
            hasAvailableCharacters: available !== null,
            totalUsed: inUse.length,
            totalAvailable: MAX_EVENT_TYPES
        };
    }, [charactersInUse]);

    return result;
}
