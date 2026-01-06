import { useQuery } from "@tanstack/react-query"
import VITE_GATEWAY_API_URL from '@/config/api';

export interface DegreeWithActiveCalendar {
    id: string;
    name: string;
    acronym: string;
    calendarId: string;
    calendarStart: string;
    calendarEnd: string;
    semester: number;
    courseStartYear: number;
    courseEndYear: number;
}

export function useDegreesWithActiveCalendars() {
    return useQuery<DegreeWithActiveCalendar[], Error>({
        queryKey: ["degrees", "with-active-calendars"],
        queryFn: async () => {
            const res = await fetch(`${VITE_GATEWAY_API_URL}/degrees/with-active-calendars`)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.degrees
        },
    })
}
