"use client"

import React, { useState } from 'react';
import { Replace, ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { CalendarEvent } from '@/types/CalendarEvent';
import { useClassrooms } from '@/hooks/classroom/useClassrooms';

interface ReplaceEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: ReplaceEventConfig) => void;
  eventToReplace: CalendarEvent | null;
  lectiveDates?: Set<string>;
}

export interface ReplaceEventConfig {
  originalEventId: string;
  originalDate: string;
  originalStartTime: string;
  originalEndTime: string;
  newEventDate: string;
  newStartTime: string;
  newEndTime: string;
  subjectId: string;
  groupIds: string[];
  classroomIds: string[];
  comment: string;
}

// Helper functions for time calculations
const calculateDurationInMinutes = (startTime: string, endTime: string): number => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
};

const addMinutesToTime = (time: string, minutes: number): string => {
  const [hours, mins] = time.split(':').map(Number);
  let totalMinutes = hours * 60 + mins + minutes;

  // Clamp to valid range: 09:00 (540 min) to 21:00 (1260 min)
  totalMinutes = Math.max(540, Math.min(1260, totalMinutes));

  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;

  // Round to nearest 15-minute interval
  const roundedMinutes = Math.round(newMinutes / 15) * 15;
  const finalMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
  const finalHours = roundedMinutes === 60 ? newHours + 1 : newHours;

  return `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
};

const ReplaceEventDialog: React.FC<ReplaceEventDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  eventToReplace,
  lectiveDates = new Set()
}) => {
  const [newEventDate, setNewEventDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [newStartTime, setNewStartTime] = useState<string>('09:00');
  const [newEndTime, setNewEndTime] = useState<string>('10:00');
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([]);
  const [comment, setComment] = useState<string>('');
  const [openStartTime, setOpenStartTime] = useState(false);
  const [openEndTime, setOpenEndTime] = useState(false);
  const [openDatePicker, setOpenDatePicker] = useState(false);

  // Hook para obtener las aulas
  const { data: classrooms = [] } = useClassrooms();

  // Inicializar valores cuando se abre el diálogo
  React.useEffect(() => {
    if (open && eventToReplace) {
      setNewEventDate(eventToReplace.date);
      // Formatear horas para quitar los segundos (HH:mm:ss -> HH:mm)
      setNewStartTime(eventToReplace.startTime.substring(0, 5));
      setNewEndTime(eventToReplace.endTime.substring(0, 5));
      setSelectedClassroomIds(eventToReplace.classrooms.map(c => c.id));
      setComment('');
    }
  }, [open, eventToReplace]);

  if (!eventToReplace) {
    return null;
  }

  const subjectName = eventToReplace.subject?.name || 'Sin asignatura';
  const groupNames = eventToReplace.groups.map(g => {
    const subject = eventToReplace.subject;
    const langPrefix = g.language === 'EN' ? 'I-' : '';
    return `${subject?.acronym}.${g.type}.${langPrefix}${g.number}`;
  }).join(', ');
  const originalClassroomNames = eventToReplace.classrooms.map(c => c.code).join(', ');

  const isFormValid = newEventDate && newStartTime && newEndTime && selectedClassroomIds.length > 0;

  const handleSave = () => {
    if (!isFormValid) return;

    const config: ReplaceEventConfig = {
      originalEventId: eventToReplace.periodicEventId || eventToReplace.puntualEventId || '',
      originalDate: eventToReplace.date,
      originalStartTime: eventToReplace.startTime,
      originalEndTime: eventToReplace.endTime,
      newEventDate,
      newStartTime,
      newEndTime,
      subjectId: eventToReplace.subject?.id || '',
      groupIds: eventToReplace.groups.map(g => g.id),
      classroomIds: selectedClassroomIds,
      comment
    };

    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-lg">
              <Replace className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-semibold">Reemplazar evento</DialogTitle>
          </div>
          <DialogDescription className="hidden">Diálogo para reemplazar un evento periódico</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-3">
          <div className="space-y-3">
            {/* Información del evento original (solo lectura) */}
            <div className="p-3 bg-muted/50 rounded-lg border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Evento original</p>
              <div className="space-y-1 text-sm">
                <p><strong>Asignatura:</strong> {subjectName}</p>
                <p><strong>Grupos:</strong> {groupNames}</p>
                <p><strong>Aulas:</strong> {originalClassroomNames}</p>
                <p><strong>Fecha:</strong> {format(new Date(eventToReplace.date), 'dd/MM/yyyy', { locale: es })}</p>
                <p><strong>Horario:</strong> {eventToReplace.startTime.substring(0, 5)} - {eventToReplace.endTime.substring(0, 5)}</p>
              </div>
            </div>

            {/* Campos bloqueados (solo información) */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Frecuencia</Label>
              <Input
                value="No se repite"
                disabled
                className="h-8 text-xs bg-muted"
              />
              <p className="text-xs text-muted-foreground">El evento de reemplazo será un evento puntual</p>
            </div>

            {/* Nueva fecha y horario */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nueva Fecha y Horario</Label>
              <div className="flex gap-2">
                {/* Date Selection */}
                <Popover open={openDatePicker} onOpenChange={setOpenDatePicker} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 px-3 text-xs justify-between font-normal flex-1"
                    >
                      {newEventDate && !isNaN(new Date(newEventDate).getTime()) ? format(new Date(newEventDate), 'dd/MM/yyyy', { locale: es }) : 'Fecha'}
                      <ChevronDownIcon className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newEventDate && !isNaN(new Date(newEventDate).getTime()) ? new Date(newEventDate) : new Date()}
                      defaultMonth={newEventDate && !isNaN(new Date(newEventDate).getTime()) ? new Date(newEventDate) : new Date()}
                      onSelect={(date) => {
                        if (date) {
                          setNewEventDate(format(date, 'yyyy-MM-dd'));
                          setOpenDatePicker(false);
                        }
                      }}
                      locale={es}
                      disabled={(date) => !lectiveDates.has(format(date, 'yyyy-MM-dd'))}
                    />
                  </PopoverContent>
                </Popover>

                {/* Start Time */}
                <Popover open={openStartTime} onOpenChange={setOpenStartTime} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 px-3 text-xs justify-between font-normal flex-1"
                    >
                      {newStartTime}
                      <ChevronDownIcon className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <TimePicker
                      value={newStartTime}
                      onChange={(value) => {
                        // Calculate current duration
                        const duration = calculateDurationInMinutes(newStartTime, newEndTime);
                        // Calculate new end time maintaining the duration
                        const calculatedEndTime = addMinutesToTime(value, duration);
                        setNewStartTime(value);
                        setNewEndTime(calculatedEndTime);
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
                      {newEndTime}
                      <ChevronDownIcon className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <TimePicker
                      value={newEndTime}
                      onChange={(value) => {
                        setNewEndTime(value);
                        setOpenEndTime(false);
                      }}
                      minTime={newStartTime}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Asignatura (bloqueado) */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Asignatura</Label>
              <Input
                value={subjectName}
                disabled
                className="h-8 text-xs bg-muted"
              />
            </div>

            {/* Grupos y Aulas en la misma fila */}
            <div className="grid grid-cols-2 gap-2">
              {/* Grupos (bloqueado) */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Grupo</Label>
                <Input
                  value={groupNames}
                  disabled
                  className="h-8 text-xs bg-muted"
                />
              </div>

              {/* Aulas (editable) */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Aula</Label>
                {classrooms.length === 0 ? (
                  <div className="h-8 text-xs flex items-center text-muted-foreground border rounded px-3">
                    Cargando aulas...
                  </div>
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
              </div>
            </div>

            {/* Comment Field */}
            <div className="space-y-1">
              <Label htmlFor="comment" className="text-xs font-semibold">Comentario</Label>
              <Textarea
                id="comment"
                placeholder="Añade un comentario sobre este reemplazo..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="h-20 text-xs resize-none"
              />
            </div>

            {/* Resumen */}
            <div className="bg-accent/20 border border-primary/20 rounded p-3 text-xs space-y-1">
              <p className="font-semibold">Resumen del reemplazo</p>
              <p className="text-muted-foreground">
                El evento del <strong>{format(new Date(eventToReplace.date), 'dd/MM/yyyy', { locale: es })}</strong> a las <strong>{eventToReplace.startTime.substring(0, 5)}</strong> será cancelado
              </p>
              <p className="text-muted-foreground">
                Se creará un nuevo evento el <strong>{format(new Date(newEventDate), 'dd/MM/yyyy', { locale: es })}</strong> de <strong>{newStartTime} - {newEndTime}</strong>
                {selectedClassroomIds.length > 0 && (
                  <> en el aula <strong>{classrooms.find(c => c.id === selectedClassroomIds[0])?.code}</strong></>
                )}
              </p>
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
            Reemplazar evento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReplaceEventDialog;
