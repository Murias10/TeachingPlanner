// components/calendar/CreateCalendarDrawer.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerClose,
    DrawerDescription
} from "@/components/ui/drawer";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Calendar,
    Upload,
    FileText,
    X,
    CheckCircle
} from "lucide-react";
import { CalendarFormData, CalendarDrawerData } from "@/types/Calendar";

interface CreateCalendarDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (formData: CalendarFormData) => Promise<void>;
    calendarData: CalendarDrawerData | null;
}

const REQUIRED_FILES = [
    { name: "asignaturas.txt", description: "Información general sobre las asignaturas" },
    { name: "calendario.txt", description: "Calendario académico con fechas lectivas y festivos" },
    { name: "horarios.txt", description: "Eventos de clase que se repiten" },
    { name: "excepciones.txt", description: "Eventos de clase puntuales" },
    { name: "ubicaciones.txt", description: "Información sobre aulas y laboratorios" }
];

export const CreateCalendarDrawer = ({
    open,
    onOpenChange,
    onSave,
    calendarData
}: CreateCalendarDrawerProps) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("manual");

    // Manual tab states
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [dateError, setDateError] = useState("");

    // Import tab states
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);

    // Extraer valores de calendarData
    const courseId = calendarData?.courseId;
    const semester = calendarData?.semester;
    const courseYear = calendarData?.courseYear;
    const courseStartYear = courseYear ? Number(courseYear.split('-')[0]) : undefined;
    const courseEndYear = courseYear ? Number(courseYear.split('-')[1]) : undefined;

    // Calculate date limits
    const isDateInCourseRange = (date: Date) => {
        if (!courseStartYear || !courseEndYear) return true;

        const courseStart = new Date(courseStartYear, 8, 1); // 1 septiembre
        const courseEnd = new Date(courseEndYear, 5, 30);    // 30 junio

        return date >= courseStart && date <= courseEnd;
    };

    // Reset form when drawer closes
    useEffect(() => {
        if (!open) {
            setIsLoading(false);
            setStartDate(undefined);
            setEndDate(undefined);
            setDateError("");
            setUploadedFiles([]);
            setActiveTab("manual");
        }
    }, [open]);

    // Validate dates
    useEffect(() => {
        if (startDate && endDate) {
            if (startDate >= endDate) {
                setDateError("La fecha de inicio debe ser anterior a la fecha de fin");
            } else {
                setDateError("");
            }
        } else {
            setDateError("");
        }
    }, [startDate, endDate]);

    const handleSave = async () => {
        if (!courseId || !semester) return;

        if (activeTab === "manual" && (!startDate || !endDate || dateError)) {
            return;
        }

        if (activeTab === "import" && uploadedFiles.length === 0) {
            return;
        }

        setIsLoading(true);

        try {
            if (activeTab === "import") {
                // Crear FormData para archivos
                const formData = new FormData();
                formData.append('courseId', courseId);
                formData.append('degreeId', calendarData!.degreeId);
                formData.append('semester', semester.toString());

                // Agregar archivos
                uploadedFiles.forEach((file) => {
                    formData.append('files', file);
                });

                // Crear el objeto con el tipo correcto
                const importData: CalendarFormData = {
                    courseId,
                    semester,
                    files: uploadedFiles,
                    formData
                };

                await onSave(importData);
            } else {
                // Modo manual
                const manualData: CalendarFormData = {
                    courseId,
                    semester,
                    startDate,
                    endDate
                };

                await onSave(manualData);
            }
        } catch (error) {
            console.error('Error saving calendar:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onOpenChange(false);
        }
    };

    // File upload handlers
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files).filter(
            file => file.name.endsWith('.txt')
        );

        if (files.length > 0) {
            setUploadedFiles(prev => {
                const newFiles = [...prev];
                files.forEach(file => {
                    if (!newFiles.find(f => f.name === file.name)) {
                        newFiles.push(file);
                    }
                });
                return newFiles;
            });
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).filter(
                file => file.name.endsWith('.txt')
            );

            setUploadedFiles(prev => {
                const newFiles = [...prev];
                files.forEach(file => {
                    if (!newFiles.find(f => f.name === file.name)) {
                        newFiles.push(file);
                    }
                });
                return newFiles;
            });
        }
    };

    const removeFile = (fileName: string) => {
        setUploadedFiles(prev => prev.filter(file => file.name !== fileName));
    };

    const getFileStatus = (fileName: string) => {
        return uploadedFiles.find(file => file.name === fileName);
    };

    const isManualFormValid = startDate && endDate && !dateError;
    const isImportFormValid = uploadedFiles.length === 5;
    const isFormValid = activeTab === "manual" ? isManualFormValid : isImportFormValid;

    if (!calendarData) return null;

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="flex flex-col h-[85vh]">
                <DrawerHeader>
                    <DrawerTitle>
                        {t("drawer.calendar.create.title")}
                    </DrawerTitle>
                    <DrawerDescription>
                        {t("drawer.calendar.create.description", {
                            year: courseYear,
                            semester: semester
                        })}
                    </DrawerDescription>
                </DrawerHeader>

                {/* Contenido con tabs */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex justify-center mb-6">
                            <TabsList>
                                <TabsTrigger value="manual" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {t("drawer.calendar.create.tabs.manual.title")}
                                </TabsTrigger>
                                <TabsTrigger value="import" className="flex items-center gap-2">
                                    <Upload className="h-4 w-4" />
                                    {t("drawer.calendar.create.tabs.import.title")}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Tab Manual */}
                        <TabsContent value="manual" className="space-y-6 mt-6">
                            <div className="space-y-4 max-w-sm mx-auto">
                                {/* Input para fecha de inicio */}
                                <div className="space-y-2">
                                    <Label>
                                        {t("drawer.calendar.create.tabs.manual.start.date")}
                                    </Label>
                                    <Input
                                        type="date"
                                        value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                                        onChange={(e) => {
                                            const date = e.target.value ? new Date(e.target.value) : undefined;
                                            if (date && isDateInCourseRange(date)) {
                                                setStartDate(date);
                                            }
                                        }}
                                        min={courseStartYear ? `${courseStartYear}-09-01` : undefined}
                                        max={courseEndYear ? `${courseEndYear}-06-30` : undefined}
                                        className="w-full"
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Input para fecha de fin */}
                                <div className="space-y-2">
                                    <Label>
                                        {t("drawer.calendar.create.tabs.manual.end.date")}
                                    </Label>
                                    <Input
                                        type="date"
                                        value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                                        onChange={(e) => {
                                            const date = e.target.value ? new Date(e.target.value) : undefined;
                                            if (date && isDateInCourseRange(date) && (!startDate || date > startDate)) {
                                                setEndDate(date);
                                            }
                                        }}
                                        min={startDate ? format(new Date(startDate.getTime() + 86400000), "yyyy-MM-dd") : (courseStartYear ? `${courseStartYear}-09-01` : undefined)}
                                        max={courseEndYear ? `${courseEndYear}-06-30` : undefined}
                                        className="w-full"
                                        disabled={isLoading}
                                    />
                                </div>

                            </div>
                        </TabsContent>

                        {/* Tab Import */}
                        <TabsContent value="import" className="space-y-4 mt-6">
                            {/* Lista de archivos requeridos */}
                            <div className="space-y-2 max-w-sm mx-auto">
                                <h4 className="text-sm font-medium">
                                    {t("drawer.calendar.create.tabs.import.required.files")}:
                                </h4>
                                <div className="grid gap-1.5">
                                    {REQUIRED_FILES.map((file) => {
                                        const uploaded = getFileStatus(file.name);
                                        return (
                                            <div key={file.name} className="flex items-center gap-2 p-2 rounded border text-sm">
                                                {uploaded ? (
                                                    <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                                ) : (
                                                    <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium">{file.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {file.description}
                                                    </p>
                                                </div>
                                                {uploaded && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {(uploaded.size / 1024).toFixed(1)} KB
                                                    </Badge>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Área de drop/upload */}
                            <div className="max-w-sm mx-auto">
                                <div
                                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragOver
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    onDrop={handleDrop}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragOver(true);
                                    }}
                                    onDragLeave={() => setIsDragOver(false)}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        accept=".txt"
                                        onChange={handleFileInput}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={isLoading}
                                    />

                                    <div className="space-y-2">
                                        <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                            <Upload className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {t("drawer.calendar.create.tabs.import.drop.title")}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {t("drawer.calendar.create.tabs.import.drop.description")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lista de archivos subidos */}
                            {uploadedFiles.length > 0 && (
                                <div className="space-y-2 max-w-sm mx-auto">
                                    <h4 className="text-sm font-medium">
                                        {t("drawer.calendar.create.tabs.import.uploaded.files")} ({uploadedFiles.length})
                                    </h4>
                                    <div className="space-y-1.5">
                                        {uploadedFiles.map((file) => {
                                            const isProcessable = file.name === 'ubicaciones.txt';
                                            return (
                                                <div key={file.name} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${isProcessable ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                                                    }`}>
                                                    <FileText className={`h-3.5 w-3.5 flex-shrink-0 ${isProcessable ? 'text-green-600' : 'text-gray-600'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-xs font-medium truncate ${isProcessable ? 'text-green-900' : ''}`}>
                                                                {file.name}
                                                            </p>
                                                        </div>
                                                        <p className={`text-xs ${isProcessable ? 'text-green-700' : 'text-muted-foreground'}`}>
                                                            {(file.size / 1024).toFixed(1)} KB
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFile(file.name)}
                                                        disabled={isLoading}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </TabsContent>
                    </Tabs>
                </div>

                {/* Botones */}
                <div className="p-4 flex justify-end space-x-2 border-t">
                    <DrawerClose asChild>
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            {t("drawer.calendar.create.cancel")}
                        </Button>
                    </DrawerClose>
                    <Button
                        disabled={!isFormValid || isLoading}
                        onClick={handleSave}
                    >
                        {t("drawer.calendar.create.save")}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
};