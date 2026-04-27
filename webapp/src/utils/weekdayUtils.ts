import type { TFunction } from 'i18next';

const WEEKDAY_I18N_KEYS: Record<string, string> = {
    'L': 'solicitud.create.monday',
    'M': 'solicitud.create.tuesday',
    'X': 'solicitud.create.wednesday',
    'J': 'solicitud.create.thursday',
    'V': 'solicitud.create.friday',
    'S': 'solicitud.create.saturday',
    'D': 'solicitud.create.sunday',
};

export function getWeekDayName(code: string, t: TFunction): string {
    const key = WEEKDAY_I18N_KEYS[code];
    return key ? t(key) : code;
}
