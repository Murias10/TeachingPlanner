"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { Edit as EditIcon, ChevronDownIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { useClassrooms } from '@/hooks/classroom/useClassrooms';
import { useSubjectsByDegreeId } from '@/hooks/subject/useSubjectsByDegreeId';
import { useSubjectsWithEventsAndGroupsByCourseAndSemester } from '@/hooks/subject/useSubjectsWithEventsAndGroupsByCourseIdAndSemester';
import { EVENT_CHARACTERS } from '@/constants/eventCharacters';
import { getCharacterDescription } from '@/utils/eventCharacterUtils';
import { getMonthlyPatternLabels } from '@/utils/customPatternCalculator';

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (eventId: string, config: RecurrenceConfig) => void;
  event: CalendarEvent | null;
  degreeId?: string;
  courseId?: string;
  semester?: number;
  lectiveDates?: Set<string>;
}

const EditEventDialog: React.FC<EditEventDialogProps> = ({ open, onOpenChange, onSave, event, degreeId, courseId, semester, lectiveDates = new Set() }) => {
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

  const [eventType, setEventType] = useState<string>('T');
  const [openStartTime, setOpenStartTime] = useState(false);
  const [openEndTime, setOpenEndTime] = useState(false);
  const [allowEditPlanifiedHours, setAllowEditPlanifiedHours] = useState(false);
  const [initialGroupHours, setInitialGroupHours] = useState<number>(0); // Store initial hours from selected group
  const [initialConfig, setInitialConfig] = useState<RecurrenceConfig | null>(null); // Store initial config to detect changes

  const previousEventTypeRef = React.useRef<string>('T');

  // Actualizar config cuando cambie el evento
  useEffect(() => {
    if (event) {
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

      setConfig(newConfig);
      setInitialConfig(newConfig); // Save initial config for comparison

      // Initialize planified hours state for periodic events
      if (event.type === 'periodic' && planifiedHours > 0) {
        setInitialGroupHours(planifiedHours);
        setAllowEditPlanifiedHours(false);
      }

      // Set event type from first group
      if (event.groups.length > 0) {
        const newEventType = event.groups[0].type;
        setEventType(newEventType);
        previousEventTypeRef.current = newEventType;
      }
    }
  }, [event]);

  // Clear group and classroom selections when event type changes (only if user manually changed it)
  React.useEffect(() => {
    // Only clear if the event type actually changed AND it's different from the previous value
    if (eventType !== previousEventTypeRef.current) {
      setConfig(prev => ({
        ...prev,
        groupIds: [],
        classroomIds: []
      }));
      previousEventTypeRef.current = eventType;
    }
  }, [eventType]);

  // Clear group selection when subject changes
  const previousSubjectIdRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
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
  }, [config.subjectId]);

  const { data: classrooms = [] } = useClassrooms();
  const { data: subjects = [], isLoading: isLoadingSubjects } = useSubjectsByDegreeId(degreeId || null);

  // Get all subjects with their groups using the same hook as GroupPage
  const { data: subjectsWithGroups = [] } = useSubjectsWithEventsAndGroupsByCourseAndSemester(courseId || null, semester || null);

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

  // Filter subjects by semester
  const filteredSubjects = useMemo(() => {
    if (!semester) return subjects;
    return subjects.filter(subject => subject.semester === semester);
  }, [subjects, semester]);

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

  // Extract groups from subjects with groups for the selected subject and filter by event type
  const availableGroups = useMemo(() => {
    if (!config.subjectId) return [];

    // Find the selected subject in subjectsWithGroups
    const selectedSubject = subjectsWithGroups.find(s => s.id === config.subjectId);

    if (!selectedSubject || !selectedSubject.groups) {
      // If subjectsWithGroups is not loaded yet, use the groups from the event
      if (event && event.subject?.id === config.subjectId) {
        return event.groups.filter(group => group.type === eventType);
      }
      return [];
    }

    // Filter groups by event type
    const filtered = selectedSubject.groups.filter(group => group.type === eventType);

    // If the filtered list doesn't include the selected group from the event,
    // add it to ensure it's available for selection
    if (event && event.groups.length > 0 && config.groupIds && config.groupIds.length > 0) {
      const selectedGroupId = config.groupIds[0];
      const isGroupInList = filtered.some(g => g.id === selectedGroupId);
      if (!isGroupInList) {
        const eventGroup = event.groups.find(g => g.id === selectedGroupId);
        if (eventGroup) {
          return [...filtered, eventGroup];
        }
      }
    }

    return filtered;
  }, [config.subjectId, subjectsWithGroups, eventType, event, config.groupIds]);

  // Validate that all required fields are filled
  const isFormValid = useMemo(() => {
    const baseValid = (
      config.subjectId &&
      config.groupIds &&
      config.groupIds.length > 0 &&
      config.classroomIds &&
      config.classroomIds.length > 0 &&
      eventType
    );

    if (!baseValid) return false;

    // Additional validation based on frequency
    if (config.frequency === 'no-repeat') {
      return !!config.eventDate;
    }

    if (config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd') {
      return config.weekDays && config.weekDays.length > 0 && config.planifiedHours > 0;
    }

    if (config.frequency === 'custom') {
      // Custom patterns are read-only in edit mode, so just basic validation
      return true;
    }

    return true;
  }, [config.subjectId, config.groupIds, config.classroomIds, eventType, config.frequency, config.eventDate, config.weekDays, config.planifiedHours, config.customStartDate, config.customFrequencyUnit, config.interval]);

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
      config.subjectId !== initialConfig.subjectId ||
      !arraysEqual(config.groupIds || [], initialConfig.groupIds || []) ||
      !arraysEqual(config.classroomIds || [], initialConfig.classroomIds || []) ||
      !arraysEqual(config.weekDays || [], initialConfig.weekDays || []) ||
      (allowEditPlanifiedHours && config.planifiedHours !== initialConfig.planifiedHours) ||
      config.comment !== initialConfig.comment
    );
  }, [config, initialConfig, allowEditPlanifiedHours]);

  const weekDays: { value: WeekDay; label: string }[] = [
    { value: 'L', label: 'L' },
    { value: 'M', label: 'M' },
    { value: 'X', label: 'X' },
    { value: 'J', label: 'J' },
    { value: 'V', label: 'V' },
    { value: 'S', label: 'S' },
    { value: 'D', label: 'D' },
  ];

  const handleFrequencyChange = (value: FrequencyType) => {
    setConfig({ ...config, frequency: value });
  };

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
      onSave(event.id, config);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] p-0">
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
            {/* Frequency Selection */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Frecuencia</Label>
              <Select value={config.frequency} onValueChange={(value) => handleFrequencyChange(value as FrequencyType)} disabled>
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

            {/* Custom Pattern Info - Read-only display for custom periodic events */}
            {config.frequency === 'custom' && config.eventCharacter && (
              <div className="space-y-2 p-3 border border-blue-200 rounded bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold">
                    {config.eventCharacter}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                      Patrón Personalizado
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Este evento utiliza un patrón de recurrencia personalizado. No se puede editar la frecuencia.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Date, Start Time, End Time in same row */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {(config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd') ? 'Día y Horario' : config.frequency === 'custom' ? 'Fecha Inicio y Horario' : 'Fecha y Horario'}
              </Label>
              <div className="flex gap-2">
                {/* Date Selection - for no-repeat */}
                {config.frequency === 'no-repeat' && (
                  <Popover modal={true}>
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
                        onSelect={(date) => {
                          if (date) {
                            setConfig({ ...config, eventDate: format(date, 'yyyy-MM-dd') });
                          }
                        }}
                        locale={es}
                        disabled={(date) => !lectiveDates.has(format(date, 'yyyy-MM-dd'))}
                      />
                    </PopoverContent>
                  </Popover>
                )}

                {/* Weekday Selection - for weekly and biweekly */}
                {(config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd') && (
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
                {config.frequency === 'custom' && (
                  <Popover modal={true}>
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
                        onSelect={(date) => {
                          if (date) {
                            setConfig({ ...config, customStartDate: format(date, 'yyyy-MM-dd') });
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
                      {config.startTime}
                      <ChevronDownIcon className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <TimePicker
                      value={config.startTime}
                      onChange={(value) => {
                        setConfig({ ...config, startTime: value });
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
                      {config.endTime}
                      <ChevronDownIcon className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <TimePicker
                      value={config.endTime}
                      onChange={(value) => {
                        setConfig({ ...config, endTime: value });
                        setOpenEndTime(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Subject Selection - Always visible */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Asignatura</Label>
              {isLoadingSubjects ? (
                <div className="h-8 text-xs flex items-center text-muted-foreground">
                  Cargando asignaturas...
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="h-8 text-xs flex items-center text-muted-foreground">
                  No hay asignaturas disponibles
                </div>
              ) : filteredSubjects.length > 8 ? (
                <SearchableSelect
                  value={config.subjectId || ''}
                  onValueChange={(value) => setConfig({ ...config, subjectId: value })}
                  options={filteredSubjects.sort((a, b) => a.name.localeCompare(b.name)).map((subject) => ({
                    value: subject.id,
                    label: subject.name
                  }))}
                  placeholder="Seleccionar asignatura"
                  searchPlaceholder="Buscar asignatura..."
                  emptyMessage="No se encontraron asignaturas."
                />
              ) : (
                <Select value={config.subjectId || ''} onValueChange={(value) => setConfig({ ...config, subjectId: value })}>
                  <SelectTrigger className="h-8 text-xs w-full">
                    <SelectValue placeholder="Seleccionar asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubjects.sort((a, b) => a.name.localeCompare(b.name)).map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Event Type Selection - Always visible */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo de Evento</Label>
              <Select value={eventType} onValueChange={(value) => setEventType(value as 'T' | 'S' | 'L' | 'TG')}>
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue placeholder="Seleccionar tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="T">Teoría</SelectItem>
                  <SelectItem value="S">Seminario</SelectItem>
                  <SelectItem value="L">Laboratorio</SelectItem>
                  <SelectItem value="TG">Tutorías Grupales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Groups and Classrooms Selection - Same row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Groups Selection - Single select */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Grupo</Label>
                {!config.subjectId ? (
                  <div className="h-8 text-xs flex items-center text-muted-foreground border rounded px-3">
                    Selecciona una asignatura primero
                  </div>
                ) : availableGroups.length === 0 ? (
                  <div className="h-8 text-xs flex items-center text-muted-foreground border rounded px-3">
                    Sin grupos disponibles
                  </div>
                ) : availableGroups.length > 8 ? (
                  <SearchableSelect
                    value={config.groupIds?.[0] || ''}
                    onValueChange={(value) => {
                      setConfig({ ...config, groupIds: value ? [value] : [] });
                    }}
                    options={availableGroups.sort((a, b) => {
                      const langPrefixA = a.language === 'EN' ? 'I-' : '';
                      const langPrefixB = b.language === 'EN' ? 'I-' : '';
                      const subject = subjects.find(s => s.id === config.subjectId);
                      const labelA = `${subject?.acronym}.${a.type}.${langPrefixA}${a.number}`;
                      const labelB = `${subject?.acronym}.${b.type}.${langPrefixB}${b.number}`;
                      return labelA.localeCompare(labelB);
                    }).map((group) => {
                      const langPrefix = group.language === 'EN' ? 'I-' : '';
                      const subject = subjects.find(s => s.id === config.subjectId);
                      const groupLabel = `${subject?.acronym}.${group.type}.${langPrefix}${group.number}`;
                      return {
                        value: group.id,
                        label: groupLabel
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
                        const langPrefixA = a.language === 'EN' ? 'I-' : '';
                        const langPrefixB = b.language === 'EN' ? 'I-' : '';
                        const subject = subjects.find(s => s.id === config.subjectId);
                        const labelA = `${subject?.acronym}.${a.type}.${langPrefixA}${a.number}`;
                        const labelB = `${subject?.acronym}.${b.type}.${langPrefixB}${b.number}`;
                        return labelA.localeCompare(labelB);
                      }).map((group) => {
                        const langPrefix = group.language === 'EN' ? 'I-' : '';
                        const subject = subjects.find(s => s.id === config.subjectId);
                        const groupLabel = `${subject?.acronym}.${group.type}.${langPrefix}${group.number}`;
                        return (
                          <SelectItem key={group.id} value={group.id}>
                            {groupLabel}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Classrooms Selection - Single select */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Aula</Label>
                {availableClassrooms.length === 0 ? (
                  <div className="h-8 text-xs flex items-center text-muted-foreground border rounded px-3">
                    Cargando aulas...
                  </div>
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

            {/* Planified Hours - Only visible when frequency is periodic and group is selected */}
            {(config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd') && config.groupIds && config.groupIds.length > 0 && (
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

            {/* Custom Frequency Options - Only visible for custom frequency */}
            {config.frequency === 'custom' && (
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
                      <Popover>
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
                            onSelect={(date) => {
                              if (date) {
                                setConfig({ ...config, endsOnDate: format(date, 'yyyy-MM-dd') });
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
              <p className="text-muted-foreground text-xs mt-1">{config.startTime} - {config.endTime}</p>
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
