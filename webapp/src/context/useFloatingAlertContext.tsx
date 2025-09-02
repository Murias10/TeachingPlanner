import { useContext } from "react";
import { FloatingAlertContext } from "@/context/FloatingAlertContextInstance";


export function useFloatingAlertContext() {
    const context = useContext(FloatingAlertContext);
    if (!context) {
        throw new Error("useFloatingAlertContext must be used within a FloatingAlertProvider");
    }
    return context;
}
