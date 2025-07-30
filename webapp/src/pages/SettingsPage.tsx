import { useEffect } from "react"
import { useBreadcrumb } from "@/context/BreadcrumbContext"

const SettingsPage = () => {

    const { setItems } = useBreadcrumb()

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Ajustes", href: "/settings" },
        ])
    }, [setItems])

    return (
        <>
            <h1>SETTINGS PAGE</h1>

        </>
    );
};

export default SettingsPage;
