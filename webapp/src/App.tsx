// src/App.tsx
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Start from "@/pages/Start";
import { Route, Routes, Outlet, Navigate } from "react-router-dom";


function AppLayout() {
    return (
        <SidebarProvider className="flex flex-col">
            <SiteHeader />
            <div className="flex flex-1">
                <AppSidebar />
                <SidebarInset>
                    <div className="flex-1 h-full rounded-xl bg-muted/50 flex items-center justify-center m-2">
                        {/* Aquí renderizamos Home o About */}
                        <Outlet />
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}

export default function App() {
    return (
        <div
            className="[--header-height:calc(theme(spacing.14))]"
        >
            <Routes>
                {/* Página inicial sin sidebar */}
                <Route path="/" element={<Start />} />

                {/* Layout con header + sidebar */}
                <Route element={<AppLayout />}>
                    <Route path="home" element={<Home />} />
                    <Route path="about" element={<About />} />
                </Route>

                {/* Opcional: Ruta “catch-all” */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}
