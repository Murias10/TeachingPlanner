import { useFloatingAlert } from "@/hooks/useFloatingAlert"
import { FloatingAlertContainer } from "@/components/FloatingAlertContainer"
import { FloatingAlertContext } from "@/contexts/FloatingAlertContextInstance"
import { useEffect } from "react"

interface TriggerAlertArgs {
    title: string
    description: string
    variant: "default" | "destructive" | "success" | "warning"
}

export interface FloatingAlertContextType {
    triggerAlert: (args: TriggerAlertArgs) => void
}

export function FloatingAlertProvider({ children }: { children: React.ReactNode }) {
    const { alerts, triggerAlert, cleanup } = useFloatingAlert()

    // Cleanup al desmontar el provider
    useEffect(() => {
        return () => cleanup()
    }, [cleanup])

    return (
        <FloatingAlertContext.Provider value={{ triggerAlert }}>
            {children}
            <FloatingAlertContainer alerts={alerts} />
        </FloatingAlertContext.Provider>
    )
}