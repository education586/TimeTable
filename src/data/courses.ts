import { Globe, Layout, BookOpen } from 'lucide-react';
import { Course } from '../types';

export const COURSES: Course[] = [
  { id: 'c3cc', name: 'Certificate III in Commercial Cookery (SIT30821)', color: 'bg-emerald-500', icon: Globe, desc: 'Professional certification (52 Weeks) for aspiring commercial chefs in diverse kitchen environments.' },
  { id: 'c4km', name: 'Certificate IV in Kitchen Management (SIT40521)', color: 'bg-indigo-600', icon: Layout, desc: 'Advanced leadership (104 Weeks) and operational management for large-scale culinary operations.' },
  { id: 'c3pat', name: 'Certificate III in Patisserie (SIT30121)', color: 'bg-rose-500', icon: BookOpen, desc: 'Specialized training (52 Weeks) in fine pastries, desserts, and bakery production management.' },
  { id: 'c4pat', name: 'Certificate IV in Patisserie (SIT40721)', color: 'bg-violet-600', icon: Globe, desc: 'Expert-level patisserie techniques (104 Weeks) and strategic boutique management.' },
  { id: 'nsdhm', name: 'Diploma of Hospitality Management (SIT50422)', color: 'bg-sky-600', icon: Layout, desc: 'Comprehensive management training (52 Weeks) for the global hospitality and services sector.' },
  { id: 'nsadv', name: 'Advanced Diploma of Hospitality Management (SIT60322)', color: 'bg-amber-600', icon: BookOpen, desc: 'Executive-level leadership development (104 Weeks) for senior hospitality administration.' },
  { id: 'csdhm', name: 'Diploma of Hospitality Management (Cookery) (SIT50422)', color: 'bg-slate-800', icon: Globe, desc: 'Specialized management path (52 Weeks) for cookery professionals transition to operations.' },
  { id: 'csadv', name: 'Advanced Diploma of Hospitality Management (Cookery) (SIT60322)', color: 'bg-slate-900', icon: Layout, desc: 'Advanced executive leadership (104 Weeks) for commercial cookery and hospitality operations.' },
  { id: 'psdhm', name: 'Diploma of Hospitality Management (Patisserie) (SIT50422)', color: 'bg-rose-600', icon: BookOpen, desc: 'Operational management training (52 Weeks) tailored for specialized patisserie environments.' },
  { id: 'psadv', name: 'Advanced Diploma of Hospitality Management (Patisserie) (SIT60322)', color: 'bg-rose-900', icon: Layout, desc: 'High-level strategic management (104 Weeks) for premium patisserie and confectionery sectors.' },
];

export const getWeekDates = (startDateStr: string, weekIndex: number) => {
  const start = new Date(startDateStr);
  start.setDate(start.getDate() + (weekIndex * 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const format = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
  return { start: format(start), end: format(end) };
};
