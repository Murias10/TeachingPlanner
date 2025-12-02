export type FrequencyType = 'no-repeat' | 'weekly' | 'custom';
export type WeekDay = 'L' | 'M' | 'X' | 'J' | 'V' | 'S' | 'D';
export type EndsType = 'never' | 'on' | 'after';

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
  // Puntual event fields (only used when frequency === 'no-repeat')
  eventDate?: string; // YYYY-MM-DD format
  subjectId?: string;
  groupIds?: string[];
  classroomIds?: string[];
  comment: string; // Comment field for puntual events
}
