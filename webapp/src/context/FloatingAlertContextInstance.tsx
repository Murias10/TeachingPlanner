import { createContext } from "react";
import { FloatingAlertContextType } from "@/context/FloatingAlertContext";


export const FloatingAlertContext = createContext<FloatingAlertContextType | undefined>(undefined);
