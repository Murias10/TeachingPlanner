"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MultiSelect } from '@/components/ui/multi-select';
import { useClassrooms } from '@/hooks/classroom/useClassrooms';
import { Badge } from '@/components/ui/badge';
import { isSpecialEventType, isReviewOrEvalEventType, EVENT_TYPE_LABELS } from '@/constants/eventCharacters';
import moment from 'moment';

const REQUEST_TYPE_LABELS: Record<string, string> = {
    CREATE: 'Crear',
    EDIT: 'Editar',
    CANCEL: 'Cancelar',
    REPLACE: 'Reemplazar',
};

interface EventRequest {
    id: string;
    professorId: string;
    calendarId: string;
    eventType: 'PUNTUAL' | 'PERIODIC';
    requestType?: 'CREATE' | 'EDIT' | 'CANCEL' | 'REPLACE';
    originalEventId?: string | null;
    eventData: Record<string, any>;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewedBy?: string;
    reviewedAt?: string;
    comments?: string;
    createdAt: string;
}

interface ApproveRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    solicitud: EventRequest | null;
    onApprove: (planifiedHours: number | undefined, classroomIds: string[]) => void;
    isSubmitting: boolean;
}

const ApproveRequestDialog: React.FC<ApproveRequestDialogProps> = ({
    open,
    onOpenChange,
    solicitud,
    onApprove,
    isSubmitting
}) => {
    const { data: classrooms = [] } = useClassrooms();
    const [planifiedHours, setPlanifiedHours] = useState<number | undefined>(undefined);
    const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([]);

    // Reset state when dialog opens with new solicitud
    useEffect(() => {
        if (solicitud && open) {
            // Pre-fill with existing data if available
            setPlanifiedHours(solicitud.eventData.planifiedHours);
            setSelectedClassroomIds(solicitud.eventData.classroomIds || []);
        }
    }, [solicitud, open]);

    const isPeriodicEvent = solicitud?.eventType === 'PERIODIC';
    const requestType = solicitud?.requestType || 'CREATE';
    const eventDataEventType = solicitud?.eventData?.eventType || 'NORMAL';
    const isCreateRequest = requestType === 'CREATE';
    const isSpecialEvent = isSpecialEventType(eventDataEventType);
    const isReviewOrEval = isReviewOrEvalEventType(eventDataEventType);
    const needsPlanifiedHours = isCreateRequest && isPeriodicEvent && !isSpecialEvent && !solicitud?.eventData.planifiedHours;
    const needsClassroom = isCreateRequest && (!solicitud?.eventData.classroomIds || solicitud.eventData.classroomIds.length === 0);

    // Validate that required fields are filled
    const canApprove = useMemo(() => {
        if (!isPeriodicEvent) {
            // For puntual events, only classroom might be missing
            return !needsClassroom || selectedClassroomIds.length > 0;
        }

        // For periodic events, both might be missing
        const hasPlanifiedHours = !needsPlanifiedHours || (planifiedHours !== undefined && planifiedHours > 0);
        const hasClassroom = !needsClassroom || selectedClassroomIds.length > 0;

        return hasPlanifiedHours && hasClassroom;
    }, [isPeriodicEvent, needsPlanifiedHours, needsClassroom, planifiedHours, selectedClassroomIds]);

    const handleApprove = () => {
        const finalPlanifiedHours = needsPlanifiedHours ? planifiedHours : undefined;
        const finalClassroomIds = needsClassroom ? selectedClassroomIds : [];

        onApprove(finalPlanifiedHours, finalClassroomIds);
    };

    const getFrequencyLabel = (frequency: string) => {
        switch (frequency) {
            case 'no-repeat': return 'No se repite (Puntual)';
            case 'weekly': return 'Semanalmente';
            case 'biweekly-even': return 'Quincenal (Semanas pares)';
            case 'biweekly-odd': return 'Quincenal (Semanas impares)';
            case 'custom': return 'Personalizado';
            default: return frequency;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col max-h-[90vh] p-0">
                <DialogHeader className="px-6 pt-6 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent rounded-lg">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-lg font-semibold">Aprobar solicitud</DialogTitle>
                    </div>
                    <DialogDescription className="hidden">
                        Diálogo para aprobar una solicitud de evento
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 px-6 py-3">
                    {solicitud ? (
                        <div className="space-y-3">
                            {/* Tipo de solicitud badge */}
                            <div className="flex items-center gap-2">
                                <Badge variant={requestType === 'CANCEL' ? 'destructive' : 'secondary'} className="text-xs">
                                    {REQUEST_TYPE_LABELS[requestType] || requestType}
                                </Badge>
                                {eventDataEventType !== 'NORMAL' && (
                                    <Badge variant="outline" className="text-xs">
                                        {EVENT_TYPE_LABELS[eventDataEventType] || eventDataEventType}
                                    </Badge>
                                )}
                            </div>

                            {/* Info básica de la solicitud */}
                            <div className="grid grid-cols-2 gap-3 p-3 bg-accent/20 rounded border border-primary/20">
                                <div>
                                    <Label className="text-xs font-semibold">Profesor</Label>
                                    <p className="text-xs mt-1">{solicitud.professorId}</p>
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold">Fecha de solicitud</Label>
                                    <p className="text-xs mt-1">{moment(solicitud.createdAt).format('DD/MM/YYYY HH:mm')}</p>
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold">Tipo de evento</Label>
                                    <p className="text-xs mt-1">{solicitud.eventType === 'PUNTUAL' ? 'Puntual' : 'Periódico'}</p>
                                </div>
                                <div>
                                    <Label className="text-xs font-semibold">Frecuencia</Label>
                                    <p className="text-xs mt-1">{getFrequencyLabel(solicitud.eventData.frequency || 'no-repeat')}</p>
                                </div>
                                {solicitud.eventData.groupIds && solicitud.eventData.groupIds.length > 0 && (
                                    <div className="col-span-2">
                                        <Label className="text-xs font-semibold">Grupos</Label>
                                        <p className="text-xs mt-1">{solicitud.eventData.groupIds.join(', ')}</p>
                                    </div>
                                )}
                            </div>

                            {/* Horario */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Horario</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="h-8 px-3 border rounded flex items-center text-xs">
                                        {solicitud.eventData.startTime}
                                    </div>
                                    <div className="h-8 px-3 border rounded flex items-center text-xs">
                                        {solicitud.eventData.endTime}
                                    </div>
                                </div>
                            </div>

                            {/* Días de la semana (para eventos periódicos) */}
                            {isPeriodicEvent && solicitud.eventData.weekDays && (
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Días de la semana</Label>
                                    <div className="h-8 px-3 border rounded flex items-center text-xs">
                                        {solicitud.eventData.weekDays.join(', ')}
                                    </div>
                                </div>
                            )}

                            {/* Fecha (para eventos puntuales) */}
                            {!isPeriodicEvent && solicitud.eventData.eventDate && (
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Fecha</Label>
                                    <div className="h-8 px-3 border rounded flex items-center text-xs">
                                        {moment(solicitud.eventData.eventDate).format('DD/MM/YYYY')}
                                    </div>
                                </div>
                            )}

                            {/* Comentario */}
                            {solicitud.eventData.comment && (
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Comentario</Label>
                                    <div className="min-h-8 px-3 py-2 border rounded text-xs text-muted-foreground">
                                        {solicitud.eventData.comment}
                                    </div>
                                </div>
                            )}

                            {/* Nueva fecha (para solicitudes de reemplazo) */}
                            {requestType === 'REPLACE' && solicitud.eventData.newEventDate && (
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Nueva fecha</Label>
                                    <div className="h-8 px-3 border rounded flex items-center text-xs">
                                        {moment(solicitud.eventData.newEventDate).format('DD/MM/YYYY')}
                                    </div>
                                </div>
                            )}

                            {/* ID del evento original (para EDIT/CANCEL/REPLACE) */}
                            {!isCreateRequest && solicitud.originalEventId && (
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Evento original</Label>
                                    <div className="h-8 px-3 border rounded flex items-center text-xs text-muted-foreground">
                                        {solicitud.originalEventId}
                                    </div>
                                </div>
                            )}

                            {/* Horas planificadas - Solo para eventos periódicos NORMAL en CREATE */}
                            {isPeriodicEvent && needsPlanifiedHours && (
                                <div className="space-y-1">
                                    <Label htmlFor="planified-hours" className="text-xs font-semibold">
                                        Horas Planificadas <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="planified-hours"
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={planifiedHours || ''}
                                        onChange={(e) => setPlanifiedHours(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        placeholder="Ej: 30"
                                        className="h-8 text-xs"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        El profesor no especificó las horas planificadas
                                    </p>
                                </div>
                            )}

                            {isPeriodicEvent && !needsPlanifiedHours && (
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Horas Planificadas</Label>
                                    <div className="h-8 px-3 border rounded flex items-center text-xs">
                                        {solicitud.eventData.planifiedHours}
                                    </div>
                                </div>
                            )}

                            {/* Selección de aula - Siempre editable en modo revisión */}
                            {isCreateRequest && (
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">
                                        Aula{needsClassroom && <span className="text-destructive ml-1">*</span>}
                                    </Label>
                                    {classrooms.length === 0 ? (
                                        <div className="h-8 text-xs flex items-center text-muted-foreground border rounded px-3">
                                            Cargando aulas...
                                        </div>
                                    ) : isSpecialEvent || isReviewOrEval ? (
                                        // MultiSelect para eventos especiales (BLOCKER, REVISION, EVALUACION)
                                        <MultiSelect
                                            options={classrooms.sort((a, b) => a.code.localeCompare(b.code)).map((classroom) => ({
                                                value: classroom.id,
                                                label: classroom.code
                                            }))}
                                            values={selectedClassroomIds}
                                            onValuesChange={setSelectedClassroomIds}
                                            placeholder="Seleccionar aulas"
                                        />
                                    ) : classrooms.length > 8 ? (
                                        <SearchableSelect
                                            value={selectedClassroomIds[0] || ''}
                                            onValueChange={(value) => {
                                                setSelectedClassroomIds(value ? [value] : []);
                                            }}
                                            options={classrooms.sort((a, b) => a.code.localeCompare(b.code)).map((classroom) => ({
                                                value: classroom.id,
                                                label: classroom.code
                                            }))}
                                            placeholder="Seleccionar aula"
                                            searchPlaceholder="Buscar aula..."
                                            emptyMessage="No se encontraron aulas."
                                        />
                                    ) : (
                                        <Select
                                            value={selectedClassroomIds[0] || ''}
                                            onValueChange={(value) => {
                                                setSelectedClassroomIds(value ? [value] : []);
                                            }}
                                        >
                                            <SelectTrigger className="h-8 text-xs w-full">
                                                <SelectValue placeholder="Seleccionar aula" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classrooms.sort((a, b) => a.code.localeCompare(b.code)).map((classroom) => (
                                                    <SelectItem key={classroom.id} value={classroom.id}>
                                                        {classroom.code}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {needsClassroom && (
                                        <p className="text-xs text-muted-foreground">
                                            El profesor no especificó un aula
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
                            Cargando información de la solicitud...
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex gap-2 justify-end px-6 pb-6 border-t pt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="h-8 text-xs"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleApprove}
                        disabled={!canApprove || isSubmitting}
                        className="h-8 text-xs"
                    >
                        {isSubmitting ? 'Aprobando...' : 'Aprobar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ApproveRequestDialog;
