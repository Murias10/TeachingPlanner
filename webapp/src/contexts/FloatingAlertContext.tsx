import { useFloatingAlert } from "@/hooks/useFloatingAlert"
import { FloatingAlertContainer } from "@/components/FloatingAlertContainer"
import { FloatingAlertContext } from "@/contexts/FloatingAlertContextInstance"
import { useEffect, useMemo } from "react"

interface TriggerAlertArgs {
    title: string
    description: string
    variant: "default" | "destructive" | "success" | "warning"
}

export interface FloatingAlertContextType {
    triggerAlert: (args: TriggerAlertArgs) => void
}

export function FloatingAlertProvider({ children }: { children: React.ReactNode }) {
    const { alerts, triggerAlert, hideAlert, cleanup } = useFloatingAlert()

    // Cleanup al desmontar el provider
    useEffect(() => {
        return () => cleanup()
    }, [cleanup])

    const contextValue = useMemo(() => ({ triggerAlert }), [triggerAlert])

    return (
        <FloatingAlertContext.Provider value={contextValue}>
            {children}
            <FloatingAlertContainer alerts={alerts} onCloseAlert={hideAlert} />
        </FloatingAlertContext.Provider>
    )
}