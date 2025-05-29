import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useQuery } from "@tanstack/react-query";

const fetchData = async () => {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts/1");
    return res.json();
};

const MyComponent = () => {
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


export default function Page() {
    return (
        <div className="[--header-height:calc(theme(spacing.14))]">
            <SidebarProvider className="flex flex-col">
                <SiteHeader />
                <div className="flex flex-1">
                    <AppSidebar />
                    <SidebarInset>
                        <div className="flex flex-1 flex-col gap-4 p-4">
                            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                                <div className="aspect-video rounded-xl bg-muted/50" />
                                <div className="aspect-video rounded-xl bg-muted/50" />
                                <div className="aspect-video rounded-xl bg-muted/50" >
                                    <MyComponent />
                                </div>
                            </div>
                            <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    )
}
