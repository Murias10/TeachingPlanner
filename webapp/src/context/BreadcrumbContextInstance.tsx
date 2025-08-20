import { createContext } from "react";
import { BreadcrumbContextType } from "@/context/BreadcrumbContext";


export const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);
