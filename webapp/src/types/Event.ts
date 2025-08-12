import { Group } from '@/types/Group';

export interface Event {
    id: string;
    startTime: string;
    endTime: string;
    type: string;
    cancelled: boolean;
    comment?: string;
    eventCharacter?: string;
    groups: Group[];
}