import { useEffect } from "react"
import { useBreadcrumbContext } from "@/contexts/useBreadcrumbContext";

const UserPage = () => {

    const { setItems } = useBreadcrumbContext()

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
            { label: "Usuarios", href: "/users" },
        ])
    }, [setItems])

    return (
        <>
            <h1>USERS PAGE</h1>

        </>
    );
};

export default UserPage;
