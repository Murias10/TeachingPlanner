"use client"

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
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
  specificDate?: string;
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
  const { t } = useTranslation();
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
      specificDate: !isPuntual ? event.date : undefined,
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
            <DialogTitle className="text-lg font-semibold">{t("solicitud.cancel.dialogTitle")}</DialogTitle>
          </div>
          <DialogDescription className="hidden">{t("solicitud.cancel.dialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-3">
          <div className="space-y-3">
            {/* Info del evento (read-only) */}
            <div className="p-3 bg-accent/20 rounded-md border border-primary/20">
              <p className="text-xs font-semibold text-muted-foreground mb-1">{t("solicitud.cancel.eventToCancel")}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">{t("solicitud.cancel.type")}:</span> {isPuntual ? t("solicitud.cancel.punctual") : t("solicitud.cancel.periodic")}</div>
                <div><span className="text-muted-foreground">{t("solicitud.cancel.schedule")}:</span> {normalizeTime(event.startTime)} - {normalizeTime(event.endTime)}</div>
                {event.date && (
                  <div><span className="text-muted-foreground">{t("solicitud.cancel.date")}:</span> {format(parseISO(event.date), 'dd/MM/yyyy', { locale: es })}</div>
                )}
                {event.groups.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">{t("solicitud.cancel.groups")}:</span>{' '}
                    {event.groups.map(g => `${g.type}.${g.language === 'EN' ? 'I-' : ''}${g.number}`).join(', ')}
                  </div>
                )}
                {event.classrooms.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">{t("solicitud.cancel.classrooms")}:</span>{' '}
                    {event.classrooms.map(c => c.code).join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Comentario */}
            <div className="space-y-1">
              <Label htmlFor="cancel-comment" className="text-xs font-semibold">
                {t("solicitud.cancel.commentLabel")}
              </Label>
              <Textarea
                id="cancel-comment"
                placeholder={t("solicitud.cancel.commentPlaceholder")}
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
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting || !comment.trim()} variant="destructive" className="h-8 text-xs">
            {isSubmitting ? t("solicitud.cancel.sending") : t("solicitud.cancel.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
