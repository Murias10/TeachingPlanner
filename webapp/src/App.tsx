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
import SolicitudPage from "@/pages/SolicitudPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
                    <Route path="forgot-password" element={<ForgotPasswordPage />} />

                    {/* Layout con header + sidebar */}
                    <Route element={<AppLayout />}>
                        {/* Rutas públicas - No requieren autenticación */}
                        <Route path="home" element={<HomePage />} />
                        <Route path="degrees" element={<DegreePage />} />
                        <Route path="degrees/:acronym/courses" element={<CoursePage />} />
                        <Route path="degrees/:acronym/courses/:startYear/:endYear/semester/:semester/groups" element={<GroupPage />} />
                        <Route path="degrees/:acronym/courses/:startYear/:endYear/semester/:semester/calendar" element={<CalendarPage />} />
                        <Route path="degrees/:acronym/courses/:startYear/:endYear/semester/:semester/calendar/solicitudes" element={<SolicitudPage />} />
                        <Route path="degrees/:acronym/subjects" element={<SubjectPage />} />
                        <Route path="classrooms" element={<ClassroomPage />} />


                        {/* Rutas protegidas - Requieren autenticación */}

                        <Route path="settings" element={
                            <ProtectedRoute>
                                <SettingsPage />
                            </ProtectedRoute>
                        } />

                        <Route
                            path="reports"
                            element={
                                <ProtectedRoute>
                                    <ReportPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="users"
                            element={
                                <ProtectedRoute>
                                    <UserPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="logs"
                            element={
                                <ProtectedRoute>
                                    <LogsPage />
                                </ProtectedRoute>
                            }
                        />
                    </Route>

                    {/* Ruta "catch-all" */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </AuthProvider>
    );
}