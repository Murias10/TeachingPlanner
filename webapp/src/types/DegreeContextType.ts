import { Degree } from "@/types/Degree";

export interface DegreeContextType {
    degrees: Degree[];
    loading: boolean;
    error: string | null;
    selectedDegree: string;
    setSelectedDegree: (newDegreeId: string) => void;
}
