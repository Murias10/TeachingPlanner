import { useQuery } from "@tanstack/react-query"
import VITE_GATEWAY_API_URL from '@/config/api';

export interface ActiveCalendar {
    id: string;
    start: string;
    end: string;
    semester: number;
    courseId: string;
    courseStartYear: number;
    courseEndYear: number;
    degreeId: string;
    degreeName: string;
    degreeAcronym: string;
}

export function useActiveCalendars() {
    return useQuery<ActiveCalendar[], Error>({
        queryKey: ["calendars", "active"],
        queryFn: async () => {
            const res = await fetch(`${VITE_GATEWAY_API_URL}/calendars/active`)
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const body = await res.json()
            return body.data.calendars
        },
    })
}
