// components/calendar/CreateCalendarDrawer.tsx
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format, addYears, isSaturday, isSunday, isValid, isBefore, isAfter, startOfDay } from "date-fns";
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
    ChevronRight,
    Copy
} from "lucide-react";
import { CalendarFormData, CalendarDrawerData } from "@/types/Calendar";
import { useCoursesByDegreeId } from "@/hooks/course/useCoursesByDegreeId";
import { useCalendarDays } from "@/hooks/calendar/useCalendarDays";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateCalendarDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (formData: CalendarFormData) => Promise<void>;
    calendarData: CalendarDrawerData | null;
}

const REQUIRED_FILES = [
    { name: "asignaturas.txt", description: "Información general sobre las asignaturas", required: true },
    { name: "calendario.txt", description: "Calendario académico con fechas lectivas y festivos", required: true },
    { name: "horarios.txt", description: "Eventos de clase que se repiten", required: true },
    { name: "excepciones.txt", description: "Eventos de clase puntuales (opcional)", required: false },
    { name: "ubicaciones.txt", description: "Información sobre aulas y laboratorios", required: true }
];

/**
 * Calcula el número de días lectivos por día de la semana
 * entre dos fechas, excluyendo fines de semana y festivos
 */
const calculateLectiveDaysByWeekday = (
    startDate: Date | undefined,
    endDate: Date | undefined,
    holidays: Date[]
): { L: number; M: number; X: number; J: number; V: number } => {
    if (!startDate || !endDate) {
        return { L: 0, M: 0, X: 0, J: 0, V: 0 };
    }

    const holidaySet = new Set(holidays.map(d => d.toDateString()));
    const counts = { L: 0, M: 0, X: 0, J: 0, V: 0 };

    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
        const dayOfWeek = current.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = holidaySet.has(current.toDateString());

        // Solo contar si es día lectivo (no fin de semana y no festivo)
        if (!isWeekend && !isHoliday) {
            if (dayOfWeek === 1) counts.L++;
            else if (dayOfWeek === 2) counts.M++;
            else if (dayOfWeek === 3) counts.X++;
            else if (dayOfWeek === 4) counts.J++;
            else if (dayOfWeek === 5) counts.V++;
        }

        current.setDate(current.getDate() + 1);
    }

    return counts;
};

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

    // Duplicate tab states
    const [duplicateStep, setDuplicateStep] = useState(1);
    const [selectedSourceCalendarId, setSelectedSourceCalendarId] = useState<string>("");
    const [duplicateStartDate, setDuplicateStartDate] = useState<Date | undefined>();
    const [duplicateEndDate, setDuplicateEndDate] = useState<Date | undefined>();
    const [duplicateHolidays, setDuplicateHolidays] = useState<Array<{ date: Date; comment: string }>>([]);
    const [holidayPool, setHolidayPool] = useState<Array<{ date: Date; comment: string }>>([]);
    const [duplicateDateError, setDuplicateDateError] = useState("");
    const [duplicateStartDateOpen, setDuplicateStartDateOpen] = useState(false);
    const [duplicateEndDateOpen, setDuplicateEndDateOpen] = useState(false);

    // Extraer valores de calendarData
    const courseId = calendarData?.courseId;
    const semester = calendarData?.semester;
    const courseYear = calendarData?.courseYear;
    const degreeId = calendarData?.degreeId;

    // Fetch all courses from the degree to get their calendars
    const { data: allCourses = [] } = useCoursesByDegreeId(degreeId || null);

    // Fetch days from selected source calendar
    const { data: sourceDays = [] } = useCalendarDays(selectedSourceCalendarId || null);

    const courseStartYear = courseYear ? Number(courseYear.split('-')[0]) : undefined;
    const courseEndYear = courseYear ? Number(courseYear.split('-')[1]) : undefined;

    // Memoized course date range: from 31/08/startYear to 31/08/endYear
    const courseRange = useMemo(() => {
        if (!courseStartYear || !courseEndYear) return null;
        return {
            courseStart: new Date(courseStartYear, 7, 31),
            courseEnd: new Date(courseEndYear, 7, 31),
        };
    }, [courseStartYear, courseEndYear]);

    const getDefaultMonth = () => {
        if (!courseRange) return new Date();
        const today = new Date();
        if (today >= courseRange.courseStart && today <= courseRange.courseEnd) return today;
        return new Date(courseStartYear!, 8, 1); // 1 de septiembre
    };

    const isDateDisabled = (date: Date) => {
        if (!courseRange) return false;
        return date < courseRange.courseStart || date > courseRange.courseEnd || isSaturday(date) || isSunday(date);
    };

    // Derived: dates array from duplicateHolidays (already sorted by the pool effect)
    const duplicateHolidayDates = useMemo(() => duplicateHolidays.map(h => h.date), [duplicateHolidays]);

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
            // Reset duplicate tab
            setDuplicateStep(1);
            setSelectedSourceCalendarId("");
            setDuplicateStartDate(undefined);
            setDuplicateEndDate(undefined);
            setDuplicateHolidays([]);
            setHolidayPool([]);
            setDuplicateDateError("");
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

    // Validate duplicate dates
    useEffect(() => {
        if (duplicateStartDate && duplicateEndDate) {
            if (duplicateStartDate >= duplicateEndDate) {
                setDuplicateDateError("La fecha de inicio debe ser anterior a la fecha de fin");
            } else {
                setDuplicateDateError("");
            }
        } else {
            setDuplicateDateError("");
        }
    }, [duplicateStartDate, duplicateEndDate]);

    // Recalculate visible holidays when date range changes (filter from pool, restore when range expands)
    useEffect(() => {
        if (holidayPool.length === 0) return;
        const filtered = holidayPool
            .filter(({ date }) => {
                const d = startOfDay(date);
                if (duplicateStartDate && isBefore(d, startOfDay(duplicateStartDate))) return false;
                if (duplicateEndDate && isAfter(d, startOfDay(duplicateEndDate))) return false;
                return true;
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime());
        setDuplicateHolidays(filtered);
    }, [duplicateStartDate, duplicateEndDate, holidayPool]);

    // Extract calendars from courses and filter: same semester, different course year (memoized for performance)
    const availableSourceCalendars = useMemo(() => {
        if (!semester) return [];

        const calendarsWithCourseInfo: Array<{
            id: string;
            semester: number;
            start: string;
            end: string;
            courseId: string;
            courseStartYear: number;
            courseEndYear: number;
        }> = [];

        allCourses.forEach(course => {
            if (course.calendars && course.calendars.length > 0) {
                course.calendars.forEach(cal => {
                    // Same semester, different course
                    if (cal.semester === semester && course.id !== courseId) {
                        // Use 'start' and 'end' as they come from backend
                        const calWithDates = cal as any;
                        calendarsWithCourseInfo.push({
                            id: cal.id,
                            semester: cal.semester,
                            start: calWithDates.start || cal.startDate,
                            end: calWithDates.end || cal.endDate,
                            courseId: course.id,
                            courseStartYear: course.startYear,
                            courseEndYear: course.endYear
                        });
                    }
                });
            }
        });

        return calendarsWithCourseInfo;
    }, [allCourses, semester, courseId]);

    // Load source calendar data when selected and adjust dates to target course year
    useEffect(() => {
        if (selectedSourceCalendarId && availableSourceCalendars.length > 0 && courseStartYear) {
            const sourceCalendar = availableSourceCalendars.find(cal => cal.id === selectedSourceCalendarId);

            if (sourceCalendar) {
                // Calculate year difference between source and target
                const sourceYear = sourceCalendar.courseStartYear;
                const targetYear = courseStartYear;
                const yearDiff = targetYear - sourceYear;

                // Adjust dates by the year difference
                // El backend devuelve timestamps, los parseamos y ajustamos el año
                const sourceStartDate = new Date(sourceCalendar.start);
                const sourceEndDate = new Date(sourceCalendar.end);

                if (isValid(sourceStartDate)) {
                    const adjustedStartDate = addYears(sourceStartDate, yearDiff);
                    setDuplicateStartDate(adjustedStartDate);
                }
                if (isValid(sourceEndDate)) {
                    const adjustedEndDate = addYears(sourceEndDate, yearDiff);
                    setDuplicateEndDate(adjustedEndDate);
                }
            }
        }
    }, [selectedSourceCalendarId, availableSourceCalendars, courseStartYear]);

    // Load and adjust festivos from source calendar when days are fetched
    useEffect(() => {
        if (sourceDays.length === 0 || !courseStartYear || !courseEndYear) return;
        const sourceCalendar = availableSourceCalendars.find(cal => cal.id === selectedSourceCalendarId);
        if (!sourceCalendar) return;

        const yearDiff = courseStartYear - sourceCalendar.courseStartYear;

        const adjustedHolidays = sourceDays
            .filter(day => !day.lective && day.dayCharacter === 'F' && !isSaturday(new Date(day.date)) && !isSunday(new Date(day.date)))
            .reduce<Array<{ date: Date; comment: string }>>((acc, festivo) => {
                const adjustedDate = addYears(new Date(festivo.date), yearDiff);
                if (!isSaturday(adjustedDate) && !isSunday(adjustedDate)) {
                    acc.push({ date: adjustedDate, comment: festivo.comment || '' });
                }
                return acc;
            }, []);

        setHolidayPool(adjustedHolidays);
    }, [sourceDays, selectedSourceCalendarId, availableSourceCalendars, courseStartYear, courseEndYear]);

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
            // Initialize holidays array from selected dates, sorted chronologically
            const newHolidays = [...selectedHolidayDates]
                .sort((a, b) => a.getTime() - b.getTime())
                .map(date => ({ date, comment: '' }));
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

    // Duplicate tab - step navigation
    const canDuplicateGoNext = () => {
        if (duplicateStep === 1) {
            return !!selectedSourceCalendarId;
        }
        if (duplicateStep === 2) {
            return duplicateStartDate && duplicateEndDate && !duplicateDateError;
        }
        return false;
    };

    const handleDuplicateNext = () => {
        if (duplicateStep === 1 && canDuplicateGoNext()) {
            setDuplicateStep(2);
        } else if (duplicateStep === 2 && canDuplicateGoNext()) {
            // duplicateHolidays is already synced from holidayPool (with comments preserved and sorted)

            if (duplicateHolidayDates.length > 0) {
                setDuplicateStep(3);
            } else {
                // Skip step 3 if no holidays selected
                handleDuplicateSave();
            }
        }
    };

    const handleDuplicatePrevious = () => {
        if (duplicateStep > 1) {
            setDuplicateStep(duplicateStep - 1);
        }
    };

    const handleUpdateDuplicateHolidayComment = (index: number, comment: string) => {
        setDuplicateHolidays(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], comment };
            return updated;
        });
    };

    const handleDuplicateSave = async () => {
        if (!courseId || !semester || !selectedSourceCalendarId || !duplicateStartDate || !duplicateEndDate) return;

        setIsLoading(true);

        try {
            const duplicateData: CalendarFormData = {
                courseId,
                semester,
                sourceCalendarId: selectedSourceCalendarId,
                startDate: duplicateStartDate,
                endDate: duplicateEndDate,
                holidays: duplicateHolidays.length > 0 ? duplicateHolidays : undefined
            };

            await onSave(duplicateData);
        } catch (error) {
            console.error('Error duplicating calendar:', error);
        } finally {
            setIsLoading(false);
        }
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
                                <TabsTrigger value="duplicate" className="flex items-center gap-2">
                                    <Copy className="h-4 w-4" />
                                    Duplicar
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
                                                            disabled={(date) => isDateDisabled(date) || (endDate ? date >= endDate : false)}
                                                            weekStartsOn={1}
                                                            locale={es}
                                                            defaultMonth={startDate || getDefaultMonth()}
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
                                                            defaultMonth={endDate || startDate || getDefaultMonth()}
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
                                                        return date < startDate || date > endDate || isSaturday(date) || isSunday(date);
                                                    }}
                                                    weekStartsOn={1}
                                                    locale={es}
                                                    defaultMonth={startDate || getDefaultMonth()}
                                                />
                                            </div>

                                            {/* Contador de días lectivos - siempre visible */}
                                            <div className="flex gap-1.5 text-xs">
                                                {(() => {
                                                    const lectiveCounts = calculateLectiveDaysByWeekday(startDate, endDate, selectedHolidayDates);
                                                    return ['L', 'M', 'X', 'J', 'V'].map((day) => (
                                                        <Badge key={day} variant="secondary" className="text-xs px-1.5 py-0">
                                                            {day}:{lectiveCounts[day as keyof typeof lectiveCounts]}
                                                        </Badge>
                                                    ));
                                                })()}
                                            </div>

                                            {/* Lista de festivos - solo visible cuando hay festivos */}
                                            {selectedHolidayDates.length > 0 && (
                                                <div className="space-y-1.5 overflow-y-auto">
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        {t("drawer.calendar.create.tabs.manual.selected.holidays")}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {[...selectedHolidayDates]
                                                            .sort((a, b) => a.getTime() - b.getTime())
                                                            .map((date) => (
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
                                            {uploadedFiles.filter(f => REQUIRED_FILES.find(rf => rf.name === f.name && rf.required)).length}/{REQUIRED_FILES.filter(f => f.required).length} requeridos
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

                        {/* Tab Duplicate */}
                        <TabsContent value="duplicate" className="space-y-4 mt-6 flex flex-col h-full">
                            <div className="w-full space-y-4 flex flex-col h-full">
                                {/* Step Indicator */}
                                <div className="flex items-center justify-center gap-2">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${duplicateStep === 1 ? 'bg-primary text-primary-foreground' : duplicateStep > 1 ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        1
                                    </div>
                                    <div className={`h-0.5 w-12 ${duplicateStep > 1 ? 'bg-green-500' : 'bg-muted'}`} />
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${duplicateStep === 2 ? 'bg-primary text-primary-foreground' : duplicateStep > 2 ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                        2
                                    </div>
                                    <div className={`h-0.5 w-12 ${duplicateStep > 2 ? 'bg-green-500' : 'bg-muted'}`} />
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ${duplicateStep === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                        3
                                    </div>
                                </div>

                                {/* Step 1: Select Source Calendar */}
                                {duplicateStep === 1 && (
                                    <div className="space-y-4 flex flex-col flex-1">
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold">Paso 1: Selecciona el calendario origen</h3>
                                            <p className="text-xs text-muted-foreground">
                                                Selecciona un calendario existente del mismo semestre para duplicar
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold">Calendario origen</Label>
                                            <Select value={selectedSourceCalendarId} onValueChange={setSelectedSourceCalendarId}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Selecciona un calendario..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableSourceCalendars.map((cal) => (
                                                        <SelectItem key={cal.id} value={cal.id}>
                                                            {cal.courseStartYear}/{cal.courseEndYear} - Semestre {cal.semester}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {availableSourceCalendars.length === 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    No hay calendarios disponibles para duplicar en este semestre
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Adjust Dates */}
                                {duplicateStep === 2 && (
                                    <div className="space-y-4 flex flex-col flex-1 min-h-0">
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold">Paso 2: Ajusta las fechas del calendario</h3>
                                            <p className="text-xs text-muted-foreground">
                                                Revisa y ajusta las fechas del nuevo calendario. Se han pre-rellenado con las fechas del calendario origen.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Start Date Picker */}
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold">Fecha de inicio</Label>
                                                <Popover modal={true} open={duplicateStartDateOpen} onOpenChange={setDuplicateStartDateOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full justify-start text-left font-normal text-xs h-9"
                                                            disabled={isLoading}
                                                        >
                                                            {duplicateStartDate ? format(duplicateStartDate, "dd/MM/yyyy") : "Selecciona fecha"}
                                                            <ChevronDownIcon className="ml-auto h-4 w-4" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <CalendarComponent
                                                            mode="single"
                                                            selected={duplicateStartDate}
                                                            onSelect={(date) => {
                                                                if (date && !isDateDisabled(date)) {
                                                                    setDuplicateStartDate(date);
                                                                    setDuplicateStartDateOpen(false);
                                                                }
                                                            }}
                                                            disabled={(date) => isDateDisabled(date) || (duplicateEndDate ? date >= duplicateEndDate : false)}
                                                            weekStartsOn={1}
                                                            locale={es}
                                                            defaultMonth={duplicateStartDate || getDefaultMonth()}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            {/* End Date Picker */}
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold">Fecha de fin</Label>
                                                <Popover modal={true} open={duplicateEndDateOpen} onOpenChange={setDuplicateEndDateOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full justify-start text-left font-normal text-xs h-9"
                                                            disabled={!duplicateStartDate || isLoading}
                                                        >
                                                            {duplicateEndDate ? format(duplicateEndDate, "dd/MM/yyyy") : "Selecciona fecha"}
                                                            <ChevronDownIcon className="ml-auto h-4 w-4" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <CalendarComponent
                                                            mode="single"
                                                            selected={duplicateEndDate}
                                                            onSelect={(date) => {
                                                                if (date && !isDateDisabled(date) && (!duplicateStartDate || date > duplicateStartDate)) {
                                                                    setDuplicateEndDate(date);
                                                                    setDuplicateEndDateOpen(false);
                                                                }
                                                            }}
                                                            disabled={(date) => isDateDisabled(date) || (duplicateStartDate ? date <= duplicateStartDate : false)}
                                                            weekStartsOn={1}
                                                            locale={es}
                                                            defaultMonth={duplicateEndDate || duplicateStartDate || getDefaultMonth()}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>

                                        {duplicateDateError && (
                                            <div className="rounded-md bg-destructive/10 p-2.5 border border-destructive/30">
                                                <p className="text-xs text-destructive">{duplicateDateError}</p>
                                            </div>
                                        )}

                                        {/* Holiday Selection */}
                                        <div className="space-y-2 flex flex-col min-h-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-semibold">Días festivos (opcional)</h4>
                                                {duplicateHolidayDates.length > 0 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {duplicateHolidayDates.length}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="border rounded-lg bg-muted/30 flex justify-center overflow-y-auto flex-1 min-h-0">
                                                <CalendarComponent
                                                    mode="multiple"
                                                    selected={duplicateHolidayDates}
                                                    onSelect={(dates) => {
                                                        const selected = Array.isArray(dates) ? dates : [];
                                                        const selectedTimes = new Set(selected.map(d => startOfDay(d).getTime()));
                                                        const visibleTimes = new Set(duplicateHolidayDates.map(d => startOfDay(d).getTime()));
                                                        setHolidayPool(prev => [
                                                            ...prev.filter(h => !visibleTimes.has(startOfDay(h.date).getTime()) || selectedTimes.has(startOfDay(h.date).getTime())),
                                                            ...selected
                                                                .filter(d => !prev.some(h => startOfDay(h.date).getTime() === startOfDay(d).getTime()))
                                                                .map(date => ({ date, comment: '' }))
                                                        ]);
                                                    }}
                                                    disabled={(date) => {
                                                        if (!duplicateStartDate || !duplicateEndDate) return true;
                                                        return isBefore(startOfDay(date), startOfDay(duplicateStartDate)) ||
                                                               isAfter(startOfDay(date), startOfDay(duplicateEndDate)) ||
                                                               isSaturday(date) || isSunday(date);
                                                    }}
                                                    weekStartsOn={1}
                                                    locale={es}
                                                    defaultMonth={duplicateStartDate || getDefaultMonth()}
                                                />
                                            </div>

                                            {/* Contador de días lectivos - siempre visible */}
                                            <div className="flex gap-1.5 text-xs">
                                                {(() => {
                                                    const lectiveCounts = calculateLectiveDaysByWeekday(duplicateStartDate, duplicateEndDate, duplicateHolidayDates);
                                                    return ['L', 'M', 'X', 'J', 'V'].map((day) => (
                                                        <Badge key={day} variant="secondary" className="text-xs px-1.5 py-0">
                                                            {day}:{lectiveCounts[day as keyof typeof lectiveCounts]}
                                                        </Badge>
                                                    ));
                                                })()}
                                            </div>

                                            {/* Lista de festivos - solo visible cuando hay festivos */}
                                            {duplicateHolidayDates.length > 0 && (
                                                <div className="space-y-1.5 overflow-y-auto">
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        Festivos seleccionados
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {duplicateHolidayDates.map((date) => (
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

                                {/* Step 3: Add Comments to Holidays */}
                                {duplicateStep === 3 && (
                                    <div className="space-y-4 flex flex-col flex-1 min-h-0">
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold">Paso 3: Añade comentarios a los festivos</h3>
                                            <p className="text-xs text-muted-foreground">
                                                Añade un comentario descriptivo a cada día festivo (ej: "Navidad", "Día del trabajador")
                                            </p>
                                        </div>

                                        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                                            {duplicateHolidays.map((holiday, index) => (
                                                <div key={index} className="space-y-1.5 p-3 border rounded-lg bg-muted/20">
                                                    <Label className="text-xs font-semibold">
                                                        {format(holiday.date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                                                    </Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="Ej: Navidad, Día festivo..."
                                                        value={holiday.comment}
                                                        onChange={(e) => handleUpdateDuplicateHolidayComment(index, e.target.value)}
                                                        className="text-xs h-8"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                        {activeTab === "duplicate" && duplicateStep > 1 && (
                            <Button
                                variant="outline"
                                onClick={handleDuplicatePrevious}
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
                        ) : activeTab === "duplicate" ? (
                            duplicateStep < 3 ? (
                                <Button
                                    disabled={!canDuplicateGoNext() || isLoading}
                                    onClick={handleDuplicateNext}
                                >
                                    Siguiente
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            ) : (
                                <Button
                                    disabled={isLoading}
                                    onClick={handleDuplicateSave}
                                >
                                    {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                                    Duplicar Calendario
                                </Button>
                            )
                        ) : (
                            <Button
                                disabled={
                                    uploadedFiles.filter(f => REQUIRED_FILES.find(rf => rf.name === f.name && rf.required)).length !==
                                    REQUIRED_FILES.filter(f => f.required).length ||
                                    isLoading
                                }
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