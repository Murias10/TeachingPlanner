import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useQuery } from "@tanstack/react-query";
import Home from "@/pages/Home";
import About from "@/pages/About";
import { Route, Routes } from "react-router-dom";

const fetchData = async () => {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts/1");
    return res.json();
};

export const MyComponent = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ["post"],
        queryFn: fetchData,
    });

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <div>
            <h1>{data.title}</h1>
            <p>{data.body}</p>
        </div>
    );
};


export default function App() {
    return (
        <div className="[--header-height:calc(theme(spacing.14))]">
            <SidebarProvider className="flex flex-col">
                <SiteHeader />
                <div className="flex flex-1">
                    <AppSidebar />
                    <SidebarInset>
                        <div className="flex-1 h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/about" element={<About />} />
                            </Routes>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    )
}
