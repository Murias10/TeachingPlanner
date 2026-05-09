"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit as EditIcon, ChevronDownIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RequiredLabel } from '@/components/ui/RequiredLabel';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { Textarea } from '@/components/ui/textarea';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import type { RecurrenceConfig, FrequencyType, WeekDay, EndsType, CustomFrequencyUnit, MonthlyPatternType } from '@/types/RecurrenceConfig';
import type { CalendarEvent } from '@/types/CalendarEvent';
import type { Group } from '@/types/Group';
import { useClassrooms } from '@/hooks/classroom/useClassrooms';
import { useSubjectsWithGroupsByCalendarId } from '@/hooks/subject/useSubjectsWithGroupsByCalendarId';
import { EVENT_CHARACTERS, EVENT_TYPES, isCustomEventCharacter, isSpecialEventType, isReviewOrEvalEventType, EVENT_TYPE_LABELS } from '@/constants/eventCharacters';
import { getCharacterDescription } from '@/utils/eventCharacterUtils';
import { getMonthlyPatternLabels } from '@/utils/customPatternCalculator';
import { calculateDurationInMinutes, calculateNewEndTime } from '@/utils/timeUtils';

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (eventId: string, config: RecurrenceConfig) => void;
  event: CalendarEvent | null;
  calendarId?: string;
  lectiveDates?: Set<string>;
}

// Helper functions for time calculations
const formatTimeDisplay = (time: string): string => {
  // Si el tiempo viene con segundos (HH:mm:ss), solo mostrar HH:mm
  const parts = time.split(':');
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : time;
};


const EditEventDialog: React.FC<EditEventDialogProps> = ({ open, onOpenChange, onSave, event, calendarId, lectiveDates = new Set() }) => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<RecurrenceConfig>({
    frequency: 'no-repeat',
    interval: 1,
    weekDays: [],
    endsType: 'never',
    endsOnDate: '',
    endsAfterOccurrences: 1,
    startTime: '09:00',
    endTime: '10:00',
    planifiedHours: 0,
    eventDate: format(new Date(), 'yyyy-MM-dd'),
    customStartDate: format(new Date(), 'yyyy-MM-dd'),
    customFrequencyUnit: 'week',
    monthlyPatternType: 'day-of-month',
    subjectId: undefined,
    groupIds: [],
    classroomIds: [],
    comment: '',
  });

  const [selectedEventType, setSelectedEventType] = useState<string>(EVENT_TYPES.NORMAL);
  const [groupType, setGroupType] = useState<string>('T');
  const [openStartTime, setOpenStartTime] = useState(false);
  const [openEndTime, setOpenEndTime] = useState(false);
  const [openEventDate, setOpenEventDate] = useState(false);
  const [openCustomStartDate, setOpenCustomStartDate] = useState(false);
  const [openEndsOnDate, setOpenEndsOnDate] = useState(false);
  const [allowEditPlanifiedHours, setAllowEditPlanifiedHours] = useState(false);
  const [initialGroupHours, setInitialGroupHours] = useState<number>(0); // Store initial hours from selected group
  const [initialConfig, setInitialConfig] = useState<RecurrenceConfig | null>(null); // Store initial config to detect changes
  const [isInitializing, setIsInitializing] = useState(false); // Flag to prevent clearing during initialization

  const previousGroupTypeRef = React.useRef<string>('T');

  // Detectar si el evento es periódico personalizado (custom character que no es N, P, I, F)
  const isCustomPeriodicEvent = useMemo(() => {
    if (event?.type !== 'periodic') return false;
    return isCustomEventCharacter(event.eventCharacter);
  }, [event]);

  // Resetear estados cuando se cierra el diálogo
  useEffect(() => {
    if (!open) {
      setInitialConfig(null);
      setIsInitializing(false);
      setInitialGroupHours(0);
      setAllowEditPlanifiedHours(false);
      previousGroupTypeRef.current = 'T';
      previousSubjectIdRef.current = undefined;
      setSelectedEventType(EVENT_TYPES.NORMAL);
      setGroupType('T');
    }
  }, [open]);

  // Actualizar config cuando cambie el evento
  useEffect(() => {
    if (event && open) {
      // Marcar que estamos inicializando
      setIsInitializing(true);
      // Para eventos periódicos, usar las horas planificadas del grupo
      const planifiedHours = event.type === 'periodic' && event.groups.length > 0
        ? event.groups[0].planifiedHours || 0
        : 0;

      // Para eventos periódicos, extraer el día de la semana del evento
      let weekDays: WeekDay[] = [];
      if (event.type === 'periodic' && event.weekDay) {
        // El weekDay ya viene en formato de letra (L, M, X, J, V, S, D) desde la base de datos
        weekDays = [event.weekDay as WeekDay];
      }

      // Determinar la frecuencia basándose en el eventCharacter
      let frequency: FrequencyType = 'no-repeat';
      if (event.type === 'periodic') {
        if (event.eventCharacter === EVENT_CHARACTERS.NORMAL) {
          frequency = 'weekly';
        } else if (event.eventCharacter === EVENT_CHARACTERS.PAR) {
          frequency = 'biweekly-even';
        } else if (event.eventCharacter === EVENT_CHARACTERS.IMPAR) {
          frequency = 'biweekly-odd';
        } else if (event.eventCharacter) {
          // Cualquier otro carácter es personalizado
          frequency = 'custom';
        } else {
          // Fallback si no hay eventCharacter
          frequency = 'weekly';
        }
      }

      const newConfig: RecurrenceConfig = {
        frequency: frequency,
        interval: 1,
        weekDays: weekDays,
        endsType: 'never',
        endsOnDate: '',
        endsAfterOccurrences: 1,
        startTime: event.startTime,
        endTime: event.endTime,
        planifiedHours: planifiedHours,
        eventDate: event.date,
        customStartDate: event.date,
        customFrequencyUnit: 'week',
        monthlyPatternType: 'day-of-month',
        subjectId: event.subject?.id,
        groupIds: event.groups.map(g => g.id),
        classroomIds: event.classrooms.map(c => c.id),
        comment: event.comment || '',
        eventCharacter: event.eventCharacter,
      };

      // Set refs BEFORE any state updates to avoid race conditions
      if (event.groups.length > 0) {
        previousGroupTypeRef.current = event.groups[0].type;
      }
      // Also set the subject ref to prevent subject change detection
      previousSubjectIdRef.current = event.subject?.id;

      // Update all states - config and initialConfig should be set together
      setConfig(newConfig);
      setInitialConfig(newConfig); // Save initial config for comparison

      // Initialize planified hours state for periodic events
      if (event.type === 'periodic' && planifiedHours > 0) {
        setInitialGroupHours(planifiedHours);
        setAllowEditPlanifiedHours(false);
      }

      // Set selectedEventType from the event, groupType from first group
      setSelectedEventType(event.eventType || EVENT_TYPES.NORMAL);
      if (event.groups.length > 0) {
        setGroupType(event.groups[0].type);
      }

      // Marcar que terminamos de inicializar (después de un pequeño delay para asegurar que todos los estados se actualizaron)
      setTimeout(() => setIsInitializing(false), 0);
    }
  }, [event, open]);

  // Clear group and classroom selections when selectedEventType or groupType changes (only if user manually changed it)
  React.useEffect(() => {
    if (isInitializing) return;
    if (groupType !== previousGroupTypeRef.current) {
      setConfig(prev => ({
        ...prev,
        groupIds: [],
        classroomIds: []
      }));
      previousGroupTypeRef.current = groupType;
    }
  }, [groupType, selectedEventType, isInitializing]);

  // Clear group selection when subject changes
  const previousSubjectIdRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    // Don't clear groups during initialization
    if (isInitializing) {
      previousSubjectIdRef.current = config.subjectId;
      return;
    }

    // Skip the first run (when component mounts)
    if (previousSubjectIdRef.current === undefined) {
      previousSubjectIdRef.current = config.subjectId;
      return;
    }

    // Only clear groups if subject actually changed
    if (config.subjectId !== previousSubjectIdRef.current) {
      setConfig(prev => ({
        ...prev,
        groupIds: []
      }));
    }
    previousSubjectIdRef.current = config.subjectId;
  }, [config.subjectId, isInitializing]);

  const { data: classrooms = [] } = useClassrooms();
  const { data: subjectsWithGroups = [], isLoading: isLoadingSubjects } = useSubjectsWithGroupsByCalendarId(calendarId || null);

  // Ensure event classrooms are available in the list
  const availableClassrooms = useMemo(() => {
    if (!event || !event.classrooms.length) {
      return classrooms;
    }

    // Merge classrooms from the hook with classrooms from the event
    const mergedClassrooms = [...classrooms];

    event.classrooms.forEach(eventClassroom => {
      if (!classrooms.some(c => c.id === eventClassroom.id)) {
        mergedClassrooms.push(eventClassroom);
      }
    });

    return mergedClassrooms;
  }, [classrooms, event]);

  // Get current subject with fallback to event.subject
  const currentSubject = useMemo(() => {
    if (!config.subjectId) return null;

    // First try to find in subjectsWithGroups
    const found = subjectsWithGroups.find(s => s.id === config.subjectId);
    if (found) return found;

    // Fallback to event.subject if available
    if (event?.subject?.id === config.subjectId) {
      return event.subject;
    }

    return null;
  }, [config.subjectId, subjectsWithGroups, event]);

  // Calculate monthly pattern labels based on customStartDate
  const monthlyPatternLabels = useMemo(() => {
    if (!config.customStartDate) {
      return { dayOfMonth: '', dayOfWeek: '' };
    }
    try {
      const startDate = new Date(config.customStartDate);
      return getMonthlyPatternLabels(startDate);
    } catch {
      return { dayOfMonth: '', dayOfWeek: '' };
    }
  }, [config.customStartDate]);

  const isBlocker = !config.subjectId;
  const effectiveEventType = isBlocker ? EVENT_TYPES.BLOCKER : selectedEventType;
  const isReviewOrEval = isReviewOrEvalEventType(selectedEventType);

  // Extract groups from subjects with groups for the selected subject and filter by groupType
  const availableGroups = useMemo((): Group[] => {
    if (!config.subjectId || isBlocker) return [];

    const selectedSubject = subjectsWithGroups.find(s => s.id === config.subjectId);

    if (!selectedSubject || !selectedSubject.groups) {
      if (event && event.subject?.id === config.subjectId) {
        return groupType
          ? event.groups.filter(group => group.type === groupType)
          : event.groups;
      }
      return [];
    }

    const filtered: Group[] = groupType
      ? selectedSubject.groups.filter((group: Group) => group.type === groupType)
      : selectedSubject.groups;

    // If the filtered list doesn't include the selected group from the event,
    // add it to ensure it's available for selection
    if (event && event.groups.length > 0 && config.groupIds && config.groupIds.length > 0) {
      const missingGroups = config.groupIds
        .filter(id => !filtered.some(g => g.id === id))
        .map(id => event.groups.find(g => g.id === id))
        .filter((g): g is Group => !!g);
      if (missingGroups.length > 0) {
        return [...filtered, ...missingGroups];
      }
    }

    return filtered;
  }, [config.subjectId, subjectsWithGroups, isBlocker, groupType, event, config.groupIds]);

  const isFormValid = useMemo(() => {
    const hasClassrooms = config.classroomIds && config.classroomIds.length > 0;
    const isSpecial = isSpecialEventType(effectiveEventType);

    // Blocker: solo necesita aulas (y fecha/días según frecuencia)
    if (isBlocker) {
      if (!hasClassrooms) return false;
      if (config.frequency === 'no-repeat') return !!config.eventDate;
      if (config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd') {
        return !!(config.weekDays && config.weekDays.length > 0);
      }
      return true;
    }

    // Eventos con asignatura: requieren asignatura, grupo(s), aula(s)
    const baseValid = (
      config.subjectId &&
      config.groupIds &&
      config.groupIds.length > 0 &&
      hasClassrooms
    );

    if (!baseValid) return false;

    if (config.frequency === 'no-repeat') {
      return !!config.eventDate;
    }

    if (config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd') {
      return !!(config.weekDays && config.weekDays.length > 0) && (isSpecial || config.planifiedHours > 0);
    }

    return true;
  }, [effectiveEventType, isBlocker, config.subjectId, config.groupIds, config.classroomIds, config.frequency, config.eventDate, config.weekDays, config.planifiedHours]);

  // Detect if there are any changes from the initial config
  const hasChanges = useMemo(() => {
    if (!initialConfig) return false;

    // Helper function to compare arrays
    const arraysEqual = (a: any[], b: any[]) => {
      if (a.length !== b.length) return false;
      const sortedA = [...a].sort();
      const sortedB = [...b].sort();
      return sortedA.every((val, idx) => val === sortedB[idx]);
    };

    // Compare each field that can be edited
    return (
      config.startTime !== initialConfig.startTime ||
      config.endTime !== initialConfig.endTime ||
      config.eventDate !== initialConfig.eventDate ||
      config.subjectId !== initialConfig.subjectId ||
      !arraysEqual(config.groupIds || [], initialConfig.groupIds || []) ||
      !arraysEqual(config.classroomIds || [], initialConfig.classroomIds || []) ||
      !arraysEqual(config.weekDays || [], initialConfig.weekDays || []) ||
      (allowEditPlanifiedHours && config.planifiedHours !== initialConfig.planifiedHours) ||
      config.comment !== initialConfig.comment ||
      effectiveEventType !== (event?.eventType || EVENT_TYPES.NORMAL)
    );
  }, [config, initialConfig, allowEditPlanifiedHours, effectiveEventType, event]);

  const weekDays: { value: WeekDay; label: string }[] = [
    { value: 'L', label: 'L' },
    { value: 'M', label: 'M' },
    { value: 'X', label: 'X' },
    { value: 'J', label: 'J' },
    { value: 'V', label: 'V' },
    { value: 'S', label: 'S' },
    { value: 'D', label: 'D' },
  ];

  const toggleWeekDay = (day: WeekDay) => {
    setConfig({
      ...config,
      weekDays: config.weekDays.includes(day)
        ? config.weekDays.filter(d => d !== day)
        : [...config.weekDays, day],
    });
  };

  const getSummary = (): string => {
    if (config.frequency === 'no-repeat') return 'No se repite';
    if (config.frequency === 'weekly') return 'Semanalmente';
    if (config.frequency === 'biweekly-even') return 'Quincenal (Semanas Pares)';
    if (config.frequency === 'biweekly-odd') return 'Quincenal (Semanas Impares)';

    if (config.frequency === 'custom') {
      // Para eventos personalizados existentes, mostrar el carácter
      if (config.eventCharacter) {
        return getCharacterDescription(config.eventCharacter);
      }

      // Para eventos nuevos (no deberían llegar aquí en EditDialog)
      if (config.interval > 0 && config.customFrequencyUnit) {
        let unitLabel = '';
        if (config.customFrequencyUnit === 'day') {
          unitLabel = config.interval === 1 ? 'día' : 'días';
        } else if (config.customFrequencyUnit === 'week') {
          unitLabel = config.interval === 1 ? 'semana' : 'semanas';
        } else if (config.customFrequencyUnit === 'month') {
          unitLabel = config.interval === 1 ? 'mes' : 'meses';
        }

        let summary = `Cada ${config.interval} ${unitLabel}`;

        if (config.customFrequencyUnit === 'week' && config.weekDays.length > 0) {
          summary += ` los ${config.weekDays.join(', ')}`;
        }

        return summary;
      }

      return 'Personalizado';
    }

    return 'Personalizado';
  };

  const handleSave = () => {
    if (event) {
      onSave(event.id, { ...config, eventType: effectiveEventType });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] p-0" key={event?.id}>
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-lg">
              <EditIcon className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-semibold">Editar evento</DialogTitle>
          </div>
          <DialogDescription className="hidden">Diálogo para editar un evento del calendario</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-3">
          <div className="space-y-3">
            {/* Frequency Selection - Always visible */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Frecuencia</Label>
              <Select value={config.frequency} disabled>
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-repeat">No se repite</SelectItem>
                  <SelectItem value="weekly">Semanalmente</SelectItem>
                  <SelectItem value="biweekly-even">Quincenal (Semanas Pares)</SelectItem>
                  <SelectItem value="biweekly-odd">Quincenal (Semanas Impares)</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date, Start Time, End Time in same row */}
            <div className="space-y-1">
              <RequiredLabel required className="text-xs font-semibold">
                {isCustomPeriodicEvent ? 'Horario' : (config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd') ? 'Día y Horario' : config.frequency === 'custom' ? 'Fecha Inicio y Horario' : 'Fecha y Horario'}
              </RequiredLabel>
              <div className="flex gap-2">
                {/* Date Selection - for no-repeat */}
                {!isCustomPeriodicEvent && config.frequency === 'no-repeat' && (
                  <Popover open={openEventDate} onOpenChange={setOpenEventDate} modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-8 px-3 text-xs justify-between font-normal flex-1"
                      >
                        {config.eventDate && !isNaN(new Date(config.eventDate).getTime()) ? format(new Date(config.eventDate), 'dd/MM/yyyy', { locale: es }) : 'Fecha'}
                        <ChevronDownIcon className="w-3 h-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={config.eventDate && !isNaN(new Date(config.eventDate).getTime()) ? new Date(config.eventDate) : new Date()}
                        defaultMonth={config.eventDate && !isNaN(new Date(config.eventDate).getTime()) ? new Date(config.eventDate) : new Date()}
                        onSelect={(date) => {
                          if (date) {
                            setConfig({ ...config, eventDate: format(date, 'yyyy-MM-dd') });
                            setOpenEventDate(false);
                          }
                        }}
                        locale={es}
                        disabled={(date) => !lectiveDates.has(format(date, 'yyyy-MM-dd'))}
                      />
                    </PopoverContent>
                  </Popover>
                )}

                {/* Weekday Selection - for weekly and biweekly */}
                {!isCustomPeriodicEvent && (config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd') && (
                  <Select
                    value={config.weekDays[0] || ''}
                    onValueChange={(value) => setConfig({ ...config, weekDays: [value as WeekDay] })}
                  >
                    <SelectTrigger className="h-8 px-3 text-xs font-normal flex-1">
                      <SelectValue placeholder="Seleccionar día" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Lunes</SelectItem>
                      <SelectItem value="M">Martes</SelectItem>
                      <SelectItem value="X">Miércoles</SelectItem>
                      <SelectItem value="J">Jueves</SelectItem>
                      <SelectItem value="V">Viernes</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* Date Selection - for custom */}
                {!isCustomPeriodicEvent && config.frequency === 'custom' && (
                  <Popover open={openCustomStartDate} onOpenChange={setOpenCustomStartDate} modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-8 px-3 text-xs justify-between font-normal flex-1"
                      >
                        {config.customStartDate && !isNaN(new Date(config.customStartDate).getTime()) ? format(new Date(config.customStartDate), 'dd/MM/yyyy', { locale: es }) : 'Fecha'}
                        <ChevronDownIcon className="w-3 h-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={config.customStartDate && !isNaN(new Date(config.customStartDate).getTime()) ? new Date(config.customStartDate) : new Date()}
                        defaultMonth={config.customStartDate && !isNaN(new Date(config.customStartDate).getTime()) ? new Date(config.customStartDate) : new Date()}
                        onSelect={(date) => {
                          if (date) {
                            setConfig({ ...config, customStartDate: format(date, 'yyyy-MM-dd') });
                            setOpenCustomStartDate(false);
                          }
                        }}
                        locale={es}
                        disabled={(date) => !lectiveDates.has(format(date, 'yyyy-MM-dd'))}
                      />
                    </PopoverContent>
                  </Popover>
                )}

                {/* Start Time */}
                <Popover open={openStartTime} onOpenChange={setOpenStartTime} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 px-3 text-xs justify-between font-normal flex-1"
                    >
                      {formatTimeDisplay(config.startTime)}
                      <ChevronDownIcon className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <TimePicker
                      value={config.startTime}
                      onChange={(value) => {
                        // Calculate current duration
                        const duration = calculateDurationInMinutes(config.startTime, config.endTime);
                        // Calculate new end time maintaining the duration
                        const newEndTime = calculateNewEndTime(value, duration);
                        setConfig({ ...config, startTime: value, endTime: newEndTime });
                        setOpenStartTime(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-xs text-muted-foreground flex items-center">-</span>

                {/* End Time */}
                <Popover open={openEndTime} onOpenChange={setOpenEndTime} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 px-3 text-xs justify-between font-normal flex-1"
                    >
                      {formatTimeDisplay(config.endTime)}
                      <ChevronDownIcon className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <TimePicker
                      value={config.endTime}
                      onChange={(value) => {
                        setConfig({ ...config, endTime: value });
                      }}
                      onComplete={() => setOpenEndTime(false)}
                      minTime={config.startTime}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Subject Selection - Always visible */}
            <div className="space-y-1">
              <RequiredLabel required={!isBlocker} className="text-xs font-semibold">Asignatura</RequiredLabel>
              {isLoadingSubjects ? (
                <div className="h-8 text-xs flex items-center text-muted-foreground">
                  Cargando asignaturas...
                </div>
              ) : subjectsWithGroups.length === 0 ? (
                <div className="h-8 text-xs flex items-center text-muted-foreground">
                  No hay asignaturas disponibles
                </div>
              ) : (
                (() => {
                  const subjectOptions = subjectsWithGroups.sort((a, b) => a.name.localeCompare(b.name)).map((subject) => ({
                    value: subject.id,
                    label: subject.name
                  }));

                  return (
                    <SearchableSelect
                      value={config.subjectId || ''}
                      onValueChange={(value) => setConfig({ ...config, subjectId: value })}
                      options={subjectOptions}
                      placeholder="Seleccionar asignatura"
                      searchPlaceholder="Buscar asignatura..."
                      emptyMessage="No se encontraron asignaturas."
                    />
                  );
                })()
              )}
            </div>

            {/* Tipo de Evento y Tipo de Grupo en la misma fila */}
            {config.subjectId && (
            <div className="flex gap-2">
              {/* Tipo de Evento */}
              <div className="space-y-1 flex-1">
                <RequiredLabel required={!isBlocker} className="text-xs font-semibold">Tipo de Evento</RequiredLabel>
                <Select value={selectedEventType} onValueChange={(value) => setSelectedEventType(value)}>
                  <SelectTrigger className="h-8 text-xs w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(EVENT_TYPE_LABELS).filter(value => value !== EVENT_TYPES.BLOCKER).map(value => (
                      <SelectItem key={value} value={value}>{t(`filters.eventTypes.${value}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Grupo (T/S/L/TG) — oculto cuando no hay asignatura */}
              {!isBlocker && (
                <div className="space-y-1 flex-1">
                  <RequiredLabel required={!isBlocker} className="text-xs font-semibold">Tipo de Grupo</RequiredLabel>
                  <Select value={groupType} onValueChange={(value) => setGroupType(value)}>
                    <SelectTrigger className="h-8 text-xs w-full">
                      <SelectValue placeholder="Seleccionar tipo de grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T">Teoría</SelectItem>
                      <SelectItem value="S">Seminario</SelectItem>
                      <SelectItem value="L">Laboratorio</SelectItem>
                      <SelectItem value="TG">Tutorías Grupales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            )}

            {/* Groups and Classrooms Selection - Same row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Groups Selection — oculto para BLOCKER */}
              {!isBlocker && (
              <div className="space-y-1">
                <RequiredLabel required={!isBlocker} className="text-xs font-semibold">{isReviewOrEval ? 'Grupos' : 'Grupo'}</RequiredLabel>
                {!config.subjectId ? (
                  <div className="h-8 text-xs flex items-center text-muted-foreground border rounded px-3">
                    Selecciona una asignatura primero
                  </div>
                ) : availableGroups.length === 0 ? (
                  <div className="h-8 text-xs flex items-center text-muted-foreground border rounded px-3">
                    Sin grupos disponibles
                  </div>
                ) : isReviewOrEval ? (
                  <MultiSelect
                    values={config.groupIds || []}
                    onValuesChange={(values) => setConfig({ ...config, groupIds: values })}
                    options={availableGroups.sort((a, b) => {
                      const labelA = `${currentSubject?.acronym}.${a.type}.${a.language === 'EN' ? 'I-' : ''}${a.number}`;
                      const labelB = `${currentSubject?.acronym}.${b.type}.${b.language === 'EN' ? 'I-' : ''}${b.number}`;
                      return labelA.localeCompare(labelB);
                    }).map((group) => {
                      return {
                        value: group.id,
                        label: `${currentSubject?.acronym}.${group.type}.${group.language === 'EN' ? 'I-' : ''}${group.number}`
                      };
                    })}
                    placeholder="Seleccionar grupos"
                    searchPlaceholder="Buscar grupo..."
                    emptyMessage="No se encontraron grupos."
                  />
                ) : availableGroups.length > 8 ? (
                  <SearchableSelect
                    value={config.groupIds?.[0] || ''}
                    onValueChange={(value) => {
                      setConfig({ ...config, groupIds: value ? [value] : [] });
                    }}
                    options={availableGroups.sort((a, b) => {
                      const labelA = `${currentSubject?.acronym}.${a.type}.${a.language === 'EN' ? 'I-' : ''}${a.number}`;
                      const labelB = `${currentSubject?.acronym}.${b.type}.${b.language === 'EN' ? 'I-' : ''}${b.number}`;
                      return labelA.localeCompare(labelB);
                    }).map((group) => {
                      return {
                        value: group.id,
                        label: `${currentSubject?.acronym}.${group.type}.${group.language === 'EN' ? 'I-' : ''}${group.number}`
                      };
                    })}
                    placeholder="Seleccionar grupo"
                    searchPlaceholder="Buscar grupo..."
                    emptyMessage="No se encontraron grupos."
                  />
                ) : (
                  <Select
                    value={config.groupIds?.[0] || ''}
                    onValueChange={(value) => {
                      setConfig({ ...config, groupIds: value ? [value] : [] });
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs w-full">
                      <SelectValue placeholder="Seleccionar grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGroups.sort((a, b) => {
                        const labelA = `${currentSubject?.acronym}.${a.type}.${a.language === 'EN' ? 'I-' : ''}${a.number}`;
                        const labelB = `${currentSubject?.acronym}.${b.type}.${b.language === 'EN' ? 'I-' : ''}${b.number}`;
                        return labelA.localeCompare(labelB);
                      }).map((group) => {
                        return (
                          <SelectItem key={group.id} value={group.id}>
                            {`${currentSubject?.acronym}.${group.type}.${group.language === 'EN' ? 'I-' : ''}${group.number}`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>
              )}

              {/* Classrooms Selection - MultiSelect for special types, single select for NORMAL */}
              <div className={`space-y-1${isBlocker ? ' col-span-2' : ''}`}>
                <RequiredLabel required className="text-xs font-semibold">{isSpecialEventType(effectiveEventType) ? 'Aulas' : 'Aula'}</RequiredLabel>
                {availableClassrooms.length === 0 ? (
                  <div className="h-8 text-xs flex items-center text-muted-foreground border rounded px-3">
                    Cargando aulas...
                  </div>
                ) : isSpecialEventType(effectiveEventType) ? (
                  <MultiSelect
                    values={config.classroomIds || []}
                    onValuesChange={(values) => setConfig({ ...config, classroomIds: values })}
                    options={availableClassrooms.sort((a, b) => a.code.localeCompare(b.code)).map((classroom) => ({
                      value: classroom.id,
                      label: classroom.code
                    }))}
                    placeholder="Seleccionar aulas"
                    searchPlaceholder="Buscar aula..."
                    emptyMessage="No se encontraron aulas."
                  />
                ) : availableClassrooms.length > 8 ? (
                  <SearchableSelect
                    value={config.classroomIds?.[0] || ''}
                    onValueChange={(value) => {
                      setConfig({ ...config, classroomIds: value ? [value] : [] });
                    }}
                    options={availableClassrooms.sort((a, b) => a.code.localeCompare(b.code)).map((classroom) => ({
                      value: classroom.id,
                      label: classroom.code
                    }))}
                    placeholder="Seleccionar aula"
                    searchPlaceholder="Buscar aula..."
                    emptyMessage="No se encontraron aulas."
                  />
                ) : (
                  <Select
                    value={config.classroomIds?.[0] || ''}
                    onValueChange={(value) => {
                      setConfig({ ...config, classroomIds: value ? [value] : [] });
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs w-full">
                      <SelectValue placeholder="Seleccionar aula" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClassrooms.sort((a, b) => a.code.localeCompare(b.code)).map((classroom) => (
                        <SelectItem key={classroom.id} value={classroom.id}>
                          {classroom.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Planified Hours - Only visible for periodic NORMAL events with a group selected */}
            {!isSpecialEventType(effectiveEventType) && (config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd' || isCustomPeriodicEvent) && config.groupIds && config.groupIds.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="planified-hours" className="text-xs font-semibold">Horas Planificadas</Label>
                <Input
                  id="planified-hours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={config.planifiedHours || ''}
                  onChange={(e) => setConfig({ ...config, planifiedHours: parseFloat(e.target.value) || 0 })}
                  placeholder="Ej: 30"
                  className="h-8 text-xs"
                  disabled={initialGroupHours > 0 && !allowEditPlanifiedHours}
                  required={initialGroupHours === 0}
                />
                {initialGroupHours > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allow-edit-hours"
                      checked={allowEditPlanifiedHours}
                      onCheckedChange={(checked) => setAllowEditPlanifiedHours(!!checked)}
                      className="h-3.5 w-3.5"
                    />
                    <label
                      htmlFor="allow-edit-hours"
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      Modificar las horas planificadas puede afectar a todos los eventos de este grupo
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Custom Frequency Options - Only visible for custom frequency and NOT for custom periodic events in edit mode */}
            {config.frequency === 'custom' && !isCustomPeriodicEvent && (
              <div className="space-y-3 p-3 border border-primary/20 rounded bg-accent/20">
                {/* Frequency Unit Selection */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Repetir cada</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={config.interval}
                      onChange={(e) => setConfig({ ...config, interval: parseInt(e.target.value) || 1 })}
                      className="h-8 text-xs w-16"
                    />
                    <Select
                      value={config.customFrequencyUnit || 'week'}
                      onValueChange={(value) => setConfig({ ...config, customFrequencyUnit: value as CustomFrequencyUnit, weekDays: [] })}
                    >
                      <SelectTrigger className="h-8 px-3 text-xs font-normal flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">
                          {config.interval === 1 ? 'día' : 'días'}
                        </SelectItem>
                        <SelectItem value="week">
                          {config.interval === 1 ? 'semana' : 'semanas'}
                        </SelectItem>
                        <SelectItem value="month">
                          {config.interval === 1 ? 'mes' : 'meses'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Weekday Selection - Only for weekly custom frequency */}
                {config.customFrequencyUnit === 'week' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Días</Label>
                    <div className="grid grid-cols-5 gap-1">
                      {weekDays.filter(day => day.value !== 'S' && day.value !== 'D').map((day) => (
                        <Button
                          key={day.value}
                          variant={config.weekDays.includes(day.value) ? 'default' : 'outline'}
                          className="h-8 text-xs font-semibold flex-1"
                          onClick={() => toggleWeekDay(day.value)}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Month Pattern Selection - Only for monthly custom frequency */}
                {config.customFrequencyUnit === 'month' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Patrón Mensual</Label>
                    <Select
                      value={config.monthlyPatternType || 'day-of-month'}
                      onValueChange={(value: MonthlyPatternType) => setConfig({ ...config, monthlyPatternType: value })}
                    >
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder="Seleccionar patrón" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day-of-month">{monthlyPatternLabels.dayOfMonth}</SelectItem>
                        <SelectItem value="day-of-week">{monthlyPatternLabels.dayOfWeek}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Finalización */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Finaliza</Label>
                  <RadioGroup
                    value={config.endsType}
                    onValueChange={(value: EndsType) => setConfig({ ...config, endsType: value })}
                    className="space-y-2"
                  >
                    <div className={`flex items-center gap-2 p-2 rounded border transition-all cursor-pointer ${config.endsType === 'never' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-accent/20'
                      }`}>
                      <RadioGroupItem value="never" id="never" />
                      <Label htmlFor="never" className="text-xs cursor-pointer m-0 flex-1">
                        Nunca
                      </Label>
                    </div>

                    <div className={`flex items-center gap-2 p-2 rounded border transition-all cursor-pointer ${config.endsType === 'on' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-accent/20'
                      }`}>
                      <RadioGroupItem value="on" id="on" />
                      <Label htmlFor="on" className="text-xs cursor-pointer m-0">
                        El
                      </Label>
                      <Popover open={openEndsOnDate} onOpenChange={setOpenEndsOnDate}>
                        <PopoverTrigger asChild disabled={config.endsType !== 'on'}>
                          <Button
                            variant="ghost"
                            className="h-7 px-2 text-xs flex-1 justify-between font-normal"
                          >
                            {config.endsOnDate ? format(new Date(config.endsOnDate), 'dd/MM/yyyy', { locale: es }) : 'Seleccionar fecha'}
                            <ChevronDownIcon className="w-3 h-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={config.endsOnDate ? new Date(config.endsOnDate) : undefined}
                            defaultMonth={config.endsOnDate ? new Date(config.endsOnDate) : (config.customStartDate ? new Date(config.customStartDate) : new Date())}
                            onSelect={(date) => {
                              if (date) {
                                setConfig({ ...config, endsOnDate: format(date, 'yyyy-MM-dd') });
                                setOpenEndsOnDate(false);
                              }
                            }}
                            locale={es}
                            disabled={(date) => {
                              const startDate = config.customStartDate ? new Date(config.customStartDate) : new Date();
                              return date < startDate;
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className={`flex items-center gap-2 p-2 rounded border transition-all cursor-pointer ${config.endsType === 'after' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-accent/20'
                      }`}>
                      <RadioGroupItem value="after" id="after" />
                      <Label htmlFor="after" className="text-xs cursor-pointer m-0">
                        Después de
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        step="0.5"
                        value={config.endsAfterOccurrences}
                        onChange={(e) =>
                          setConfig({ ...config, endsAfterOccurrences: parseFloat(e.target.value) || 1 })
                        }
                        disabled={config.endsType !== 'after'}
                        className="h-7 text-xs text-center w-14"
                      />
                      <Label className="text-xs cursor-pointer m-0">horas</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Comment Field - Only visible when frequency is 'no-repeat' */}
            {config.frequency === 'no-repeat' && (
              <div className="space-y-1">
                <Label htmlFor="comment" className="text-xs font-semibold">Comentario</Label>
                <Textarea
                  id="comment"
                  placeholder="Añade un comentario sobre este evento..."
                  value={config.comment}
                  onChange={(e) => setConfig({ ...config, comment: e.target.value })}
                  className="h-20 text-xs resize-none"
                />
              </div>
            )}

            {/* Resumen */}
            <div className="bg-accent/20 border border-primary/20 rounded p-3 text-xs">
              <p className="font-semibold">{getSummary()}</p>
              <p className="text-muted-foreground text-xs mt-1">{formatTimeDisplay(config.startTime)} - {formatTimeDisplay(config.endTime)}</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-end px-6 pb-6 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid || !hasChanges}
            className="h-8 text-xs"
          >
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventDialog;
