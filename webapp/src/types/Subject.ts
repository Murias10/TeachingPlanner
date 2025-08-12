import { Group } from "@/types/Group"
export interface Subject {
    id: string;
    acronym: string;
    semester: number;
    year: number;
    name: string;
    siesCode: string;
    groups: Group[];

}
