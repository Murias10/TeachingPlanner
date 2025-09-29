import { createContext } from "react";
import { FloatingAlertContextType } from "@/contexts/FloatingAlertContext";


export const FloatingAlertContext = createContext<FloatingAlertContextType | undefined>(undefined);
