"use client"

import React, { useState, useMemo } from 'react';
import { Repeat, ChevronDownIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { TimePicker } from '@/components/ui/time-picker';
import { Textarea } from '@/components/ui/textarea';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import type { RecurrenceConfig, FrequencyType, WeekDay, EndsType } from '@/types/RecurrenceConfig';
import type { CalendarEvent } from '@/types/CalendarEvent';
import type { Group } from '@/types/Group';
import { useClassrooms } from '@/hooks/classroom/useClassrooms';
import { useSubjectsByDegreeId } from '@/hooks/subject/useSubjectsByDegreeId';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: RecurrenceConfig) => void;
  degreeId?: string;
  calendarEvents?: CalendarEvent[];
  initialDate?: string | null;
  initialStartTime?: string | null;
  initialEndTime?: string | null;
}

const CreateEventDialog: React.FC<CreateEventDialogProps> = ({ open, onOpenChange, onSave, degreeId, calendarEvents = [], initialDate, initialStartTime, initialEndTime }) => {
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
    subjectId: undefined,
    groupIds: [],
    classroomIds: [],
    comment: '',
  });

  const [showCustom, setShowCustom] = useState(false);
  const [eventType, setEventType] = useState<string>('T');
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
  }, [eventType]);

  const { data: classrooms = [] } = useClassrooms();
  const { data: subjects = [], isLoading: isLoadingSubjects } = useSubjectsByDegreeId(degreeId || null);

  // Extract groups from calendar events for the selected subject and filter by event type
  const availableGroups = useMemo(() => {
    if (!config.subjectId || !calendarEvents) return [];

    const groupsSet = new Set<string>();
    calendarEvents.forEach((event) => {
      if (event.subject?.id === config.subjectId && event.groups) {
        event.groups.forEach((group) => {
          // Only add groups that match the selected event type
          if (group.type === eventType) {
            groupsSet.add(JSON.stringify(group)); // Use stringify to create unique key
          }
        });
      }
    });

    return Array.from(groupsSet).map(g => JSON.parse(g) as Group);
  }, [config.subjectId, calendarEvents, eventType]);

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

    if (config.frequency === 'weekly') {
      return config.weekDays && config.weekDays.length > 0 && config.planifiedHours > 0;
    }

    return true;
  }, [config.subjectId, config.groupIds, config.classroomIds, eventType, config.frequency, config.eventDate, config.weekDays, config.planifiedHours]);

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
    setShowCustom(value === 'custom');
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

    let summary = '';
    if (config.frequency === 'custom' && config.interval > 0) {
      summary = `Cada ${config.interval > 1 ? config.interval : ''} `;
      if (showCustom) {
        summary += 'semana';
        if (config.weekDays.length > 0) {
          summary += ` los ${config.weekDays.join(', ')}`;
        }
      }
    }
    return summary || 'Personalizado';
  };

  const handleSave = () => {
    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-lg">
              <Repeat className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-semibold">Crear evento</DialogTitle>
          </div>
          <DialogDescription className="hidden">Diálogo para crear un nuevo evento en el calendario</DialogDescription>
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
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date, Start Time, End Time in same row */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                {config.frequency === 'weekly' ? 'Día y Horario' : 'Fecha y Horario'}
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
                      />
                    </PopoverContent>
                  </Popover>
                )}

                {/* Weekday Selection - for weekly */}
                {config.frequency === 'weekly' && (
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

            {/* Planified Hours - Only visible when frequency is 'weekly' */}
            {config.frequency === 'weekly' && (
              <div className="space-y-1">
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
                />
              </div>
            )}

            {/* Subject Selection - Always visible */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Asignatura</Label>
              {isLoadingSubjects ? (
                <div className="h-8 text-xs flex items-center text-muted-foreground">
                  Cargando asignaturas...
                </div>
              ) : subjects.length === 0 ? (
                <div className="h-8 text-xs flex items-center text-muted-foreground">
                  No hay asignaturas disponibles
                </div>
              ) : (
                <Select value={config.subjectId || ''} onValueChange={(value) => setConfig({ ...config, subjectId: value })}>
                  <SelectTrigger className="h-8 text-xs w-full">
                    <SelectValue placeholder="Seleccionar asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.sort((a, b) => a.name.localeCompare(b.name)).map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Groups and Classrooms Selection - Same row */}
            <div className="flex gap-2">
              {/* Groups Selection - Always visible */}
              <div className="space-y-1 flex-1">
                <Label className="text-xs font-semibold">Grupos</Label>
                <div className="relative">
                  <button
                    type="button"
                    className="h-8 px-3 text-xs w-full border border-input bg-background rounded-md flex items-center justify-between hover:bg-accent"
                    onClick={() => {
                      const dropdown = document.getElementById('groups-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                  >
                    <span>
                      {config.groupIds && config.groupIds.length > 0
                        ? `${config.groupIds.length} grupo(s) seleccionado(s)`
                        : 'Seleccionar grupos'}
                    </span>
                    <ChevronDownIcon className="w-3 h-3" />
                  </button>
                  <div
                    id="groups-dropdown"
                    className="hidden absolute top-full left-0 right-0 mt-1 bg-background border border-input rounded-md shadow-lg z-50"
                  >
                    <div className="space-y-1 max-h-40 overflow-y-auto p-2">
                      {config.subjectId ? (
                        availableGroups.length > 0 ? (
                          availableGroups.sort((a, b) => {
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
                              <div key={group.id} className="flex items-center gap-2">
                                <Checkbox
                                  id={`group-${group.id}`}
                                  checked={config.groupIds?.includes(group.id) || false}
                                  onCheckedChange={(checked) => {
                                    const newIds = checked
                                      ? [...(config.groupIds || []), group.id]
                                      : (config.groupIds || []).filter(id => id !== group.id);
                                    setConfig({ ...config, groupIds: newIds });
                                  }}
                                />
                                <Label htmlFor={`group-${group.id}`} className="text-xs cursor-pointer m-0 flex-1">
                                  {groupLabel}
                                </Label>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-muted-foreground">Sin grupos disponibles para esta asignatura</p>
                        )
                      ) : (
                        <p className="text-xs text-muted-foreground">Selecciona una asignatura primero</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Classrooms Selection - Always visible */}
              <div className="space-y-1 flex-1">
                <Label className="text-xs font-semibold">Aulas</Label>
                <div className="relative">
                  <button
                    type="button"
                    className="h-8 px-3 text-xs w-full border border-input bg-background rounded-md flex items-center justify-between hover:bg-accent"
                    onClick={() => {
                      const dropdown = document.getElementById('classrooms-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                  >
                    <span>
                      {config.classroomIds && config.classroomIds.length > 0
                        ? `${config.classroomIds.length} aula(s) seleccionada(s)`
                        : 'Seleccionar aulas'}
                    </span>
                    <ChevronDownIcon className="w-3 h-3" />
                  </button>
                  <div
                    id="classrooms-dropdown"
                    className="hidden absolute top-full left-0 right-0 mt-1 bg-background border border-input rounded-md shadow-lg z-50"
                  >
                    <div className="space-y-1 max-h-40 overflow-y-auto p-2">
                      {classrooms.length > 0 ? (
                        classrooms.sort((a, b) => a.code.localeCompare(b.code)).map((classroom) => (
                          <div key={classroom.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`classroom-${classroom.id}`}
                              checked={config.classroomIds?.includes(classroom.id) || false}
                              onCheckedChange={(checked) => {
                                const newIds = checked
                                  ? [...(config.classroomIds || []), classroom.id]
                                  : (config.classroomIds || []).filter(id => id !== classroom.id);
                                setConfig({ ...config, classroomIds: newIds });
                              }}
                            />
                            <Label htmlFor={`classroom-${classroom.id}`} className="text-xs cursor-pointer m-0 flex-1">
                              {classroom.code}
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">Cargando aulas...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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

            {/* Custom Options */}
            {showCustom && (
              <div className="space-y-3 p-3 border border-primary/20 rounded bg-accent/20">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Intervalo</Label>
                  <Input
                    type="number"
                    min="1"
                    value={config.interval}
                    onChange={(e) => setConfig({ ...config, interval: parseInt(e.target.value) || 1 })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Días</Label>
                  <div className="flex gap-1">
                    {weekDays.map((day) => (
                      <Button
                        key={day.value}
                        variant={config.weekDays.includes(day.value) ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 w-7 p-0 text-xs"
                        onClick={() => toggleWeekDay(day.value)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Finalización */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Finaliza</Label>
                  <RadioGroup
                    value={config.endsType}
                    onValueChange={(value: EndsType) => setConfig({ ...config, endsType: value })}
                    className="space-y-1"
                  >
                    <div className={`flex items-center space-x-2 p-2 rounded border transition-all cursor-pointer ${config.endsType === 'never' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-accent/20'
                      }`}>
                      <RadioGroupItem value="never" id="never" />
                      <Label htmlFor="never" className="text-xs cursor-pointer m-0">
                        Nunca
                      </Label>
                    </div>

                    <div className={`flex items-center space-x-2 p-2 rounded border transition-all cursor-pointer ${config.endsType === 'on' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-accent/20'
                      }`}>
                      <RadioGroupItem value="on" id="on" />
                      <Label htmlFor="on" className="text-xs cursor-pointer m-0">
                        El
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild disabled={config.endsType !== 'on'}>
                          <Button
                            variant="ghost"
                            className="h-6 px-2 text-xs flex-1 justify-between font-normal"
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
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className={`flex items-center space-x-2 p-2 rounded border transition-all cursor-pointer ${config.endsType === 'after' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-accent/20'
                      }`}>
                      <RadioGroupItem value="after" id="after" />
                      <Label htmlFor="after" className="text-xs cursor-pointer m-0">
                        Después de
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={config.endsAfterOccurrences}
                        onChange={(e) =>
                          setConfig({ ...config, endsAfterOccurrences: parseInt(e.target.value) || 1 })
                        }
                        disabled={config.endsType !== 'after'}
                        className="w-12 h-7 text-xs text-center"
                      />
                      <span className="text-xs">eventos</span>
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
            disabled={!isFormValid}
            className="h-8 text-xs"
          >
            Crear
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;
