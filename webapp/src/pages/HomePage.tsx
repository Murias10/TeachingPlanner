
import { useEffect } from "react";
import { useBreadcrumb } from "@/context/BreadcrumbContext";

const HomePage = () => {

    const { setItems } = useBreadcrumb()

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
