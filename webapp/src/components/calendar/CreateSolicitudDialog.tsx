"use client"

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Repeat, ChevronDownIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RequiredLabel } from '@/components/ui/RequiredLabel';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { Textarea } from '@/components/ui/textarea';
import { es } from 'date-fns/locale';
import { format, getDay, parseISO } from 'date-fns';
import type { RecurrenceConfig, FrequencyType, WeekDay, EndsType, CustomFrequencyUnit, MonthlyPatternType } from '@/types/RecurrenceConfig';
import { useClassrooms } from '@/hooks/classroom/useClassrooms';
import { useSubjectsByCalendarId } from '@/hooks/subject/useSubjectsByCalendarId';
import { useSubjectsWithGroupsByCalendarId } from '@/hooks/subject/useSubjectsWithGroupsByCalendarId';
import { getMonthlyPatternLabels } from '@/utils/customPatternCalculator';
import { EVENT_TYPES, isSpecialEventType, isReviewOrEvalEventType, EVENT_TYPE_LABELS } from '@/constants/eventCharacters';
import { calculateDurationInMinutes, calculateNewEndTime } from '@/utils/timeUtils';

interface EventRequest {
  id: string;
  professorId: string;
  calendarId: string;
  eventType: 'PUNTUAL' | 'PERIODIC';
  requestType?: 'CREATE' | 'EDIT' | 'CANCEL' | 'REPLACE';
  originalEventId?: string | null;
  eventData: Record<string, any>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface CreateSolicitudDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (calendarId: string, eventType: string, config: RecurrenceConfig) => void;
  calendarId?: string;
  initialDate?: string | null;
  initialStartTime?: string | null;
  initialEndTime?: string | null;
  lectiveDates?: Set<string>;
  // Review mode props
  reviewingSolicitud?: EventRequest | null;
  onApproveReview?: (solicitudId: string, planifiedHours: number | undefined, classroomIds: string[]) => void;
  isSubmittingReview?: boolean;
}


const CreateSolicitudDialog: React.FC<CreateSolicitudDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  calendarId,
  initialDate,
  initialStartTime,
  initialEndTime,
  lectiveDates = new Set()
}) => {
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

  const [groupType, setGroupType] = useState<string>('T');
  const [selectedEventType, setSelectedEventType] = useState<string>(EVENT_TYPES.NORMAL);
  const [openEventDate, setOpenEventDate] = useState(false);
  const [openCustomStartDate, setOpenCustomStartDate] = useState(false);
  const [openEndsOnDate, setOpenEndsOnDate] = useState(false);
  const [openStartTime, setOpenStartTime] = useState(false);
  const [openEndTime, setOpenEndTime] = useState(false);

  // Actualizar config cuando cambien los props iniciales
  React.useEffect(() => {
    const newConfig: RecurrenceConfig = {
      frequency: 'no-repeat',
      interval: 1,
      weekDays: [],
      endsType: 'never',
      endsOnDate: '',
      endsAfterOccurrences: 1,
      startTime: initialStartTime || '09:00',
      endTime: initialEndTime || '10:00',
      planifiedHours: 0,
      eventDate: initialDate || format(new Date(), 'yyyy-MM-dd'),
      customStartDate: initialDate || format(new Date(), 'yyyy-MM-dd'),
      customFrequencyUnit: 'week',
      monthlyPatternType: 'day-of-month',
      subjectId: undefined,
      groupIds: [],
      classroomIds: [],
      comment: '',
    };
    setConfig(newConfig);
  }, [initialDate, initialStartTime, initialEndTime]);

  // Clear group and classroom selections when event type changes
  React.useEffect(() => {
    setConfig(prev => ({
      ...prev,
      groupIds: [],
      classroomIds: []
    }));
  }, [selectedEventType]);

  // Clear group and classroom selections when subject changes
  React.useEffect(() => {
    setConfig(prev => ({
      ...prev,
      groupIds: [],
      classroomIds: []
    }));
  }, [config.subjectId]);

  // Hooks must be declared before effects that use them
  const { data: classrooms = [] } = useClassrooms();
  const { data: subjects = [], isLoading: isLoadingSubjects } = useSubjectsByCalendarId(calendarId || null);
  const { data: subjectsWithGroups = [] } = useSubjectsWithGroupsByCalendarId(calendarId || null);

  // Auto-complete planified hours from selected group (like CreateEventDialog)
  React.useEffect(() => {
    if (config.groupIds && config.groupIds.length > 0 &&
        (config.frequency === 'weekly' || config.frequency === 'biweekly-even' ||
         config.frequency === 'biweekly-odd' || config.frequency === 'custom')) {
      const selectedGroupId = config.groupIds[0];
      const selectedSubject = subjectsWithGroups.find(s => s.id === config.subjectId);
      const selectedGroup = selectedSubject?.groups?.find(g => g.id === selectedGroupId);

      if (selectedGroup) {
        const groupHours = selectedGroup.planifiedHours || 0;
        setConfig(prev => ({
          ...prev,
          planifiedHours: groupHours
        }));
      }
    } else {
      // Reset planified hours when group is deselected
      setConfig(prev => ({
        ...prev,
        planifiedHours: 0
      }));
    }
  }, [config.groupIds, config.subjectId, config.frequency, subjectsWithGroups]);

  // Pre-select weekday when frequency is 'weekly' and initialDate is provided
  React.useEffect(() => {
    if ((config.frequency === 'weekly' || config.frequency === 'biweekly-even' ||
         config.frequency === 'biweekly-odd') && initialDate &&
         (!config.weekDays || config.weekDays.length === 0)) {
      try {
        const date = parseISO(initialDate);
        const dayOfWeek = getDay(date); // 0=Sunday, 1=Monday, 2=Tuesday, etc.

        // Map day number to WeekDay character
        const dayMap: { [key: number]: WeekDay } = {
          1: 'L', // Monday
          2: 'M', // Tuesday
          3: 'X', // Wednesday
          4: 'J', // Thursday
          5: 'V', // Friday
        };

        const selectedDay = dayMap[dayOfWeek];
        if (selectedDay) {
          setConfig(prev => ({
            ...prev,
            weekDays: [selectedDay]
          }));
        }
      } catch (error) {
        console.error('Error parsing initial date:', error);
      }
    }
  }, [config.frequency, initialDate]);

  // No need to filter subjects by semester anymore since they come from calendar
  const filteredSubjects = subjects;

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

  const isReviewOrEval = isReviewOrEvalEventType(selectedEventType);

  // Extract groups from subjects with groups for the selected subject and filter by group type
  const availableGroups = useMemo(() => {
    if (!config.subjectId) return [];

    const selectedSubject = subjectsWithGroups.find(s => s.id === config.subjectId);
    if (!selectedSubject || !selectedSubject.groups) return [];

    // For review/eval types, show all group types; otherwise filter by groupType
    return isReviewOrEval
      ? selectedSubject.groups
      : selectedSubject.groups.filter(group => group.type === groupType);
  }, [config.subjectId, subjectsWithGroups, groupType, isReviewOrEval]);

  // Validate that all required fields are filled
  // NOTE: planifiedHours and classroomIds are now optional - admin will complete them
  const isFormValid = useMemo(() => {
    const baseValid = (
      config.subjectId &&
      config.groupIds &&
      config.groupIds.length > 0 &&
      groupType &&
      selectedEventType
    );

    if (!baseValid) return false;

    // Additional validation based on frequency
    if (config.frequency === 'no-repeat') {
      return !!config.eventDate;
    }

    if (config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd') {
      return config.weekDays && config.weekDays.length > 0;
    }

    if (config.frequency === 'custom') {
      return !!config.customStartDate && !!config.customFrequencyUnit && config.interval > 0 && config.weekDays && config.weekDays.length > 0;
    }

    return true;
  }, [config.subjectId, config.groupIds, groupType, selectedEventType, config.frequency, config.eventDate, config.weekDays, config.customStartDate, config.customFrequencyUnit, config.interval]);

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

    if (config.frequency === 'custom' && config.interval > 0 && config.customFrequencyUnit) {
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
  };

  const handleSave = () => {
    if (calendarId) {
      onSave(calendarId, groupType, { ...config, eventType: selectedEventType });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-lg">
              <Repeat className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-semibold">Solicitar evento</DialogTitle>
          </div>
          <DialogDescription className="hidden">Diálogo para solicitar un nuevo evento en el calendario</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-3">
          <div className="space-y-3">
            {/* Frequency Selection */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Frecuencia</Label>
              <Select value={config.frequency} onValueChange={(value) => handleFrequencyChange(value as FrequencyType)}>
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
                {config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd' ? 'Día y Horario' : config.frequency === 'custom' ? 'Fecha Inicio y Horario' : 'Fecha y Horario'}
              </RequiredLabel>
              <div className="flex gap-2">
                {/* Date Selection - for no-repeat */}
                {config.frequency === 'no-repeat' && (
                  <Popover modal={true} open={openEventDate} onOpenChange={setOpenEventDate}>
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
                  <Popover modal={true} open={openCustomStartDate} onOpenChange={setOpenCustomStartDate}>
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
                      {config.startTime}
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
                      {config.endTime}
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
              <RequiredLabel required className="text-xs font-semibold">Asignatura</RequiredLabel>
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

            {/* Tipo de Evento y Tipo de Grupo en la misma fila */}
            {config.subjectId && (
            <div className="flex gap-2">
              {/* Tipo de Evento */}
              <div className="space-y-1 flex-1">
                <RequiredLabel required className="text-xs font-semibold">Tipo de Evento</RequiredLabel>
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

              {/* Tipo de Grupo (T/S/L/TG) — siempre visible cuando hay asignatura */}
              <div className="space-y-1 flex-1">
                <RequiredLabel required className="text-xs font-semibold">Tipo de Grupo</RequiredLabel>
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
            </div>
            )}

            {/* Groups and Classrooms Selection - Same row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Groups Selection — MultiSelect for review/eval, single select otherwise */}
              <div className="space-y-1">
                <RequiredLabel required className="text-xs font-semibold">{isReviewOrEval ? 'Grupos' : 'Grupo'}</RequiredLabel>
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
                      const subject = subjects.find(s => s.id === config.subjectId);
                      const labelA = `${subject?.acronym}.${a.type}.${a.language === 'EN' ? 'I-' : ''}${a.number}`;
                      const labelB = `${subject?.acronym}.${b.type}.${b.language === 'EN' ? 'I-' : ''}${b.number}`;
                      return labelA.localeCompare(labelB);
                    }).map((group) => {
                      const subject = subjects.find(s => s.id === config.subjectId);
                      return {
                        value: group.id,
                        label: `${subject?.acronym}.${group.type}.${group.language === 'EN' ? 'I-' : ''}${group.number}`
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
                      const subject = subjects.find(s => s.id === config.subjectId);
                      const labelA = `${subject?.acronym}.${a.type}.${a.language === 'EN' ? 'I-' : ''}${a.number}`;
                      const labelB = `${subject?.acronym}.${b.type}.${b.language === 'EN' ? 'I-' : ''}${b.number}`;
                      return labelA.localeCompare(labelB);
                    }).map((group) => {
                      const subject = subjects.find(s => s.id === config.subjectId);
                      return {
                        value: group.id,
                        label: `${subject?.acronym}.${group.type}.${group.language === 'EN' ? 'I-' : ''}${group.number}`
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
                        const subject = subjects.find(s => s.id === config.subjectId);
                        const labelA = `${subject?.acronym}.${a.type}.${a.language === 'EN' ? 'I-' : ''}${a.number}`;
                        const labelB = `${subject?.acronym}.${b.type}.${b.language === 'EN' ? 'I-' : ''}${b.number}`;
                        return labelA.localeCompare(labelB);
                      }).map((group) => {
                        const subject = subjects.find(s => s.id === config.subjectId);
                        return (
                          <SelectItem key={group.id} value={group.id}>
                            {`${subject?.acronym}.${group.type}.${group.language === 'EN' ? 'I-' : ''}${group.number}`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Classrooms Selection — MultiSelect for special types, single select for NORMAL */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">{isSpecialEventType(selectedEventType) ? 'Aulas (opcional)' : 'Aula (opcional)'}</Label>
                {classrooms.length === 0 ? (
                  <div className="h-8 text-xs flex items-center text-muted-foreground border rounded px-3">
                    Cargando aulas...
                  </div>
                ) : isSpecialEventType(selectedEventType) ? (
                  <MultiSelect
                    values={config.classroomIds || []}
                    onValuesChange={(values) => setConfig({ ...config, classroomIds: values })}
                    options={classrooms.sort((a, b) => a.code.localeCompare(b.code)).map((classroom) => ({
                      value: classroom.id,
                      label: classroom.code
                    }))}
                    placeholder="Seleccionar aulas"
                    searchPlaceholder="Buscar aula..."
                    emptyMessage="No se encontraron aulas."
                  />
                ) : classrooms.length > 8 ? (
                  <SearchableSelect
                    value={config.classroomIds?.[0] || ''}
                    onValueChange={(value) => {
                      setConfig({ ...config, classroomIds: value ? [value] : [] });
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
                    value={config.classroomIds?.[0] || ''}
                    onValueChange={(value) => {
                      setConfig({ ...config, classroomIds: value ? [value] : [] });
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
              </div>
            </div>

            {/* Planified Hours - Read-only display for professor, only when group is selected */}
            {!isSpecialEventType(selectedEventType) && (config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd' || config.frequency === 'custom') && config.groupIds && config.groupIds.length > 0 && (
              <div className="space-y-1">
                <Label htmlFor="planified-hours" className="text-xs font-semibold">Horas Planificadas</Label>
                <Input
                  id="planified-hours"
                  type="text"
                  value={config.planifiedHours > 0 ? `${config.planifiedHours} horas` : 'Sin horas planificadas'}
                  disabled
                  className="h-8 text-xs disabled:opacity-70 disabled:cursor-not-allowed"
                />
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
                <Label htmlFor="comment" className="text-xs font-semibold">Comentario (opcional)</Label>
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
            disabled={!isFormValid}
            className="h-8 text-xs"
          >
            Solicitar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSolicitudDialog;