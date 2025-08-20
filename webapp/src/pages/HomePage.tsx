
import { useEffect } from "react";
import { useBreadcrumbContext } from "@/context/useBreadcrumbContext";

const HomePage = () => {

    const { setItems } = useBreadcrumbContext()

    useEffect(() => {
        setItems([
            { label: "Inicio", href: "/home" },
        ])
    }, [setItems])

    return (
        <>
            <h2>HOME PAGE</h2>
        </>
    );
};

export default HomePage;
