import { useContext } from "react";
import { BreadcrumbContext } from "@/contexts/BreadcrumbContextInstance";


export const useBreadcrumbContext = () => {
    const context = useContext(BreadcrumbContext);
    if (!context) {
        throw new Error("useBreadcrumb must be used within a BreadcrumbProvider");
    }
    return context;
};
