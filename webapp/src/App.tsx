// src/App.tsx
import HomePage from "@/pages/HomePage";
import Start from "@/pages/Start";
import CoursePage from "@/pages/CoursePage";
import ClassroomPage from "@/pages/ClassroomPage";
import SubjectPage from "@/pages/SubjectPage";
import SettingsPage from "@/pages/SettingsPage";
import LogsPage from "@/pages/LogsPage";
import UserPage from "@/pages/UserPage";
import ReportPage from "@/pages/ReportPage";
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
                    <Route path="home" element={<HomePage />} />
                    <Route path="courses" element={<CoursePage />} />
                    <Route path="classrooms" element={<ClassroomPage />} />
                    <Route path="subjects" element={<SubjectPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="logs" element={<LogsPage />} />
                    <Route path="users" element={<UserPage />} />
                    <Route path="reports" element={<ReportPage />} />
                </Route>

                {/* Opcional: Ruta “catch-all” */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>

    );
}
