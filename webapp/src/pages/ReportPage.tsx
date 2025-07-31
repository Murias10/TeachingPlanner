import { useEffect } from "react"
import { useBreadcrumb } from "@/context/BreadcrumbContext"

const ReportPage = () => {

    const { setItems } = useBreadcrumb()

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Registros de uso", href: "/reports" },
        ])
    }, [setItems])

    return (
        <>
            <h1>REPORTS PAGE</h1>

        </>
    );
};

export default ReportPage;
