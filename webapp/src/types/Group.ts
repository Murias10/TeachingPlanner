import { Event } from '@/types/Event';
import { Subject } from '@/types/Subject';

export interface Group {
    id: string;
    subject: Subject;
    number: number;
    type: string;
    language: string;
    events: Event[];
    planifiedHours?: number;
}
