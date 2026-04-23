export type Theme = 
  | 'sophisticated-dark' 
  | 'university-portal' 
  | 'academic-tech' 
  | 'minimal-research' 
  | 'modern-corporate'
  | 'classic-heritage'
  | 'scientific-journal'
  | 'government-official'
  | 'campus-bulletin';

export interface TimetableRow {
  week: number;
  startDate: string;
  endDate: string;
  intakeCode: string;
  mode: string;
}

export interface IntakeOption {
  id: string;
  date: string;
}
