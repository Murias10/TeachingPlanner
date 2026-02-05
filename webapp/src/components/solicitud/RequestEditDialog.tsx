"use client"

import { useState, useEffect } from 'react';
import { Pencil, ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { CalendarEvent } from '@/types/CalendarEvent';

interface RequestEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: RequestEditConfig) => void;
  event: CalendarEvent | undefined;
  lectiveDates?: Set<string>;
  isSubmitting?: boolean;
}

export interface RequestEditConfig {
  originalEventId: string;
  eventType: 'PUNTUAL' | 'PERIODIC';
  startTime: string;
  endTime: string;
  eventDate?: string;    // solo para puntual
  weekDay?: string;      // solo para periódico
  comment: string;
}

const calculateDurationInMinutes = (startTime: string, endTime: string): number => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
};

const addMinutesToTime = (time: string, minutes: number): string => {
  const [hours, mins] = time.split(':').map(Number);
  let totalMinutes = hours * 60 + mins + minutes;
  totalMinutes = Math.max(540, Math.min(1260, totalMinutes));
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  const roundedMinutes = Math.round(newMinutes / 15) * 15;
  const finalMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
  const finalHours = roundedMinutes === 60 ? newHours + 1 : newHours;
  return `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
};

const normalizeTime = (time: string): string => {
  const parts = time.split(':');
  return `${parts[0]}:${parts[1]}`;
};

export default function RequestEditDialog({
  open,
  onOpenChange,
  onSave,
  event,
  lectiveDates = new Set(),
  isSubmitting = false
}: RequestEditDialogProps) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [eventDate, setEventDate] = useState('');
  const [weekDay, setWeekDay] = useState('');
  const [comment, setComment] = useState('');
  const [openStartTime, setOpenStartTime] = useState(false);
  const [openEndTime, setOpenEndTime] = useState(false);

  const isPuntual = event?.type === 'puntual';

  useEffect(() => {
    if (event && open) {
      setStartTime(normalizeTime(event.startTime));
      setEndTime(normalizeTime(event.endTime));
      setComment(event.comment || '');
      if (isPuntual) {
        setEventDate(event.date);
      } else {
        setWeekDay(event.weekDay || '');
      }
    }
  }, [event, open, isPuntual]);

  if (!event) return null;

  const originalEventId = isPuntual ? (event.puntualEventId || event.id) : (event.periodicEventId || event.id);

  const handleSave = () => {
    onSave({
      originalEventId,
      eventType: isPuntual ? 'PUNTUAL' : 'PERIODIC',
      startTime,
      endTime,
      ...(isPuntual ? { eventDate } : { weekDay }),
      comment,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-lg">
              <Pencil className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-semibold">Solicitar editar evento</DialogTitle>
          </div>
          <DialogDescription className="hidden">Diálogo para solicitar la edición de un evento</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-3">
          <div className="space-y-3">
            {/* Info del evento original (read-only) */}
            <div className="p-3 bg-accent/20 rounded border border-primary/20">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Evento original</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Tipo:</span> {isPuntual ? 'Puntual' : 'Periódico'}</div>
                <div><span className="text-muted-foreground">Horario:</span> {normalizeTime(event.startTime)} - {normalizeTime(event.endTime)}</div>
                {event.groups.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Grupos:</span>{' '}
                    {event.groups.map(g => `${g.type}.${g.language === 'EN' ? 'I-' : ''}${g.number}`).join(', ')}
                  </div>
                )}
                {event.classrooms.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Aulas:</span>{' '}
                    {event.classrooms.map(c => c.code).join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Fecha (solo puntual) */}
            {isPuntual && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Fecha</Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-8 px-3 text-xs justify-between font-normal w-full">
                      {eventDate && !isNaN(new Date(eventDate).getTime())
                        ? format(new Date(eventDate), 'dd/MM/yyyy', { locale: es })
                        : 'Fecha'}
                      <ChevronDownIcon className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={eventDate && !isNaN(new Date(eventDate).getTime()) ? new Date(eventDate) : new Date()}
                      onSelect={(date) => { if (date) setEventDate(format(date, 'yyyy-MM-dd')); }}
                      locale={es}
                      disabled={(date) => !lectiveDates.has(format(date, 'yyyy-MM-dd'))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Día de la semana (solo periódico) */}
            {!isPuntual && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Día de la semana</Label>
                <Select value={weekDay} onValueChange={setWeekDay}>
                  <SelectTrigger className="h-8 text-xs w-full">
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
              </div>
            )}

            {/* Horario */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Horario</Label>
              <div className="flex gap-2">
                <Popover open={openStartTime} onOpenChange={setOpenStartTime} modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-8 px-3 text-xs justify-between font-normal flex-1">
                      {startTime}
                      <ChevronDownIcon className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <TimePicker
                      value={startTime}
                      onChange={(value) => {
                        const duration = calculateDurationInMinutes(startTime, endTime);
                        setEndTime(addMinutesToTime(value, duration));
                        setStartTime(value);
                        setOpenStartTime(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-xs text-muted-foreground flex items-center">-</span>
                <Popover open={openEndTime} onOpenChange={setOpenEndTime} modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-8 px-3 text-xs justify-between font-normal flex-1">
                      {endTime}
                      <ChevronDownIcon className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <TimePicker value={endTime} onChange={(value) => { setEndTime(value); setOpenEndTime(false); }} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Comentario */}
            <div className="space-y-1">
              <Label htmlFor="edit-comment" className="text-xs font-semibold">Comentario</Label>
              <Textarea
                id="edit-comment"
                placeholder="Añade un comentario sobre este cambio..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="h-20 text-xs resize-none"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-end px-6 pb-6 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="h-8 text-xs">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting} className="h-8 text-xs">
            {isSubmitting ? 'Enviando...' : 'Solicitar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
