import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, CheckCircle, Info, InfoIcon, ChevronDown, ChevronUp } from "lucide-react";
import { ImportResult } from "@/types/Calendar";
import { useState } from "react";

interface CompleteImportValidationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    importResult: ImportResult | null;
}

export const CompleteImportValidationDialog = ({
    open,
    onOpenChange,
    importResult,
}: CompleteImportValidationDialogProps) => {
    const { t } = useTranslation();

    // Estado para controlar secciones expandidas/colapsadas
    const [expanded, setExpanded] = useState({
        // Ubicaciones
        ubicacionesCreated: false,
        ubicacionesUpdated: false,
        // Asignaturas
        asignaturasCreated: false,
        asignaturasErrors: false,
        // Horarios
        horariosGroupsAutoCreated: false,
        horariosSubjectErrors: false,
        horariosClassroomErrors: false,
        horariosGroupErrors: false,
        // Excepciones
        excepcionesGroupsAutoCreated: false,
        excepcionesSubjectErrors: false,
        excepcionesDateErrors: false,
        excepcionesGroupErrors: false,
        excepcionesClassroomErrors: false
    });

    if (!importResult?.importResult) return null;

    const { ubicaciones, calendario, asignaturas, horarios, excepciones } = importResult.importResult;

    // Determine which tabs to show based on available data
    const tabs: Array<{ key: string; label: string; hasContent: boolean }> = [
        {
            key: "ubicaciones",
            label: t("calendar.import.tabs.ubicaciones"),
            hasContent: !!ubicaciones && (ubicaciones.classroomsCreated.length > 0 || ubicaciones.classroomsUpdated.length > 0)
        },
        {
            key: "calendario",
            label: t("calendar.import.tabs.calendario"),
            hasContent: !!calendario && calendario.calendarCreated
        },
        {
            key: "asignaturas",
            label: t("calendar.import.tabs.asignaturas"),
            hasContent: !!asignaturas && (asignaturas.subjectsCreated.length > 0 || asignaturas.errors.length > 0)
        },
        {
            key: "horarios",
            label: t("calendar.import.tabs.horarios"),
            hasContent: !!horarios && (
                horarios.eventsCreated > 0 ||
                horarios.groupsAutoCreated.length > 0 ||
                horarios.subjectErrors.length > 0 ||
                horarios.classroomErrors.length > 0 ||
                horarios.groupErrors.length > 0
            )
        },
        {
            key: "excepciones",
            label: t("calendar.import.tabs.excepciones"),
            hasContent: !!excepciones && (
                excepciones.eventsCreated > 0 ||
                excepciones.groupsAutoCreated.length > 0 ||
                excepciones.subjectErrors.length > 0 ||
                excepciones.dateErrors.length > 0 ||
                excepciones.groupErrors.length > 0 ||
                excepciones.classroomErrors.length > 0
            )
        },
    ].filter(tab => tab.hasContent);

    // If no tabs have content, don't show the dialog
    if (tabs.length === 0) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] min-w-[1200px] w-fit h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="text-xl font-semibold">
                        {t("calendar.import.validation.title")}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("calendar.import.validation.subtitle")}
                    </p>
                </DialogHeader>

                <Tabs defaultValue={tabs[0].key} className="flex-1 min-h-0 overflow-hidden flex flex-col">
                    <TabsList className="shrink-0 mx-auto w-fit">
                        {tabs.map(tab => (
                            <TabsTrigger key={tab.key} value={tab.key}>
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* UBICACIONES TAB */}
                    {ubicaciones && (
                        <TabsContent value="ubicaciones" className="h-full overflow-y-auto space-y-4 pr-2">
                            {/* Created Classrooms */}
                            {ubicaciones.classroomsCreated.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-green-50 dark:bg-green-950/20 border-b border-green-200 p-3">
                                        <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4" />
                                            {t("calendar.import.ubicaciones.created.title", { count: ubicaciones.classroomsCreated.length })}
                                        </h4>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t("calendar.import.ubicaciones.code")}</TableHead>
                                                <TableHead>{t("calendar.import.ubicaciones.name")}</TableHead>
                                                <TableHead>{t("calendar.import.ubicaciones.building")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(expanded.ubicacionesCreated
                                                ? ubicaciones.classroomsCreated
                                                : ubicaciones.classroomsCreated.slice(0, 5)
                                            ).map((classroom, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-mono">{classroom.code}</TableCell>
                                                    <TableCell>{classroom.name}</TableCell>
                                                    <TableCell>{classroom.building}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Botón para expandir/colapsar */}
                                    {ubicaciones.classroomsCreated.length > 5 && (
                                        <Button
                                            variant="ghost"
                                            className="w-full border-t rounded-none bg-green-50/50 hover:bg-green-100/50 dark:bg-green-950/10 dark:hover:bg-green-950/20 text-green-700 dark:text-green-300"
                                            onClick={() => setExpanded(prev => ({ ...prev, ubicacionesCreated: !prev.ubicacionesCreated }))}
                                        >
                                            {expanded.ubicacionesCreated ? (
                                                <>
                                                    <ChevronUp className="h-4 w-4 mr-2" />
                                                    {t("calendar.import.showLess")}
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="h-4 w-4 mr-2" />
                                                    {t("calendar.import.showMore", { count: ubicaciones.classroomsCreated.length - 5 })}
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Updated Classrooms */}
                            {ubicaciones.classroomsUpdated.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 p-3">
                                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                            <InfoIcon className="h-4 w-4" />
                                            {t("calendar.import.ubicaciones.updated.title", { count: ubicaciones.classroomsUpdated.length })}
                                        </h4>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t("calendar.import.ubicaciones.code")}</TableHead>
                                                <TableHead>{t("calendar.import.ubicaciones.name")}</TableHead>
                                                <TableHead>{t("calendar.import.ubicaciones.building")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(expanded.ubicacionesUpdated
                                                ? ubicaciones.classroomsUpdated
                                                : ubicaciones.classroomsUpdated.slice(0, 5)
                                            ).map((classroom, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-mono">{classroom.code}</TableCell>
                                                    <TableCell>{classroom.name}</TableCell>
                                                    <TableCell>{classroom.building}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Botón para expandir/colapsar */}
                                    {ubicaciones.classroomsUpdated.length > 5 && (
                                        <Button
                                            variant="ghost"
                                            className="w-full border-t rounded-none bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-950/10 dark:hover:bg-blue-950/20 text-blue-700 dark:text-blue-300"
                                            onClick={() => setExpanded(prev => ({ ...prev, ubicacionesUpdated: !prev.ubicacionesUpdated }))}
                                        >
                                            {expanded.ubicacionesUpdated ? (
                                                <>
                                                    <ChevronUp className="h-4 w-4 mr-2" />
                                                    {t("calendar.import.showLess")}
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="h-4 w-4 mr-2" />
                                                    {t("calendar.import.showMore", { count: ubicaciones.classroomsUpdated.length - 5 })}
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    )}

                    {/* CALENDARIO TAB */}
                    {calendario && (
                        <TabsContent value="calendario" className="h-full overflow-y-auto space-y-4 pr-2">
                            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg p-6">
                                <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 flex items-center gap-2 mb-4">
                                    <CheckCircle className="h-5 w-5" />
                                    {t("calendar.import.calendario.created")}
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t("calendar.import.calendario.startDate")}</p>
                                        <p className="text-sm font-medium">{new Date(calendario.startDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t("calendar.import.calendario.endDate")}</p>
                                        <p className="text-sm font-medium">{new Date(calendario.endDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t("calendar.import.calendario.totalDays")}</p>
                                        <p className="text-sm font-medium">{calendario.totalDays}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t("calendar.import.calendario.lectiveDays")}</p>
                                        <p className="text-sm font-medium">{calendario.lectiveDays}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-muted-foreground">{t("calendar.import.calendario.charactersInUse")}</p>
                                        <p className="text-sm font-mono">{calendario.charactersInUse}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Warnings for ignored and auto-filled days */}
                            {(calendario.daysIgnoredOutOfRange ?? 0) > 0 && (
                                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 flex items-center gap-2 mb-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        {t("calendar.import.calendario.warnings.ignoredTitle", { count: calendario.daysIgnoredOutOfRange })}
                                    </h4>
                                    {calendario.ignoredDates && calendario.ignoredDates.length > 0 && (
                                        <div className="text-xs text-yellow-800 dark:text-yellow-200">
                                            <p className="font-medium mb-1">{t("calendar.import.calendario.warnings.daysIgnored")}:</p>
                                            <p className="font-mono">{calendario.ignoredDates.join(', ')}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(calendario.daysAutoFilled ?? 0) > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-2">
                                        <Info className="h-4 w-4" />
                                        {t("calendar.import.calendario.warnings.autoFilledTitle", { count: calendario.daysAutoFilled })}
                                    </h4>
                                    {calendario.autoFilledDates && calendario.autoFilledDates.length > 0 && (
                                        <div className="text-xs text-blue-800 dark:text-blue-200">
                                            <p className="font-medium mb-1">{t("calendar.import.calendario.warnings.daysAutoFilled")}:</p>
                                            <p className="font-mono">{calendario.autoFilledDates.join(', ')}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    )}

                    {/* ASIGNATURAS TAB */}
                    {asignaturas && (
                        <TabsContent value="asignaturas" className="h-full overflow-y-auto space-y-4 pr-2">
                            {/* Created Subjects */}
                            {asignaturas.subjectsCreated.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-green-50 dark:bg-green-950/20 border-b border-green-200 p-3">
                                        <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4" />
                                            {t("calendar.import.asignaturas.created.title", { count: asignaturas.subjectsCreated.length })}
                                        </h4>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t("calendar.import.asignaturas.acronym")}</TableHead>
                                                <TableHead>{t("calendar.import.asignaturas.name")}</TableHead>
                                                <TableHead>{t("calendar.import.asignaturas.totalGroups")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(expanded.asignaturasCreated
                                                ? asignaturas.subjectsCreated
                                                : asignaturas.subjectsCreated.slice(0, 5)
                                            ).map((subject, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-mono">{subject.acronym}</TableCell>
                                                    <TableCell>{subject.name}</TableCell>
                                                    <TableCell>{subject.totalGroups}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {asignaturas.subjectsCreated.length > 5 && (
                                        <div className="p-3 border-t">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setExpanded(prev => ({ ...prev, asignaturasCreated: !prev.asignaturasCreated }))}
                                                className="w-full"
                                            >
                                                {expanded.asignaturasCreated
                                                    ? t("calendar.import.showLess")
                                                    : t("calendar.import.showMore", { count: asignaturas.subjectsCreated.length - 5 })}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Errors */}
                            {asignaturas.errors.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-200 p-3">
                                        <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            {t("calendar.import.asignaturas.errors.title", { count: asignaturas.errors.length })}
                                        </h4>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t("calendar.import.row")}</TableHead>
                                                <TableHead>{t("calendar.import.asignaturas.acronym")}</TableHead>
                                                <TableHead>{t("calendar.import.error")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(expanded.asignaturasErrors
                                                ? asignaturas.errors
                                                : asignaturas.errors.slice(0, 5)
                                            ).map((error, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{error.row}</TableCell>
                                                    <TableCell className="font-mono">{error.acronym}</TableCell>
                                                    <TableCell className="text-sm text-red-600 dark:text-red-400">
                                                        {error.error.message}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {asignaturas.errors.length > 5 && (
                                        <div className="p-3 border-t">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setExpanded(prev => ({ ...prev, asignaturasErrors: !prev.asignaturasErrors }))}
                                                className="w-full"
                                            >
                                                {expanded.asignaturasErrors
                                                    ? t("calendar.import.showLess")
                                                    : t("calendar.import.showMore", { count: asignaturas.errors.length - 5 })}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    )}

                    {/* HORARIOS TAB */}
                    {horarios && (
                        <TabsContent value="horarios" className="h-full overflow-y-auto space-y-4 pr-2">
                            {/* Statistics */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg p-4">
                                    <p className="text-xs text-muted-foreground">{t("calendar.import.eventsCreated")}</p>
                                    <p className="text-2xl font-bold text-green-600">{horarios.eventsCreated}</p>
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-xs text-muted-foreground">{t("calendar.import.eventsSkipped")}</p>
                                    <p className="text-2xl font-bold text-yellow-600">{horarios.eventsSkipped}</p>
                                </div>
                            </div>

                            {/* Groups Auto-Created */}
                            {horarios.groupsAutoCreated.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 p-3">
                                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                            <InfoIcon className="h-4 w-4" />
                                            {t("calendar.import.horarios.groupsAutoCreated", { count: horarios.groupsAutoCreated.length })}
                                        </h4>
                                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                            {t("calendar.import.horarios.groupsAutoCreatedDescription")}
                                        </p>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t("calendar.import.row")}</TableHead>
                                                <TableHead>{t("calendar.import.group")}</TableHead>
                                                <TableHead>{t("calendar.import.message")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(expanded.horariosGroupsAutoCreated
                                                ? horarios.groupsAutoCreated
                                                : horarios.groupsAutoCreated.slice(0, 5)
                                            ).map((warning, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{warning.row}</TableCell>
                                                    <TableCell className="font-mono">{warning.groupKey}</TableCell>
                                                    <TableCell className="text-sm text-blue-600">{warning.warning.message}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Botón para expandir/colapsar */}
                                    {horarios.groupsAutoCreated.length > 5 && (
                                        <Button
                                            variant="ghost"
                                            className="w-full border-t rounded-none bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-950/10 dark:hover:bg-blue-950/20 text-blue-700 dark:text-blue-300"
                                            onClick={() => setExpanded(prev => ({ ...prev, horariosGroupsAutoCreated: !prev.horariosGroupsAutoCreated }))}
                                        >
                                            {expanded.horariosGroupsAutoCreated ? (
                                                <>
                                                    <ChevronUp className="h-4 w-4 mr-2" />
                                                    {t("calendar.import.showLess")}
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="h-4 w-4 mr-2" />
                                                    {t("calendar.import.showMore", { count: horarios.groupsAutoCreated.length - 5 })}
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Subject Errors */}
                            {horarios.subjectErrors.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-200 p-3">
                                        <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            {t("calendar.import.horarios.subjectErrors", { count: horarios.subjectErrors.length })}
                                        </h4>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t("calendar.import.row")}</TableHead>
                                                <TableHead>{t("calendar.import.group")}</TableHead>
                                                <TableHead>{t("calendar.import.error")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(expanded.horariosSubjectErrors
                                                ? horarios.subjectErrors
                                                : horarios.subjectErrors.slice(0, 5)
                                            ).map((error, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{error.row}</TableCell>
                                                    <TableCell className="font-mono">{error.groupKey}</TableCell>
                                                    <TableCell className="text-sm text-red-600">{error.error.message}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Botón para expandir/colapsar */}
                                    {horarios.subjectErrors.length > 5 && (
                                        <Button
                                            variant="ghost"
                                            className="w-full border-t rounded-none bg-red-50/50 hover:bg-red-100/50 dark:bg-red-950/10 dark:hover:bg-red-950/20 text-red-700 dark:text-red-300"
                                            onClick={() => setExpanded(prev => ({ ...prev, horariosSubjectErrors: !prev.horariosSubjectErrors }))}
                                        >
                                            {expanded.horariosSubjectErrors ? (
                                                <>
                                                    <ChevronUp className="h-4 w-4 mr-2" />
                                                    {t("calendar.import.showLess")}
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="h-4 w-4 mr-2" />
                                                    {t("calendar.import.showMore", { count: horarios.subjectErrors.length - 5 })}
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Classroom Errors */}
                            {horarios.classroomErrors.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-200 p-3">
                                        <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            {t("calendar.import.horarios.classroomErrors", { count: horarios.classroomErrors.length })}
                                        </h4>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t("calendar.import.row")}</TableHead>
                                                <TableHead>{t("calendar.import.group")}</TableHead>
                                                <TableHead>{t("calendar.import.error")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(expanded.horariosClassroomErrors
                                                ? horarios.classroomErrors
                                                : horarios.classroomErrors.slice(0, 5)
                                            ).map((error, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{error.row}</TableCell>
                                                    <TableCell className="font-mono">{error.groupKey}</TableCell>
                                                    <TableCell className="text-sm text-red-600">{error.error.message}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Botón para expandir/colapsar */}
                                    {horarios.classroomErrors.length > 5 && (
                                        <Button
                                            variant="ghost"
                                            className="w-full border-t rounded-none bg-red-50/50 hover:bg-red-100/50 dark:bg-red-950/10 dark:hover:bg-red-950/20 text-red-700 dark:text-red-300"
                                            onClick={() => setExpanded(prev => ({ ...prev, horariosClassroomErrors: !prev.horariosClassroomErrors }))}
                                        >
                                            {expanded.horariosClassroomErrors ? (
                                                <>
                                                    <ChevronUp className="h-4 w-4 mr-2" />
                                                    {t("calendar.import.showLess")}
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="h-4 w-4 mr-2" />
                                                    {t("calendar.import.showMore", { count: horarios.classroomErrors.length - 5 })}
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Group Errors (exceeds max) */}
                            {horarios.groupErrors.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-200 p-3">
                                        <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            {t("calendar.import.horarios.groupErrors", { count: horarios.groupErrors.length })}
                                        </h4>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t("calendar.import.row")}</TableHead>
                                                <TableHead>{t("calendar.import.group")}</TableHead>
                                                <TableHead>{t("calendar.import.maxAllowed")}</TableHead>
                                                <TableHead>{t("calendar.import.error")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(expanded.horariosGroupErrors
                                                ? horarios.groupErrors
                                                : horarios.groupErrors.slice(0, 5)
                                            ).map((error, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{error.row}</TableCell>
                                                    <TableCell className="font-mono">{error.groupKey}</TableCell>
                                                    <TableCell>{error.maxAllowed}</TableCell>
                                                    <TableCell className="text-sm text-red-600">{error.error.message}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Botón para expandir/colapsar */}
                                    {horarios.groupErrors.length > 5 && (
                                        <Button
                                            variant="ghost"
                                            className="w-full border-t rounded-none bg-red-50/50 hover:bg-red-100/50 dark:bg-red-950/10 dark:hover:bg-red-950/20 text-red-700 dark:text-red-300"
                                            onClick={() => setExpanded(prev => ({ ...prev, horariosGroupErrors: !prev.horariosGroupErrors }))}
                                        >
                                            {expanded.horariosGroupErrors ? (
                                                <>
                                                    <ChevronUp className="h-4 w-4 mr-2" />
                                                    {t("calendar.import.showLess")}
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="h-4 w-4 mr-2" />
                                                    {t("calendar.import.showMore", { count: horarios.groupErrors.length - 5 })}
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    )}

                    {/* EXCEPCIONES TAB */}
                    {excepciones && (
                        <TabsContent value="excepciones" className="h-full overflow-y-auto space-y-4 pr-2">
                            {/* Statistics */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg p-4">
                                    <p className="text-xs text-muted-foreground">{t("calendar.import.eventsCreated")}</p>
                                    <p className="text-2xl font-bold text-green-600">{excepciones.eventsCreated}</p>
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-xs text-muted-foreground">{t("calendar.import.eventsSkipped")}</p>
                                    <p className="text-2xl font-bold text-yellow-600">{excepciones.eventsSkipped}</p>
                                </div>
                            </div>

                            {/* Groups Auto-Created (full import only) */}
                            {excepciones.groupsAutoCreated.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 p-3">
                                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                            <InfoIcon className="h-4 w-4" />
                                            {t("calendar.import.excepciones.groupsAutoCreated", { count: excepciones.groupsAutoCreated.length })}
                                        </h4>
                                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                            {t("calendar.import.excepciones.groupsAutoCreatedDescription")}
                                        </p>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t("calendar.import.row")}</TableHead>
                                                <TableHead>{t("calendar.import.group")}</TableHead>
                                                <TableHead>{t("calendar.import.message")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(expanded.excepcionesGroupsAutoCreated
                                                ? excepciones.groupsAutoCreated
                                                : excepciones.groupsAutoCreated.slice(0, 5)
                                            ).map((warning, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{warning.row}</TableCell>
                                                    <TableCell className="font-mono">{warning.groupKey}</TableCell>
                                                    <TableCell className="text-sm text-blue-600">{warning.warning.message}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {excepciones.groupsAutoCreated.length > 5 && (
                                        <div className="p-3 border-t">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setExpanded(prev => ({ ...prev, excepcionesGroupsAutoCreated: !prev.excepcionesGroupsAutoCreated }))}
                                                className="w-full"
                                            >
                                                {expanded.excepcionesGroupsAutoCreated
                                                    ? t("calendar.import.showLess")
                                                    : t("calendar.import.showMore", { count: excepciones.groupsAutoCreated.length - 5 })}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Subject Errors */}
                            {excepciones.subjectErrors.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-200 p-3">
                                        <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            {t("calendar.import.excepciones.subjectErrors", { count: excepciones.subjectErrors.length })}
                                        </h4>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t("calendar.import.row")}</TableHead>
                                                <TableHead>{t("calendar.import.group")}</TableHead>
                                                <TableHead>{t("calendar.import.error")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(expanded.excepcionesSubjectErrors
                                                ? excepciones.subjectErrors
                                                : excepciones.subjectErrors.slice(0, 5)
                                            ).map((error, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{error.row}</TableCell>
                                                    <TableCell className="font-mono">{error.groupKey}</TableCell>
                                                    <TableCell className="text-sm text-red-600">{error.error.message}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {excepciones.subjectErrors.length > 5 && (
                                        <div className="p-3 border-t">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setExpanded(prev => ({ ...prev, excepcionesSubjectErrors: !prev.excepcionesSubjectErrors }))}
                                                className="w-full"
                                            >
                                                {expanded.excepcionesSubjectErrors
                                                    ? t("calendar.import.showLess")
                                                    : t("calendar.import.showMore", { count: excepciones.subjectErrors.length - 5 })}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Date Errors */}
                            {excepciones.dateErrors.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-200 p-3">
                                        <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            {t("calendar.import.excepciones.dateErrors", { count: excepciones.dateErrors.length })}
                                        </h4>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t("calendar.import.row")}</TableHead>
                                                <TableHead>{t("calendar.import.group")}</TableHead>
                                                <TableHead>{t("calendar.import.date")}</TableHead>
                                                <TableHead>{t("calendar.import.error")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(expanded.excepcionesDateErrors
                                                ? excepciones.dateErrors
                                                : excepciones.dateErrors.slice(0, 5)
                                            ).map((error, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{error.row}</TableCell>
                                                    <TableCell className="font-mono">{error.groupKey}</TableCell>
                                                    <TableCell>{error.date}</TableCell>
                                                    <TableCell className="text-sm text-red-600">{error.error.message}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {excepciones.dateErrors.length > 5 && (
                                        <div className="p-3 border-t">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setExpanded(prev => ({ ...prev, excepcionesDateErrors: !prev.excepcionesDateErrors }))}
                                                className="w-full"
                                            >
                                                {expanded.excepcionesDateErrors
                                                    ? t("calendar.import.showLess")
                                                    : t("calendar.import.showMore", { count: excepciones.dateErrors.length - 5 })}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Group Errors */}
                            {excepciones.groupErrors.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-200 p-3">
                                        <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            {t("calendar.import.excepciones.groupErrors", { count: excepciones.groupErrors.length })}
                                        </h4>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t("calendar.import.row")}</TableHead>
                                                <TableHead>{t("calendar.import.group")}</TableHead>
                                                <TableHead>{t("calendar.import.error")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(expanded.excepcionesGroupErrors
                                                ? excepciones.groupErrors
                                                : excepciones.groupErrors.slice(0, 5)
                                            ).map((error, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{error.row}</TableCell>
                                                    <TableCell className="font-mono">{error.groupKey}</TableCell>
                                                    <TableCell className="text-sm text-red-600">{error.error.message}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {excepciones.groupErrors.length > 5 && (
                                        <div className="p-3 border-t">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setExpanded(prev => ({ ...prev, excepcionesGroupErrors: !prev.excepcionesGroupErrors }))}
                                                className="w-full"
                                            >
                                                {expanded.excepcionesGroupErrors
                                                    ? t("calendar.import.showLess")
                                                    : t("calendar.import.showMore", { count: excepciones.groupErrors.length - 5 })}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Classroom Errors */}
                            {excepciones.classroomErrors.length > 0 && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-200 p-3">
                                        <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            {t("calendar.import.excepciones.classroomErrors", { count: excepciones.classroomErrors.length })}
                                        </h4>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t("calendar.import.row")}</TableHead>
                                                <TableHead>{t("calendar.import.group")}</TableHead>
                                                <TableHead>{t("calendar.import.error")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(expanded.excepcionesClassroomErrors
                                                ? excepciones.classroomErrors
                                                : excepciones.classroomErrors.slice(0, 5)
                                            ).map((error, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{error.row}</TableCell>
                                                    <TableCell className="font-mono">{error.groupKey}</TableCell>
                                                    <TableCell className="text-sm text-red-600">{error.error.message}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {excepciones.classroomErrors.length > 5 && (
                                        <div className="p-3 border-t">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setExpanded(prev => ({ ...prev, excepcionesClassroomErrors: !prev.excepcionesClassroomErrors }))}
                                                className="w-full"
                                            >
                                                {expanded.excepcionesClassroomErrors
                                                    ? t("calendar.import.showLess")
                                                    : t("calendar.import.showMore", { count: excepciones.classroomErrors.length - 5 })}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    )}
                </Tabs>

                {/* Close Button */}
                <div className="shrink-0 border-t pt-3 flex justify-end">
                    <Button onClick={() => onOpenChange(false)}>
                        {t("common.close")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
