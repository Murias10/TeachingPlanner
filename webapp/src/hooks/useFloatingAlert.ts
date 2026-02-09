import { useState, useCallback, useRef } from "react"

export type AlertVariant = "default" | "destructive" | "success" | "warning"

export interface AlertItem {
    id: string
    title: string
    description: string
    variant: AlertVariant
    show: boolean
}

interface TriggerAlertArgs {
    title: string
    description: string
    variant: AlertVariant
}

export const useFloatingAlert = () => {
    const [alerts, setAlerts] = useState<AlertItem[]>([])
    const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

    const removeAlert = useCallback((id: string) => {
        // Limpiar el timeout si existe
        const timeout = timeoutRefs.current.get(id)
        if (timeout) {
            clearTimeout(timeout)
            timeoutRefs.current.delete(id)
        }

        // Remover la alerta del estado
        setAlerts(prev => prev.filter(alert => alert.id !== id))
    }, [])

    const hideAlert = useCallback((id: string) => {
        // Limpiar el timeout automático si existe
        const timeout = timeoutRefs.current.get(id)
        if (timeout) {
            clearTimeout(timeout)
            timeoutRefs.current.delete(id)
        }

        // Cambiar show a false para activar la animación de salida
        setAlerts(prev =>
            prev.map(alert =>
                alert.id === id ? { ...alert, show: false } : alert
            )
        )

        // Remover completamente después de la animación (1 segundo)
        setTimeout(() => removeAlert(id), 1000)
    }, [removeAlert])

    const triggerAlert = useCallback(({ title, description, variant }: TriggerAlertArgs) => {
        const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Agregar nueva alerta (inicialmente oculta)
        setAlerts(prev => [...prev, {
            id,
            title,
            description,
            variant,
            show: false
        }])

        // Mostrar la alerta inmediatamente (para activar animación de entrada)
        setTimeout(() => {
            setAlerts(prev =>
                prev.map(alert =>
                    alert.id === id ? { ...alert, show: true } : alert
                )
            )
        }, 50)

        // Programar ocultamiento después de 5 segundos
        const hideTimeout = setTimeout(() => {
            hideAlert(id)
        }, 5000)

        timeoutRefs.current.set(id, hideTimeout)
    }, [hideAlert])

    // Cleanup al desmontar
    const cleanup = useCallback(() => {
        timeoutRefs.current.forEach(timeout => clearTimeout(timeout))
        timeoutRefs.current.clear()
    }, [])

    return {
        alerts,
        triggerAlert,
        hideAlert,
        removeAlert,
        cleanup
    }
}