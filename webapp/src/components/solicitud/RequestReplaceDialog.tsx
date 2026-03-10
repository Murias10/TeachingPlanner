"use client"

import { useState, useEffect } from 'react';
import { Replace, ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { Textarea } from '@/components/ui/textarea';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { CalendarEvent } from '@/types/CalendarEvent';
import { calculateDurationInMinutes, calculateNewEndTime } from '@/utils/timeUtils';

interface RequestReplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: RequestReplaceConfig) => void;
  event: CalendarEvent | undefined;
  lectiveDates?: Set<string>;
  isSubmitting?: boolean;
}

export interface RequestReplaceConfig {
  originalEventId: string;
  eventType: 'PUNTUAL' | 'PERIODIC';
  originalDate?: string;   // solo para periódico (la ocurrencia específica)
  newEventDate: string;
  startTime: string;
  endTime: string;
  comment: string;
}


const normalizeTime = (time: string): string => {
  const parts = time.split(':');
  return `${parts[0]}:${parts[1]}`;
};

export default function RequestReplaceDialog({
  open,
  onOpenChange,
  onSave,
  event,
  lectiveDates = new Set(),
  isSubmitting = false
}: RequestReplaceDialogProps) {
  const [newEventDate, setNewEventDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [comment, setComment] = useState('');
  const [openStartTime, setOpenStartTime] = useState(false);
  const [openEndTime, setOpenEndTime] = useState(false);

  const isPuntual = event?.type === 'puntual';

  useEffect(() => {
    if (event && open) {
      setStartTime(normalizeTime(event.startTime));
      setEndTime(normalizeTime(event.endTime));
      setNewEventDate(event.date); // default to same date, user will change
      setComment('');
    }
  }, [event, open]);

  if (!event) return null;

  const originalEventId = isPuntual ? (event.puntualEventId || event.id) : (event.periodicEventId || event.id);

  const isValid = !!newEventDate;

  const handleSave = () => {
    onSave({
      originalEventId,
      eventType: isPuntual ? 'PUNTUAL' : 'PERIODIC',
      ...((!isPuntual) ? { originalDate: event.date } : {}),
      newEventDate,
      startTime,
      endTime,
      comment,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-lg">
              <Replace className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-semibold">Solicitar reemplazo de evento</DialogTitle>
          </div>
          <DialogDescription className="hidden">Diálogo para solicitar el reemplazo de un evento</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-3">
          <div className="space-y-3">
            {/* Info del evento original (read-only) */}
            <div className="p-3 bg-accent/20 rounded border border-primary/20">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Evento original</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Tipo:</span> {isPuntual ? 'Puntual' : 'Periódico'}</div>
                <div><span className="text-muted-foreground">Fecha:</span> {event.date}</div>
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

            {/* Nueva fecha */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nueva fecha</Label>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 px-3 text-xs justify-between font-normal w-full">
                    {newEventDate && !isNaN(new Date(newEventDate).getTime())
                      ? format(new Date(newEventDate), 'dd/MM/yyyy', { locale: es })
                      : 'Seleccionar fecha'}
                    <ChevronDownIcon className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newEventDate && !isNaN(new Date(newEventDate).getTime()) ? new Date(newEventDate) : new Date()}
                    onSelect={(date) => { if (date) setNewEventDate(format(date, 'yyyy-MM-dd')); }}
                    locale={es}
                    disabled={(date) => !lectiveDates.has(format(date, 'yyyy-MM-dd'))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Horario del reemplazo */}
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
                        setEndTime(calculateNewEndTime(value, duration));
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
              <Label htmlFor="replace-comment" className="text-xs font-semibold">Comentario (opcional)</Label>
              <Textarea
                id="replace-comment"
                placeholder="Motivo del reemplazo..."
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
          <Button onClick={handleSave} disabled={!isValid || isSubmitting} className="h-8 text-xs">
            {isSubmitting ? 'Enviando...' : 'Solicitar reemplazo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
