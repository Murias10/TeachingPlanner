import { createContext } from "react";
import { DegreeContextType } from "@/context/DegreeContext";

export const DegreeContext = createContext<DegreeContextType | undefined>(undefined);
