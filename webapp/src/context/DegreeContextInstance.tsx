import { createContext } from "react"
import { DegreeContextType } from "@/types/DegreeContextType"

export const DegreeContext = createContext<DegreeContextType>({} as DegreeContextType)