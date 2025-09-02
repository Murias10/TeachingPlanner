import { useContext } from "react";
import { DegreeContext } from "@/context/DegreeContextInstace";

export function useDegreeContext() {
    const ctx = useContext(DegreeContext);
    if (!ctx) {
        throw new Error("useDegreeContext must be used within DegreeProvider");
    }
    return ctx;
}
