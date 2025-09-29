import { createContext } from "react";
import { AppContextType } from "@/contexts/AppContext";


export const AppContext = createContext<AppContextType | undefined>(undefined);
