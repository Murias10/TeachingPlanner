"use client"

import { useState, useEffect } from 'react';
import { Replace, ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RequiredLabel } from '@/components/ui/RequiredLabel';
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
import { calculateDurationInMinutes, calculateNewEndTime } from '@/utils/timeUtils';
import { useTranslation } from 'react-i18next';

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
  originalDate?: string;
  newEventDate: string;
  startTime: string;
  endTime: string;
  comment: string;
  preferredClassroomId?: string;
  subjectId?: string;
  groupIds?: string[];
  classroomIds?: string[];
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
  const { t } = useTranslation();
  const [newEventDate, setNewEventDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [comment, setComment] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [openNewEventDate, setOpenNewEventDate] = useState(false);
  const [openStartTime, setOpenStartTime] = useState(false);
  const [openEndTime, setOpenEndTime] = useState(false);

  const { data: classrooms = [] } = useClassrooms();

  const isPuntual = event?.type === 'puntual';

  useEffect(() => {
    if (event && open) {
      setStartTime(normalizeTime(event.startTime));
      setEndTime(normalizeTime(event.endTime));
      setNewEventDate(event.date);
      setComment('');
      setSelectedClassroomId(event.classrooms[0]?.id ?? '');
    }
  }, [event, open]);

  if (!event) return null;

  const originalEventId = isPuntual
    ? (event.puntualEventId || event.id)
    : (event.periodicEventId || event.id);

  const subjectName = event.subject?.name || 'Sin asignatura';
  const groupNames = event.groups.map(g => {
    const langPrefix = g.language === 'EN' ? 'I-' : '';
    return `${event.subject?.acronym}.${g.type}.${langPrefix}${g.number}`;
  }).join(', ');
  const originalClassroomNames = event.classrooms.map(c => c.code).join(', ') || '—';

  const isValid = !!newEventDate && comment.trim().length > 0;

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      originalEventId,
      eventType: isPuntual ? 'PUNTUAL' : 'PERIODIC',
      ...(!isPuntual ? { originalDate: event.date } : {}),
      newEventDate,
      startTime,
      endTime,
      comment,
      preferredClassroomId: selectedClassroomId || undefined,
      subjectId: event.subject?.id,
      groupIds: event.groups.map(g => g.id),
      classroomIds: event.classrooms.map(c => c.id),
    });
  };

  const sortedClassrooms = [...classrooms].sort((a, b) => a.code.localeCompare(b.code));
  const selectedClassroomCode = classrooms.find(c => c.id === selectedClassroomId)?.code;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-lg">
              <Replace className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-semibold">{t('solicitud.replace.title')}</DialogTitle>
          </div>
          <DialogDescription className="hidden">{t('solicitud.replace.description')}</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-3">
          <div className="space-y-3">

            {/* Información del evento original (solo lectura) */}
            <div className="p-3 bg-muted/50 rounded-lg border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">{t('solicitud.replace.originalEvent')}</p>
              <div className="space-y-1 text-sm">
                <p><strong>{t('solicitud.replace.subject')}:</strong> {subjectName}</p>
                <p><strong>{t('solicitud.replace.groups')}:</strong> {groupNames || '—'}</p>
                <p><strong>{t('solicitud.replace.classrooms')}:</strong> {originalClassroomNames}</p>
                <p><strong>{t('solicitud.replace.date')}:</strong> {format(new Date(event.date), 'dd/MM/yyyy', { locale: es })}</p>
                <p><strong>{t('solicitud.replace.time')}:</strong> {normalizeTime(event.startTime)} - {normalizeTime(event.endTime)}</p>
              </div>
            </div>

            {/* Nueva Fecha y Horario */}
            <div className="space-y-1">
              <RequiredLabel required className="text-xs font-semibold">{t('solicitud.replace.newDateTime')}</RequiredLabel>
              <div className="flex gap-2">
                {/* Selector de fecha */}
                <Popover modal={true} open={openNewEventDate} onOpenChange={setOpenNewEventDate}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-8 px-3 text-xs justify-between font-normal flex-1">
                      {newEventDate && !isNaN(new Date(newEventDate).getTime())
                        ? format(new Date(newEventDate), 'dd/MM/yyyy', { locale: es })
                        : t('solicitud.replace.datePlaceholder')}
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
                          setOpenNewEventDate(false);
                        }
                      }}
                      locale={es}
                      disabled={(date) => !lectiveDates.has(format(date, 'yyyy-MM-dd'))}
                    />
                  </PopoverContent>
                </Popover>

                {/* Hora inicio */}
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

                {/* Hora fin */}
                <Popover open={openEndTime} onOpenChange={setOpenEndTime} modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-8 px-3 text-xs justify-between font-normal flex-1">
                      {endTime}
                      <ChevronDownIcon className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <TimePicker
                      value={endTime}
                      onChange={(value) => setEndTime(value)}
                      onComplete={() => setOpenEndTime(false)}
                      minTime={startTime}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Asignatura (deshabilitado) */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t('solicitud.replace.subject')}</Label>
              <Input
                value={subjectName}
                disabled
                className="h-8 text-xs bg-muted"
              />
            </div>

            {/* Grupo y Aula */}
            <div className="grid grid-cols-2 gap-2">
              {/* Grupo (deshabilitado) */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">{t('solicitud.replace.group')}</Label>
                <Input
                  value={groupNames || '—'}
                  disabled
                  className="h-8 text-xs bg-muted"
                />
              </div>

              {/* Aula (opcional, editable) */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">{t('solicitud.replace.classroom')}</Label>
                {classrooms.length === 0 ? (
                  <div className="h-8 text-xs flex items-center text-muted-foreground border rounded px-3">
                    {t('solicitud.replace.loadingClassrooms')}
                  </div>
                ) : classrooms.length > 8 ? (
                  <SearchableSelect
                    value={selectedClassroomId}
                    onValueChange={(value) => setSelectedClassroomId(value)}
                    options={[
                      { value: '', label: t('solicitud.replace.noPreference') },
                      ...sortedClassrooms.map(c => ({ value: c.id, label: c.code }))
                    ]}
                    placeholder={t('solicitud.replace.noPreference')}
                    searchPlaceholder={t('solicitud.replace.searchClassroom')}
                    emptyMessage={t('solicitud.replace.noClassroomsFound')}
                  />
                ) : (
                  <Select
                    value={selectedClassroomId}
                    onValueChange={(value) => setSelectedClassroomId(value)}
                  >
                    <SelectTrigger className="h-8 text-xs w-full">
                      <SelectValue placeholder={t('solicitud.replace.noPreference')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('solicitud.replace.noPreference')}</SelectItem>
                      {sortedClassrooms.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Comentario (obligatorio) */}
            <div className="space-y-1">
              <RequiredLabel htmlFor="replace-comment" required className="text-xs font-semibold">
                {t('solicitud.replace.comment')}
              </RequiredLabel>
              <Textarea
                id="replace-comment"
                placeholder={t('solicitud.replace.commentPlaceholder')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="h-20 text-xs resize-none"
              />
            </div>

            {/* Resumen del reemplazo */}
            <div className="bg-accent/20 border border-primary/20 rounded p-3 text-xs space-y-1">
              <p className="font-semibold">{t('solicitud.replace.summary')}</p>
              <p className="text-muted-foreground">
                {t('solicitud.replace.summaryCancel', {
                  date: format(new Date(event.date), 'dd/MM/yyyy', { locale: es }),
                  time: normalizeTime(event.startTime),
                })}
              </p>
              <p className="text-muted-foreground">
                {t('solicitud.replace.summaryNew', {
                  date: newEventDate && !isNaN(new Date(newEventDate).getTime())
                    ? format(new Date(newEventDate), 'dd/MM/yyyy', { locale: es })
                    : '—',
                  startTime,
                  endTime,
                })}
                {selectedClassroomCode && t('solicitud.replace.summaryClassroom', { classroom: selectedClassroomCode })}
              </p>
            </div>

          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2 justify-end px-6 pb-6 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="h-8 text-xs">
            {t('solicitud.replace.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isSubmitting} className="h-8 text-xs">
            {isSubmitting ? t('solicitud.replace.sending') : t('solicitud.replace.send')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
