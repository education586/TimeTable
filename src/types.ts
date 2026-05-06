export type Theme = 'sophisticated-dark' | 'clean-modern';

export interface TimetableRow {
  week: number;
  startDate: string;
  endDate: string;
  intakeCode: string;
  mode: string;
  isCurrent?: boolean;
  isBreak?: boolean;
  time?: string;
  trainers?: string;
}

export interface IntakeOption {
  id: string;
  date: string;
}
