import HomePage from "@/pages/HomePage";
import Start from "@/pages/Start";
import ClassroomPage from "@/pages/ClassroomPage";
import SubjectPage from "@/pages/SubjectPage";
import SettingsPage from "@/pages/SettingsPage";
import LogsPage from "@/pages/LogsPage";
import UserPage from "@/pages/UserPage";
import ReportPage from "@/pages/ReportPage";
import GroupPage from "@/pages/GroupPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DegreePage from "@/pages/DegreePage";
import AppLayout from "@/components/AppLayout";
import CoursePage from "@/pages/CoursePage";
import CalendarPage from "@/pages/CalendarPage";
import { AuthProvider } from "@/contexts/AuthContext";

import { Route, Routes, Navigate } from "react-router-dom";


export default function App() {
    return (
        <AuthProvider>
            <div className="[--header-height:calc(theme(spacing.14))]">

                <Routes>
                    {/* Página inicial sin sidebar */}
                    <Route path="/" element={<Start />} />
                    <Route path="login" element={<LoginPage />} />
                    <Route path="register" element={<RegisterPage />} />

                    {/* Layout con header + sidebar */}
                    <Route element={<AppLayout />}>
                        <Route path="home" element={<HomePage />} />
                        <Route path="degrees" element={<DegreePage />} />
                        <Route path="degrees/:acronym/courses" element={<CoursePage />} />
                        <Route path="degrees/:acronym/courses/:startYear/:endYear/semester/:semester/groups" element={<GroupPage />} />
                        <Route path="degrees/:acronym/courses/:startYear/:endYear/semester/:semester/groups/calendar" element={<CalendarPage />} />
                        <Route path="degrees/:acronym/subjects" element={<SubjectPage />} />
                        <Route path="classrooms" element={<ClassroomPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="logs" element={<LogsPage />} />
                        <Route path="users" element={<UserPage />} />
                        <Route path="reports" element={<ReportPage />} />
                    </Route>

                    {/* Opcional: Ruta “catch-all” */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </AuthProvider>

    );
}
