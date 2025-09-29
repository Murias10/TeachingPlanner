import { useEffect } from "react"
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";

const SettingsPage = () => {

    const { setItems } = useBreadcrumbContext()

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
