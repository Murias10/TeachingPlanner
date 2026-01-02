// components/calendar/CreateCalendarDrawer.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
    X,
    CheckCircle,
    ChevronDownIcon,
    ChevronLeft,
    ChevronRight
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
    const [currentStep, setCurrentStep] = useState(1);
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [selectedHolidayDates, setSelectedHolidayDates] = useState<Date[]>([]);
    const [holidays, setHolidays] = useState<Array<{ date: Date; comment: string }>>([]);
    const [dateError, setDateError] = useState("");
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);

    // Import tab states
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);

    // Extraer valores de calendarData
    const courseId = calendarData?.courseId;
    const semester = calendarData?.semester;
    const courseYear = calendarData?.courseYear;
    const courseStartYear = courseYear ? Number(courseYear.split('-')[0]) : undefined;
    const courseEndYear = courseYear ? Number(courseYear.split('-')[1]) : undefined;

    // Calculate semester date range
    const getSemesterRange = () => {
        if (!courseStartYear || !courseEndYear || !semester) return null;

        let semesterStart: Date;
        let semesterEnd: Date;

        if (semester === 1) {
            // Semester 1: September to end of December
            semesterStart = new Date(courseStartYear, 8, 1);  // 1 septiembre
            semesterEnd = new Date(courseStartYear, 11, 31); // 31 diciembre
        } else {
            // Semester 2: January to end of June
            semesterStart = new Date(courseEndYear, 0, 1);    // 1 enero
            semesterEnd = new Date(courseEndYear, 5, 30);     // 30 junio
        }

        return { semesterStart, semesterEnd };
    };

    // Calculate date limits based on semester
    const isDateInCourseRange = (date: Date) => {
        const range = getSemesterRange();
        if (!range) return true;

        return date >= range.semesterStart && date <= range.semesterEnd;
    };

    // Get default month to show in datepicker
    const getDefaultMonth = () => {
        const range = getSemesterRange();
        if (!range) return new Date();

        const today = new Date();
        // If today is within semester range, show current month
        if (today >= range.semesterStart && today <= range.semesterEnd) {
            return today;
        }
        // Otherwise, show first month of semester
        return range.semesterStart;
    };

    // Check if date is weekend (Saturday or Sunday)
    const isWeekend = (date: Date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
    };

    // Combined validation: must be in range AND not weekend
    const isDateDisabled = (date: Date) => {
        return !isDateInCourseRange(date) || isWeekend(date);
    };

    // Reset form when drawer closes
    useEffect(() => {
        if (!open) {
            setIsLoading(false);
            setCurrentStep(1);
            setStartDate(undefined);
            setEndDate(undefined);
            setSelectedHolidayDates([]);
            setHolidays([]);
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

    // Step navigation helpers
    const canGoNext = () => {
        if (currentStep === 1) {
            return startDate && endDate && !dateError;
        }
        if (currentStep === 2) {
            return true; // Can always proceed from step 2 (holidays are optional)
        }
        return false;
    };

    const handleNext = () => {
        if (currentStep === 1 && canGoNext()) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            // Initialize holidays array from selected dates
            const newHolidays = selectedHolidayDates.map(date => ({
                date,
                comment: ''
            }));
            setHolidays(newHolidays);

            if (selectedHolidayDates.length > 0) {
                setCurrentStep(3);
            } else {
                // Skip step 3 if no holidays selected
                handleFinalSave();
            }
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleUpdateHolidayComment = (index: number, comment: string) => {
        setHolidays(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], comment };
            return updated;
        });
    };

    const handleFinalSave = async () => {
        if (!courseId || !semester || !startDate || !endDate) return;

        setIsLoading(true);

        try {
            const manualData: CalendarFormData = {
                courseId,
                semester,
                startDate,
                endDate,
                holidays: holidays.length > 0 ? holidays : undefined
            };

            await onSave(manualData);
        } catch (error) {
            console.error('Error saving calendar:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!courseId || !semester) return;

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
                                {/* Step Indicator */}
                                <div className="flex items-center justify-center gap-2">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${currentStep === 1 ? 'bg-primary text-primary-foreground' : currentStep > 1 ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        1
                                    </div>
                                    <div className={`h-0.5 w-12 ${currentStep > 1 ? 'bg-green-500' : 'bg-muted'}`} />
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${currentStep === 2 ? 'bg-primary text-primary-foreground' : currentStep > 2 ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        2
                                    </div>
                                    <div className={`h-0.5 w-12 ${currentStep > 2 ? 'bg-green-500' : 'bg-muted'}`} />
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${currentStep === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                        3
                                    </div>
                                </div>

                                {/* Step 1: Date Selection */}
                                {currentStep === 1 && (
                                    <div className="space-y-4 flex flex-col flex-1">
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold">Paso 1: Selecciona las fechas del calendario</h3>
                                            <p className="text-xs text-muted-foreground">
                                                Selecciona la fecha de inicio y fin del calendario académico
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Date Picker para fecha de inicio */}
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold">
                                                    {t("drawer.calendar.create.tabs.manual.start.date")}
                                                </Label>
                                                <Popover modal={true} open={startDateOpen} onOpenChange={setStartDateOpen}>
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
                                                                if (date && !isDateDisabled(date)) {
                                                                    setStartDate(date);
                                                                    setStartDateOpen(false);
                                                                }
                                                            }}
                                                            disabled={isDateDisabled}
                                                            weekStartsOn={1}
                                                            locale={es}
                                                            defaultMonth={getDefaultMonth()}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            {/* Date Picker para fecha de fin */}
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold">
                                                    {t("drawer.calendar.create.tabs.manual.end.date")}
                                                </Label>
                                                <Popover modal={true} open={endDateOpen} onOpenChange={setEndDateOpen}>
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
                                                                if (date && !isDateDisabled(date) && (!startDate || date > startDate)) {
                                                                    setEndDate(date);
                                                                    setEndDateOpen(false);
                                                                }
                                                            }}
                                                            disabled={(date) => isDateDisabled(date) || (startDate ? date <= startDate : false)}
                                                            weekStartsOn={1}
                                                            locale={es}
                                                            defaultMonth={getDefaultMonth()}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>

                                        {dateError && (
                                            <div className="rounded-md bg-destructive/10 p-2.5 border border-destructive/30">
                                                <p className="text-xs text-destructive">{dateError}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 2: Holiday Selection */}
                                {currentStep === 2 && (
                                    <div className="space-y-4 flex flex-col flex-1 min-h-0">
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold">Paso 2: Selecciona los días festivos</h3>
                                            <p className="text-xs text-muted-foreground">
                                                Marca en el calendario los días festivos o no lectivos (opcional)
                                            </p>
                                        </div>

                                        <div className="space-y-2 flex flex-col min-h-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-semibold">
                                                    {t("drawer.calendar.create.tabs.manual.holidays")}
                                                </h4>
                                                {selectedHolidayDates.length > 0 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {selectedHolidayDates.length}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="border rounded-lg bg-muted/30 flex justify-center overflow-y-auto flex-1 min-h-0">
                                                <CalendarComponent
                                                    mode="multiple"
                                                    selected={selectedHolidayDates}
                                                    onSelect={(dates) => {
                                                        setSelectedHolidayDates(Array.isArray(dates) ? dates : []);
                                                    }}
                                                    disabled={(date) => {
                                                        if (!startDate || !endDate) return true;
                                                        return date < startDate || date > endDate || isWeekend(date);
                                                    }}
                                                    weekStartsOn={1}
                                                    locale={es}
                                                    defaultMonth={startDate || getDefaultMonth()}
                                                />
                                            </div>

                                            {selectedHolidayDates.length > 0 && (
                                                <div className="space-y-1.5 overflow-y-auto">
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        {t("drawer.calendar.create.tabs.manual.selected.holidays")}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {selectedHolidayDates.map((date) => (
                                                            <Badge key={date.toString()} variant="secondary" className="text-xs">
                                                                {format(date, "dd/MM/yyyy")}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Holiday Comments */}
                                {currentStep === 3 && (
                                    <div className="space-y-4 flex flex-col flex-1 min-h-0">
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold">Paso 3: Añade comentarios a los festivos</h3>
                                            <p className="text-xs text-muted-foreground">
                                                Añade un comentario descriptivo a cada día festivo (ej: "Navidad", "Día del trabajador")
                                            </p>
                                        </div>

                                        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                                            {holidays.map((holiday, index) => (
                                                <div key={index} className="space-y-1.5 p-3 border rounded-lg bg-muted/20">
                                                    <Label className="text-xs font-semibold">
                                                        {format(holiday.date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                                                    </Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="Ej: Navidad, Día festivo..."
                                                        value={holiday.comment}
                                                        onChange={(e) => handleUpdateHolidayComment(index, e.target.value)}
                                                        className="text-xs h-8"
                                                    />
                                                </div>
                                            ))}
                                        </div>
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
                <div className="p-4 flex justify-between border-t">
                    <div className="flex space-x-2">
                        {activeTab === "manual" && currentStep > 1 && (
                            <Button
                                variant="outline"
                                onClick={handlePrevious}
                                disabled={isLoading}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Anterior
                            </Button>
                        )}
                    </div>

                    <div className="flex space-x-2">
                        <DrawerClose asChild>
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                {t("drawer.calendar.create.cancel")}
                            </Button>
                        </DrawerClose>

                        {activeTab === "manual" ? (
                            currentStep < 3 ? (
                                <Button
                                    disabled={!canGoNext() || isLoading}
                                    onClick={handleNext}
                                >
                                    Siguiente
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            ) : (
                                <Button
                                    disabled={isLoading}
                                    onClick={handleFinalSave}
                                >
                                    {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                                    {t("drawer.calendar.create.save")}
                                </Button>
                            )
                        ) : (
                            <Button
                                disabled={uploadedFiles.length !== 5 || isLoading}
                                onClick={handleSave}
                            >
                                {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                                {t("drawer.calendar.create.save")}
                            </Button>
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};