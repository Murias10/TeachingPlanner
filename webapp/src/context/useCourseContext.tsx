import { useContext } from "react";
import { CourseContext } from "@/context/CourseContextInstance";


export function useCourseContext() {
    const ctx = useContext(CourseContext);
    if (!ctx) {
        throw new Error("useCourseContext must be used within CourseProvider");
    }
    return ctx;
}
