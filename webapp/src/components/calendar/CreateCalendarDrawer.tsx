// components/calendar/CreateCalendarDrawer.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
    CheckCircle,
    ChevronDownIcon
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
    const [holidayDates, setHolidayDates] = useState<Date[]>([]);
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
            setHolidayDates([]);
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
                    endDate,
                    holidayDates: holidayDates.length > 0 ? holidayDates : undefined
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
                        <TabsContent value="manual" className="space-y-4 mt-6 flex flex-col h-full">
                            <div className="w-full space-y-4 flex flex-col h-full">
                                {/* Date Pickers en la misma fila */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Date Picker para fecha de inicio */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">
                                            {t("drawer.calendar.create.tabs.manual.start.date")}
                                        </Label>
                                        <Popover modal={true}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start text-left font-normal text-xs h-9"
                                                    disabled={isLoading}
                                                >
                                                    {startDate ? format(startDate, "dd/MM/yyyy") : t("drawer.calendar.create.tabs.manual.select.date")}
                                                    <ChevronDownIcon className="ml-auto h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={startDate}
                                                    onSelect={(date) => {
                                                        if (date && isDateInCourseRange(date)) {
                                                            setStartDate(date);
                                                        }
                                                    }}
                                                    disabled={(date) => !isDateInCourseRange(date)}
                                                />
                                            </PopoverContent>
                                    </Popover>
                                    </div>

                                    {/* Date Picker para fecha de fin */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">
                                            {t("drawer.calendar.create.tabs.manual.end.date")}
                                        </Label>
                                        <Popover modal={true}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start text-left font-normal text-xs h-9"
                                                    disabled={!startDate || isLoading}
                                                >
                                                    {endDate ? format(endDate, "dd/MM/yyyy") : t("drawer.calendar.create.tabs.manual.select.date")}
                                                    <ChevronDownIcon className="ml-auto h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={endDate}
                                                    onSelect={(date) => {
                                                        if (date && isDateInCourseRange(date) && (!startDate || date > startDate)) {
                                                            setEndDate(date);
                                                        }
                                                    }}
                                                    disabled={(date) => !isDateInCourseRange(date) || (startDate ? date <= startDate : false)}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                {/* Calendar para seleccionar días festivos */}
                                <div className="space-y-2 flex flex-col min-h-0 flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-semibold">
                                            {t("drawer.calendar.create.tabs.manual.holidays")}
                                        </h4>
                                        {holidayDates.length > 0 && (
                                            <Badge variant="outline" className="text-xs">
                                                {holidayDates.length}
                                            </Badge>
                                        )}
                                    </div>
                                    {startDate && endDate ? (
                                        <>
                                            <div className="border rounded-lg bg-muted/30 flex justify-center overflow-y-auto flex-1 min-h-0">
                                                <CalendarComponent
                                                    mode="multiple"
                                                    selected={holidayDates}
                                                    onSelect={(dates) => {
                                                        setHolidayDates(Array.isArray(dates) ? dates : []);
                                                    }}
                                                    disabled={(date) => {
                                                        if (!startDate || !endDate) return true;
                                                        return date < startDate || date > endDate;
                                                    }}
                                                />
                                            </div>
                                            {holidayDates.length > 0 && (
                                                <div className="space-y-1.5 overflow-y-auto">
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        {t("drawer.calendar.create.tabs.manual.selected.holidays")}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {holidayDates.map((date) => (
                                                            <Badge key={date.toString()} variant="secondary" className="text-xs">
                                                                {format(date, "dd/MM/yyyy")}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center flex-1 text-center">
                                            <p className="text-xs text-muted-foreground">
                                                {t("drawer.calendar.create.tabs.manual.select.dates.first")}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {dateError && (
                                    <div className="rounded-md bg-destructive/10 p-2.5 border border-destructive/30">
                                        <p className="text-xs text-destructive">{dateError}</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Tab Import */}
                        <TabsContent value="import" className="space-y-4 mt-6 flex flex-col h-full">
                            <div className="w-full space-y-4 flex flex-col h-full">
                                {/* Área de drop/upload */}
                                <div
                                    className={`relative border-2 border-dashed rounded-lg p-3 py-4 text-center transition-all ${isDragOver
                                        ? 'border-primary bg-primary/5'
                                        : 'border-muted-foreground/30 hover:border-primary/50'
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

                                    <div className="space-y-1">
                                        <div className="mx-auto w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Upload className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold">
                                                {t("drawer.calendar.create.tabs.import.drop.title")}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {t("drawer.calendar.create.tabs.import.drop.description")}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Lista única de archivos */}
                                <div className="space-y-2 flex flex-col min-h-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-semibold">
                                            {t("drawer.calendar.create.tabs.import.required.files")}
                                        </h4>
                                        <Badge variant="outline" className="text-xs">
                                            {uploadedFiles.length}/{REQUIRED_FILES.length}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1 overflow-y-auto pr-1 flex-1">
                                        {REQUIRED_FILES.map((file) => {
                                            const uploaded = getFileStatus(file.name);
                                            return (
                                                <div
                                                    key={file.name}
                                                    className={`flex items-center gap-2 p-2 rounded-md border text-xs transition-colors ${
                                                        uploaded
                                                            ? 'bg-green-50 border-green-200'
                                                            : 'bg-muted/30 border-muted-foreground/20'
                                                    }`}
                                                >
                                                    {uploaded ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                                    ) : (
                                                        <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-medium leading-tight ${uploaded ? 'text-green-900' : 'text-foreground'}`}>
                                                            {file.name}
                                                        </p>
                                                        <p className={`text-xs leading-tight ${uploaded ? 'text-green-700' : 'text-muted-foreground'}`}>
                                                            {file.description}
                                                        </p>
                                                    </div>
                                                    {uploaded && (
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-xs font-medium text-green-600">
                                                                {(uploaded.size / 1024).toFixed(1)}KB
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => removeFile(file.name)}
                                                                disabled={isLoading}
                                                                className="h-6 w-6 p-0 hover:bg-green-100"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
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
                        {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                        {t("drawer.calendar.create.save")}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
};