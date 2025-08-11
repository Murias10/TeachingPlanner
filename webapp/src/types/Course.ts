import { Calendar } from "@/types/Calendar";

export interface Course {
    id: string;
    idDegree: string;
    startYear: number;
    endYear: number;
    state: string;
    email: string;
    calendars: Calendar[];
}
