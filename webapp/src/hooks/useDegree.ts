import { useContext } from "react";
import { DegreeContext } from "@/context/DegreeContextInstance";

export function useDegree() {
    const context = useContext(DegreeContext);
    if (!context) throw new Error('useDegree must be used within DegreeProvider');
    return context;
}
