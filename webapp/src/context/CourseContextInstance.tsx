import { createContext } from "react";
import { CourseContextType } from "@/context/CourseContext";


export const CourseContext = createContext<CourseContextType | undefined>(undefined);
