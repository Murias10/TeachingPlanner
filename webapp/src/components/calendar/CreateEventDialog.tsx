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
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { Textarea } from '@/components/ui/textarea';
import { es, enUS } from 'date-fns/locale';
import { format, getDay, parseISO } from 'date-fns';
import type { RecurrenceConfig, FrequencyType, WeekDay, EndsType, CustomFrequencyUnit, MonthlyPatternType } from '@/types/RecurrenceConfig';
import { useClassrooms } from '@/hooks/classroom/useClassrooms';
import { useSubjectsByCalendarId } from '@/hooks/subject/useSubjectsByCalendarId';
import { useSubjectsWithGroupsByCalendarId } from '@/hooks/subject/useSubjectsWithGroupsByCalendarId';
import { EVENT_CHARACTERS, EVENT_TYPES, isSpecialEventType, isReviewOrEvalEventType, EVENT_TYPE_LABELS } from '@/constants/eventCharacters';
import { getMonthlyPatternLabels } from '@/utils/customPatternCalculator';
import { calculateDurationInMinutes, calculateNewEndTime } from '@/utils/timeUtils';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: RecurrenceConfig) => void;
  calendarId?: string;
  initialDate?: string | null;
  initialStartTime?: string | null;
  initialEndTime?: string | null;
  lectiveDates?: Set<string>;
  calendarEndDate?: string;
}


const CreateEventDialog: React.FC<CreateEventDialogProps> = ({ open, onOpenChange, onSave, calendarId, initialDate, initialStartTime, initialEndTime, lectiveDates = new Set(), calendarEndDate }) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'es' ? es : enUS;

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

  const [selectedEventType, setSelectedEventType] = useState<string>(EVENT_TYPES.NORMAL);
  const [groupType, setGroupType] = useState<string>('T');
  const [openEventDate, setOpenEventDate] = useState(false);
  const [openCustomStartDate, setOpenCustomStartDate] = useState(false);
  const [openStartTime, setOpenStartTime] = useState(false);
  const [openEndTime, setOpenEndTime] = useState(false);
  const [allowEditPlanifiedHours, setAllowEditPlanifiedHours] = useState(false);
  const [initialGroupHours, setInitialGroupHours] = useState<number>(0);

  const { data: classrooms = [] } = useClassrooms();
  const { data: subjects = [], isLoading: isLoadingSubjects } = useSubjectsByCalendarId(calendarId || null);
  const { data: subjectsWithGroups = [] } = useSubjectsWithGroupsByCalendarId(calendarId || null);

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

  React.useEffect(() => {
    setConfig(prev => ({
      ...prev,
      groupIds: [],
      classroomIds: []
    }));
  }, [selectedEventType]);

  React.useEffect(() => {
    setConfig(prev => ({
      ...prev,
      groupIds: [],
      classroomIds: []
    }));
  }, [config.subjectId]);

  React.useEffect(() => {
    if (config.groupIds && config.groupIds.length > 0 && (config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd' || config.frequency === 'custom')) {
      const selectedGroupId = config.groupIds[0];
      const selectedSubject = subjectsWithGroups.find(s => s.id === config.subjectId);
      const selectedGroup = selectedSubject?.groups?.find(g => g.id === selectedGroupId);

      if (selectedGroup) {
        const groupHours = selectedGroup.planifiedHours || 0;
        setConfig(prev => ({
          ...prev,
          planifiedHours: groupHours
        }));
        setInitialGroupHours(groupHours);
        setAllowEditPlanifiedHours(false);
      }
    } else {
      setConfig(prev => ({
        ...prev,
        planifiedHours: 0
      }));
      setInitialGroupHours(0);
      setAllowEditPlanifiedHours(false);
    }
  }, [config.groupIds, config.subjectId, config.frequency, subjectsWithGroups]);

  React.useEffect(() => {
    if ((config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd') && initialDate && (!config.weekDays || config.weekDays.length === 0)) {
      try {
        const date = parseISO(initialDate);
        const dayOfWeek = getDay(date);

        const dayMap: { [key: number]: WeekDay } = {
          1: 'L',
          2: 'M',
          3: 'X',
          4: 'J',
          5: 'V',
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
  }, [config.frequency, initialDate, config.weekDays]);

  const filteredSubjects = subjects;

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

  const isBlocker = !config.subjectId;
  const effectiveEventType = isBlocker ? EVENT_TYPES.BLOCKER : selectedEventType;
  const isReviewOrEval = isReviewOrEvalEventType(selectedEventType);

  const availableGroups = useMemo(() => {
    if (!config.subjectId || isBlocker) return [];

    const selectedSubject = subjectsWithGroups.find(s => s.id === config.subjectId);
    if (!selectedSubject || !selectedSubject.groups) return [];

    if (groupType) {
      return selectedSubject.groups.filter(group => group.type === groupType);
    }
    return selectedSubject.groups;
  }, [config.subjectId, subjectsWithGroups, isBlocker, groupType]);

  const isFormValid = useMemo(() => {
    const hasClassrooms = config.classroomIds && config.classroomIds.length > 0;
    const isSpecial = isSpecialEventType(effectiveEventType);

    if (isBlocker) {
      if (!hasClassrooms) return false;
      if (config.frequency === 'no-repeat') return !!config.eventDate;
      if (config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd') {
        return !!(config.weekDays && config.weekDays.length > 0);
      }
      if (config.frequency === 'custom') {
        return !!config.customStartDate && !!config.customFrequencyUnit && config.interval > 0 && !!(config.weekDays && config.weekDays.length > 0);
      }
      return true;
    }

    const baseValid = (
      config.subjectId &&
      config.groupIds &&
      config.groupIds.length > 0 &&
      hasClassrooms
    );

    if (!baseValid) return false;

    if (config.frequency === 'no-repeat') {
      return !!config.eventDate;
    }

    if (config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd') {
      return !!(config.weekDays && config.weekDays.length > 0) && (isSpecial || config.planifiedHours > 0);
    }

    if (config.frequency === 'custom') {
      return !!config.customStartDate && !!config.customFrequencyUnit && config.interval > 0 && !!(config.weekDays && config.weekDays.length > 0);
    }

    return true;
  }, [effectiveEventType, isBlocker, config.subjectId, config.groupIds, config.classroomIds, config.frequency, config.eventDate, config.weekDays, config.planifiedHours, config.customStartDate, config.customFrequencyUnit, config.interval]);

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
    if (config.frequency === 'no-repeat') return t("eventDialog.noRepeat");
    if (config.frequency === 'weekly') return t("eventDialog.weekly");
    if (config.frequency === 'biweekly-even') return t("eventDialog.biweeklyEven");
    if (config.frequency === 'biweekly-odd') return t("eventDialog.biweeklyOdd");

    if (config.frequency === 'custom' && config.interval > 0 && config.customFrequencyUnit) {
      let unitLabel = '';
      if (config.customFrequencyUnit === 'day') {
        unitLabel = config.interval === 1 ? t("eventDialog.day") : t("eventDialog.days");
      } else if (config.customFrequencyUnit === 'week') {
        unitLabel = config.interval === 1 ? t("eventDialog.week") : t("eventDialog.weeks");
      } else if (config.customFrequencyUnit === 'month') {
        unitLabel = config.interval === 1 ? t("eventDialog.month") : t("eventDialog.months");
      }

      let summary = `${t("eventDialog.repeatEvery")} ${config.interval} ${unitLabel}`;

      if (config.customFrequencyUnit === 'week' && config.weekDays.length > 0) {
        summary += ` ${config.weekDays.join(', ')}`;
      }

      return summary;
    }

    return t("eventDialog.custom");
  };

  const handleSave = () => {
    let eventCharacter: string | undefined;

    if (config.frequency === 'weekly') {
      eventCharacter = EVENT_CHARACTERS.NORMAL;
    } else if (config.frequency === 'biweekly-even') {
      eventCharacter = EVENT_CHARACTERS.PAR;
    } else if (config.frequency === 'biweekly-odd') {
      eventCharacter = EVENT_CHARACTERS.IMPAR;
    }

    onSave({ ...config, eventCharacter, eventType: effectiveEventType });
    onOpenChange(false);
  };

  const getDateLabel = () => {
    if (config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd') {
      return t("eventDialog.dayAndTime");
    }
    if (config.frequency === 'custom') {
      return t("eventDialog.startDateAndTime");
    }
    return t("eventDialog.dateAndTime");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-lg">
              <Repeat className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-semibold">{t("eventDialog.createTitle")}</DialogTitle>
          </div>
          <DialogDescription className="hidden">{t("eventDialog.createDescription")}</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-3">
          <div className="space-y-3">
            {/* Frequency Selection */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t("eventDialog.frequency")}</Label>
              <Select value={config.frequency} onValueChange={(value) => handleFrequencyChange(value as FrequencyType)}>
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-repeat">{t("eventDialog.noRepeat")}</SelectItem>
                  <SelectItem value="weekly">{t("eventDialog.weekly")}</SelectItem>
                  <SelectItem value="biweekly-even">{t("eventDialog.biweeklyEven")}</SelectItem>
                  <SelectItem value="biweekly-odd">{t("eventDialog.biweeklyOdd")}</SelectItem>
                  <SelectItem value="custom">{t("eventDialog.custom")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date, Start Time, End Time in same row */}
            <div className="space-y-1">
              <RequiredLabel required className="text-xs font-semibold">
                {getDateLabel()}
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
                        {config.eventDate && !isNaN(new Date(config.eventDate).getTime())
                          ? format(new Date(config.eventDate), 'dd/MM/yyyy', { locale: dateLocale })
                          : t("eventDialog.datePlaceholder")}
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
                        locale={dateLocale}
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
                      <SelectValue placeholder={t("eventDialog.selectDay")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">{t("eventDialog.monday")}</SelectItem>
                      <SelectItem value="M">{t("eventDialog.tuesday")}</SelectItem>
                      <SelectItem value="X">{t("eventDialog.wednesday")}</SelectItem>
                      <SelectItem value="J">{t("eventDialog.thursday")}</SelectItem>
                      <SelectItem value="V">{t("eventDialog.friday")}</SelectItem>
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
                        {config.customStartDate && !isNaN(new Date(config.customStartDate).getTime())
                          ? format(new Date(config.customStartDate), 'dd/MM/yyyy', { locale: dateLocale })
                          : t("eventDialog.datePlaceholder")}
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
                        locale={dateLocale}
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
                        const duration = calculateDurationInMinutes(config.startTime, config.endTime);
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

            {/* Subject Selection */}
            <div className="space-y-1">
              <RequiredLabel required={!isBlocker} className="text-xs font-semibold">{t("eventDialog.subject")}</RequiredLabel>
              {isLoadingSubjects ? (
                <div className="h-8 text-xs flex items-center text-muted-foreground">
                  {t("eventDialog.loadingSubjects")}
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="h-8 text-xs flex items-center text-muted-foreground">
                  {t("eventDialog.noSubjectsAvailable")}
                </div>
              ) : (
                <SearchableSelect
                  value={config.subjectId || ''}
                  onValueChange={(value) => setConfig({ ...config, subjectId: value })}
                  options={filteredSubjects.sort((a, b) => a.name.localeCompare(b.name)).map((subject) => ({
                    value: subject.id,
                    label: subject.name
                  }))}
                  placeholder={t("eventDialog.subjectPlaceholder")}
                  searchPlaceholder={t("eventDialog.subjectSearch")}
                  emptyMessage={t("eventDialog.subjectNotFound")}
                />
              )}
            </div>

            {/* Tipo de Evento y Tipo de Grupo */}
            {config.subjectId && (
            <div className="flex gap-2">
              <div className="space-y-1 flex-1">
                <RequiredLabel required={!isBlocker} className="text-xs font-semibold">{t("eventDialog.eventType")}</RequiredLabel>
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

              {!isBlocker && (
                <div className="space-y-1 flex-1">
                  <RequiredLabel required={!isBlocker} className="text-xs font-semibold">{t("eventDialog.groupType")}</RequiredLabel>
                  <Select value={groupType} onValueChange={(value) => setGroupType(value)}>
                    <SelectTrigger className="h-8 text-xs w-full">
                      <SelectValue placeholder={t("eventDialog.selectGroupType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T">{t("eventDialog.groupTypeTheory")}</SelectItem>
                      <SelectItem value="S">{t("eventDialog.groupTypeSeminar")}</SelectItem>
                      <SelectItem value="L">{t("eventDialog.groupTypeLab")}</SelectItem>
                      <SelectItem value="TG">{t("eventDialog.groupTypeTutorial")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            )}

            {/* Groups and Classrooms Selection */}
            <div className="grid grid-cols-2 gap-2">
              {!isBlocker && (
              <div className="space-y-1">
                <RequiredLabel required={!isBlocker} className="text-xs font-semibold">{isReviewOrEval ? t("eventDialog.groups") : t("eventDialog.group")}</RequiredLabel>
                {!config.subjectId ? (
                  <div className="h-8 text-xs flex items-center text-muted-foreground border rounded px-3">
                    {t("eventDialog.selectSubjectFirst")}
                  </div>
                ) : availableGroups.length === 0 ? (
                  <div className="h-8 text-xs flex items-center text-muted-foreground border rounded px-3">
                    {t("eventDialog.noGroupsAvailable")}
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
                    placeholder={t("eventDialog.selectGroups")}
                    searchPlaceholder={t("eventDialog.groupSearch")}
                    emptyMessage={t("eventDialog.groupNotFound")}
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
                    placeholder={t("eventDialog.selectGroup")}
                    searchPlaceholder={t("eventDialog.groupSearch")}
                    emptyMessage={t("eventDialog.groupNotFound")}
                  />
                ) : (
                  <Select
                    value={config.groupIds?.[0] || ''}
                    onValueChange={(value) => {
                      setConfig({ ...config, groupIds: value ? [value] : [] });
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs w-full">
                      <SelectValue placeholder={t("eventDialog.selectGroup")} />
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
              )}

              {/* Classrooms Selection */}
              <div className={`space-y-1${isBlocker ? ' col-span-2' : ''}`}>
                <RequiredLabel required className="text-xs font-semibold">{isSpecialEventType(effectiveEventType) ? t("eventDialog.classrooms") : t("eventDialog.classroom")}</RequiredLabel>
                {classrooms.length === 0 ? (
                  <div className="h-8 text-xs flex items-center text-muted-foreground border rounded px-3">
                    {t("eventDialog.loadingClassrooms")}
                  </div>
                ) : isSpecialEventType(effectiveEventType) ? (
                  <MultiSelect
                    values={config.classroomIds || []}
                    onValuesChange={(values) => setConfig({ ...config, classroomIds: values })}
                    options={classrooms.sort((a, b) => a.code.localeCompare(b.code)).map((classroom) => ({
                      value: classroom.id,
                      label: classroom.code
                    }))}
                    placeholder={t("eventDialog.selectClassrooms")}
                    searchPlaceholder={t("eventDialog.classroomSearch")}
                    emptyMessage={t("eventDialog.classroomNotFound")}
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
                    placeholder={t("eventDialog.selectClassroom")}
                    searchPlaceholder={t("eventDialog.classroomSearch")}
                    emptyMessage={t("eventDialog.classroomNotFound")}
                  />
                ) : (
                  <Select
                    value={config.classroomIds?.[0] || ''}
                    onValueChange={(value) => {
                      setConfig({ ...config, classroomIds: value ? [value] : [] });
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs w-full">
                      <SelectValue placeholder={t("eventDialog.selectClassroom")} />
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

            {/* Planified Hours */}
            {!isSpecialEventType(effectiveEventType) && (config.frequency === 'weekly' || config.frequency === 'biweekly-even' || config.frequency === 'biweekly-odd' || config.frequency === 'custom') && config.groupIds && config.groupIds.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="planified-hours" className="text-xs font-semibold">{t("eventDialog.planifiedHours")}</Label>
                <Input
                  id="planified-hours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={config.planifiedHours || ''}
                  onChange={(e) => setConfig({ ...config, planifiedHours: parseFloat(e.target.value) || 0 })}
                  placeholder={t("eventDialog.planifiedHoursPlaceholder")}
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
                      {t("eventDialog.planifiedHoursWarning")}
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Custom Frequency Options */}
            {config.frequency === 'custom' && (
              <div className="space-y-3 p-3 border border-primary/20 rounded bg-accent/20">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">{t("eventDialog.repeatEvery")}</Label>
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
                          {config.interval === 1 ? t("eventDialog.day") : t("eventDialog.days")}
                        </SelectItem>
                        <SelectItem value="week">
                          {config.interval === 1 ? t("eventDialog.week") : t("eventDialog.weeks")}
                        </SelectItem>
                        <SelectItem value="month">
                          {config.interval === 1 ? t("eventDialog.month") : t("eventDialog.months")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {config.customFrequencyUnit === 'week' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">{t("eventDialog.daysLabel")}</Label>
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

                {config.customFrequencyUnit === 'month' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">{t("eventDialog.monthlyPattern")}</Label>
                    <Select
                      value={config.monthlyPatternType || 'day-of-month'}
                      onValueChange={(value: MonthlyPatternType) => setConfig({ ...config, monthlyPatternType: value })}
                    >
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder={t("eventDialog.selectPattern")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day-of-month">{monthlyPatternLabels.dayOfMonth}</SelectItem>
                        <SelectItem value="day-of-week">{monthlyPatternLabels.dayOfWeek}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">{t("eventDialog.endsLabel")}</Label>
                  <RadioGroup
                    value={config.endsType}
                    onValueChange={(value: EndsType) => setConfig({ ...config, endsType: value })}
                    className="space-y-2"
                  >
                    <div className={`flex items-center gap-2 p-2 rounded border transition-all cursor-pointer ${config.endsType === 'never' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-accent/20'}`}>
                      <RadioGroupItem value="never" id="never" />
                      <Label htmlFor="never" className="text-xs cursor-pointer m-0 flex-1">
                        {t("eventDialog.endsNever")}
                      </Label>
                    </div>

                    <div className={`flex items-center gap-2 p-2 rounded border transition-all cursor-pointer ${config.endsType === 'on' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-accent/20'}`}>
                      <RadioGroupItem value="on" id="on" />
                      <Label htmlFor="on" className="text-xs cursor-pointer m-0">
                        {t("eventDialog.endsOn")}
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild disabled={config.endsType !== 'on'}>
                          <Button
                            variant="ghost"
                            className="h-7 px-2 text-xs flex-1 justify-between font-normal"
                          >
                            {config.endsOnDate
                              ? format(new Date(config.endsOnDate), 'dd/MM/yyyy', { locale: dateLocale })
                              : t("eventDialog.selectDate")}
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
                            locale={dateLocale}
                            disabled={(date) => {
                              const startDate = config.customStartDate ? new Date(config.customStartDate) : new Date();
                              if (date < startDate) return true;
                              if (calendarEndDate) {
                                const endDate = new Date(calendarEndDate);
                                if (date > endDate) return true;
                              }
                              return false;
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className={`flex items-center gap-2 p-2 rounded border transition-all cursor-pointer ${config.endsType === 'after' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-accent/20'}`}>
                      <RadioGroupItem value="after" id="after" />
                      <Label htmlFor="after" className="text-xs cursor-pointer m-0">
                        {t("eventDialog.endsAfter")}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={config.endsAfterOccurrences}
                        onChange={(e) =>
                          setConfig({ ...config, endsAfterOccurrences: parseInt(e.target.value) || 1 })
                        }
                        disabled={config.endsType !== 'after'}
                        className="h-7 text-xs text-center w-14"
                      />
                      <Label className="text-xs cursor-pointer m-0">{t("eventDialog.occurrences")}</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Comment Field */}
            {config.frequency === 'no-repeat' && (
              <div className="space-y-1">
                <Label htmlFor="comment" className="text-xs font-semibold">{t("eventDialog.comment")}</Label>
                <Textarea
                  id="comment"
                  placeholder={t("eventDialog.commentPlaceholder")}
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
            {t("eventDialog.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid}
            className="h-8 text-xs"
          >
            {t("eventDialog.create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;
