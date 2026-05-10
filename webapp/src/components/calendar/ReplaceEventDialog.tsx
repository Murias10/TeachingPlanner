"use client"

import React, { useState } from 'react';
import { Replace, ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RequiredLabel } from '@/components/ui/RequiredLabel';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { es, enUS } from 'date-fns/locale';
import { format } from 'date-fns';
import { CalendarEvent } from '@/types/CalendarEvent';
import { useClassrooms } from '@/hooks/classroom/useClassrooms';
import { calculateDurationInMinutes, calculateNewEndTime } from '@/utils/timeUtils';
import { useTranslation } from 'react-i18next';

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


const ReplaceEventDialog: React.FC<ReplaceEventDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  eventToReplace,
  lectiveDates = new Set()
}) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'es' ? es : enUS;

  const [newEventDate, setNewEventDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [newStartTime, setNewStartTime] = useState<string>('09:00');
  const [newEndTime, setNewEndTime] = useState<string>('10:00');
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([]);
  const [comment, setComment] = useState<string>('');
  const [openStartTime, setOpenStartTime] = useState(false);
  const [openEndTime, setOpenEndTime] = useState(false);
  const [openDatePicker, setOpenDatePicker] = useState(false);

  const { data: classrooms = [] } = useClassrooms();

  React.useEffect(() => {
    if (open && eventToReplace) {
      setNewEventDate(eventToReplace.date);
      setNewStartTime(eventToReplace.startTime.substring(0, 5));
      setNewEndTime(eventToReplace.endTime.substring(0, 5));
      setSelectedClassroomIds(eventToReplace.classrooms.map(c => c.id));
      setComment('');
    }
  }, [open, eventToReplace]);

  if (!eventToReplace) {
    return null;
  }

  const subjectName = eventToReplace.subject?.name || t("replaceEventDialog.noSubject");
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
            <DialogTitle className="text-lg font-semibold">{t("replaceEventDialog.title")}</DialogTitle>
          </div>
          <DialogDescription className="hidden">{t("replaceEventDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-3">
          <div className="space-y-3">
            {/* Información del evento original (solo lectura) */}
            <div className="p-3 bg-muted/50 rounded-lg border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">{t("replaceEventDialog.originalEvent")}</p>
              <div className="space-y-1 text-sm">
                <p><strong>{t("replaceEventDialog.subject")}:</strong> {subjectName}</p>
                <p><strong>{t("replaceEventDialog.groups")}:</strong> {groupNames}</p>
                <p><strong>{t("replaceEventDialog.classrooms")}:</strong> {originalClassroomNames}</p>
                <p><strong>{t("replaceEventDialog.date")}:</strong> {format(new Date(eventToReplace.date), 'dd/MM/yyyy', { locale: dateLocale })}</p>
                <p><strong>{t("replaceEventDialog.schedule")}:</strong> {eventToReplace.startTime.substring(0, 5)} - {eventToReplace.endTime.substring(0, 5)}</p>
              </div>
            </div>

            {/* Frecuencia bloqueada */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("replaceEventDialog.frequency")}</Label>
              <Input
                value={t("replaceEventDialog.noRepeat")}
                disabled
                className="h-8 text-xs bg-muted"
              />
              <p className="text-xs text-muted-foreground">{t("replaceEventDialog.punctualHint")}</p>
            </div>

            {/* Nueva fecha y horario */}
            <div className="space-y-1">
              <RequiredLabel required className="text-xs font-semibold">{t("replaceEventDialog.newDateAndTime")}</RequiredLabel>
              <div className="flex gap-2">
                {/* Date Selection */}
                <Popover open={openDatePicker} onOpenChange={setOpenDatePicker} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-8 px-3 text-xs justify-between font-normal flex-1"
                    >
                      {newEventDate && !isNaN(new Date(newEventDate).getTime())
                        ? format(new Date(newEventDate), 'dd/MM/yyyy', { locale: dateLocale })
                        : t("replaceEventDialog.date")}
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
                      locale={dateLocale}
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
                        const duration = calculateDurationInMinutes(newStartTime, newEndTime);
                        const calculatedEndTime = calculateNewEndTime(value, duration);
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
                      }}
                      onComplete={() => setOpenEndTime(false)}
                      minTime={newStartTime}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Asignatura (bloqueado) */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("replaceEventDialog.subject")}</Label>
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
                <Label className="text-xs font-semibold">{t("replaceEventDialog.group")}</Label>
                <Input
                  value={groupNames}
                  disabled
                  className="h-8 text-xs bg-muted"
                />
              </div>

              {/* Aulas (editable) */}
              <div className="space-y-1">
                <RequiredLabel required className="text-xs font-semibold">{t("replaceEventDialog.classroom")}</RequiredLabel>
                {classrooms.length === 0 ? (
                  <div className="h-8 text-xs flex items-center text-muted-foreground border rounded px-3">
                    {t("replaceEventDialog.loadingClassrooms")}
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
                    placeholder={t("replaceEventDialog.selectClassroom")}
                    searchPlaceholder={t("replaceEventDialog.searchClassroom")}
                    emptyMessage={t("replaceEventDialog.noClassroomsFound")}
                  />
                ) : (
                  <Select
                    value={selectedClassroomIds[0] || ''}
                    onValueChange={(value) => {
                      setSelectedClassroomIds(value ? [value] : []);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs w-full">
                      <SelectValue placeholder={t("replaceEventDialog.selectClassroom")} />
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

            {/* Comentario */}
            <div className="space-y-1">
              <Label htmlFor="comment" className="text-xs font-semibold">{t("replaceEventDialog.comment")}</Label>
              <Textarea
                id="comment"
                placeholder={t("replaceEventDialog.commentPlaceholder")}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="h-20 text-xs resize-none"
              />
            </div>

            {/* Resumen */}
            <div className="bg-accent/20 border border-primary/20 rounded p-3 text-xs space-y-1">
              <p className="font-semibold">{t("replaceEventDialog.summary")}</p>
              <p className="text-muted-foreground">
                {t("replaceEventDialog.summaryCancel", {
                  date: format(new Date(eventToReplace.date), 'dd/MM/yyyy', { locale: dateLocale }),
                  time: eventToReplace.startTime.substring(0, 5)
                })}
              </p>
              <p className="text-muted-foreground">
                {t("replaceEventDialog.summaryCreate", {
                  newDate: format(new Date(newEventDate), 'dd/MM/yyyy', { locale: dateLocale }),
                  startTime: newStartTime,
                  endTime: newEndTime
                })}
                {selectedClassroomIds.length > 0 && (
                  t("replaceEventDialog.summaryClassroom", {
                    code: classrooms.find(c => c.id === selectedClassroomIds[0])?.code
                  })
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
            {t("replaceEventDialog.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid}
            className="h-8 text-xs"
          >
            {t("replaceEventDialog.replace")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReplaceEventDialog;
