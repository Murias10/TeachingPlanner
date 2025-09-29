import { createContext } from "react";
import { AppContextType } from "@/context/AppContext";


export const AppContext = createContext<AppContextType | undefined>(undefined);
