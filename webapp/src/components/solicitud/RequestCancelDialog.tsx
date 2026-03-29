"use client"

import { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CalendarEvent } from '@/types/CalendarEvent';

interface RequestCancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: RequestCancelConfig) => void;
  event: CalendarEvent | undefined;
  isSubmitting?: boolean;
}

export interface RequestCancelConfig {
  originalEventId: string;
  eventType: 'PUNTUAL' | 'PERIODIC';
  comment: string;
  subjectId?: string;
  groupIds?: string[];
  classroomIds?: string[];
}

const normalizeTime = (time: string): string => {
  const parts = time.split(':');
  return `${parts[0]}:${parts[1]}`;
};

export default function RequestCancelDialog({
  open,
  onOpenChange,
  onSave,
  event,
  isSubmitting = false
}: RequestCancelDialogProps) {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (event && open) {
      setComment('');
    }
  }, [event, open]);

  if (!event) return null;

  const isPuntual = event.type === 'puntual';
  const originalEventId = isPuntual ? (event.puntualEventId || event.id) : (event.periodicEventId || event.id);

  const handleSave = () => {
    onSave({
      originalEventId,
      eventType: isPuntual ? 'PUNTUAL' : 'PERIODIC',
      comment,
      subjectId: event.subject?.id,
      groupIds: event.groups.map(g => g.id),
      classroomIds: event.classrooms.map(c => c.id),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <DialogTitle className="text-lg font-semibold">Solicitar cancelar evento</DialogTitle>
          </div>
          <DialogDescription className="hidden">Diálogo para solicitar la cancelación de un evento</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-3">
          <div className="space-y-3">
            {/* Info del evento (read-only) */}
            <div className="p-3 bg-accent/20 rounded border border-primary/20">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Evento a cancelar</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Tipo:</span> {isPuntual ? 'Puntual' : 'Periódico'}</div>
                <div><span className="text-muted-foreground">Horario:</span> {normalizeTime(event.startTime)} - {normalizeTime(event.endTime)}</div>
                {isPuntual && (
                  <div><span className="text-muted-foreground">Fecha:</span> {event.date}</div>
                )}
                {!isPuntual && event.weekDay && (
                  <div><span className="text-muted-foreground">Día:</span> {event.weekDay}</div>
                )}
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

            {/* Comentario */}
            <div className="space-y-1">
              <Label htmlFor="cancel-comment" className="text-xs font-semibold">Comentario (opcional)</Label>
              <Textarea
                id="cancel-comment"
                placeholder="Motivo de la cancelación..."
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
          <Button onClick={handleSave} disabled={isSubmitting} variant="destructive" className="h-8 text-xs">
            {isSubmitting ? 'Enviando...' : 'Solicitar cancelación'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
