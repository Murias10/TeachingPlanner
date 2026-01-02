export type FrequencyType = 'no-repeat' | 'weekly' | 'biweekly-even' | 'biweekly-odd' | 'custom';
export type WeekDay = 'L' | 'M' | 'X' | 'J' | 'V' | 'S' | 'D';
export type EndsType = 'never' | 'on' | 'after';
export type CustomFrequencyUnit = 'day' | 'week' | 'month';
export type MonthlyPatternType = 'day-of-month' | 'day-of-week'; // day-of-month: día del mes (ej: 15), day-of-week: día de la semana (ej: segundo martes)

export interface RecurrenceConfig {
  frequency: FrequencyType;
  interval: number;
  weekDays: WeekDay[];
  endsType: EndsType;
  endsOnDate: string;
  endsAfterOccurrences: number;
  startTime: string;
  endTime: string;
  planifiedHours: number; // Total hours planned for the event
  eventCharacter?: string; // Event character (N, P, I, or custom) - set automatically based on frequency
  // Puntual event fields (only used when frequency === 'no-repeat')
  eventDate?: string; // YYYY-MM-DD format
  // Custom frequency fields (only used when frequency === 'custom')
  customStartDate?: string; // YYYY-MM-DD format, start date for custom frequency
  customFrequencyUnit?: CustomFrequencyUnit; // 'day', 'week', or 'month'
  // Monthly pattern fields (only used when customFrequencyUnit === 'month')
  monthlyPatternType?: MonthlyPatternType; // 'day-of-month' or 'day-of-week' - calculated from customStartDate
  subjectId?: string;
  groupIds?: string[];
  classroomIds?: string[];
  comment: string; // Comment field for puntual events
}
