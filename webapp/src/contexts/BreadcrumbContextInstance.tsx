import { createContext } from "react";
import { BreadcrumbContextType } from "@/contexts/BreadcrumbContext";


export const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);
