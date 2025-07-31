import { useEffect } from "react"
import { useBreadcrumb } from "@/context/BreadcrumbContext"

const UserPage = () => {

    const { setItems } = useBreadcrumb()

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
