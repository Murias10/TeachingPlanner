export type FrequencyType = 'no-repeat' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
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
}
