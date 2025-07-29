// src/App.tsx
import Home from "@/pages/Home";
import About from "@/pages/About";
import Start from "@/pages/Start";
import CalendarPage from "@/pages/CalendarPage";
import ClassroomPage from "@/pages/ClassroomPage";
import SubjectPage from "@/pages/SubjectPage";
import AppLayout from "@/components/AppLayout";

import { Route, Routes, Navigate } from "react-router-dom";

export default function App() {
    return (

        <div className="[--header-height:calc(theme(spacing.14))]">
            <Routes>
                {/* Página inicial sin sidebar */}
                <Route path="/" element={<Start />} />

                {/* Layout con header + sidebar */}
                <Route element={<AppLayout />}>
                    <Route path="home" element={<Home />} />
                    <Route path="about" element={<About />} />
                    <Route path="calendars" element={<CalendarPage />} />
                    {/* <Route path="calendars/:calendarId" element={<CalendarPage />} /> */}
                    <Route path="classrooms" element={<ClassroomPage />} />
                    < Route path="subjects" element={<SubjectPage />} />
                </Route>

                {/* Opcional: Ruta “catch-all” */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>

    );
}
