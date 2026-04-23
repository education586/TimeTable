import { IntakeOption } from './types';

export const INTAKE_OPTIONS: IntakeOption[] = [
  { id: '1', date: '11 May 2026' },
  { id: '2', date: '22 June 2026' },
  { id: '3', date: '6 July 2026' },
  { id: '4', date: '27 July 2026' },
  { id: '5', date: '17 Aug 2026' },
  { id: '6', date: '7 Sept 2026' },
  { id: '7', date: '28 Sept 2026' },
  { id: '8', date: '12 Oct 2026' },
  { id: '9', date: '2 Nov 2026' },
  { id: '10', date: '16 Nov 2026' },
  { id: '11', date: '7 Dec 2026' },
];

export const MODULE_MAPPING: { [key: number]: string } = {
  1: 'SITTTTVL001',
  2: 'SITTTTVL001',
  3: 'SITTTTVL001',
  4: 'SITXINV007',
  5: 'SITXINV007',
  6: 'SITXWHS007',
  7: 'SITXWHS007',
  8: 'SITXWHS007',
  9: 'SITXHRM008',
  10: 'SITXHRM008',
  11: 'SITXHRM008',
  12: 'SITXCOM007',
  13: 'SITXCOM007',
  14: 'SITXFIN003',
  15: 'SITXFIN003',
  16: 'SITXGLC001',
  17: 'SITXGLC001',
  18: 'SITXMGT001',
  19: 'SITXMGT001',
  20: 'SITXMGT001',
};

export const DEFAULT_MODE = 'Face to Face Live Stream';

export const COURSE_NAME = 'Advanced Diploma of Hospitality Management';
