import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { TimetableRow } from '../types';
import { parseDateString } from '../lib/utils';

interface TimelineProps {
  timetable: TimetableRow[];
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  rowsPerPage: number;
  setSelectedWeek: (week: TimetableRow) => void;
  setSelectedDayDetail: (detail: { day: number, month: number, year: number }) => void;
  setIsDetailModalOpen: (open: boolean) => void;
}

const Timeline = ({
  timetable,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setSelectedWeek,
  setSelectedDayDetail,
  setIsDetailModalOpen,
}: TimelineProps) => {
  const totalPages = Math.ceil(timetable.length / rowsPerPage);
  const paginatedRows = timetable.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="space-y-4 w-full">
      {/* Glassmorphism Table Container */}
      <div className="relative rounded-[32px] overflow-hidden border border-white/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.10),inset_0_1px_2px_0_rgba(255,255,255,0.9)] bg-white/40 backdrop-blur-[40px]">
        {/* Ambient light sweep */}
        <motion.div
          animate={{ x: ['-100%', '300%'] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", repeatDelay: 6 }}
          className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-35deg] z-10 opacity-50"
        />

        {/* Pagination — moved above header */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between px-8 py-3.5 border-b border-white/20 bg-white/10 backdrop-blur-[80px] relative z-20 shadow-[inset_0_-1px_0_rgba(255,255,255,0.2)]"
          >
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-sm text-[12px] font-bold uppercase tracking-[0.15em] text-slate-500 hover:text-[#58334a] hover:border-[#58334a]/20 hover:bg-white/40 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
              >
                <ArrowLeft size={16} /> Prev
              </button>

              <div className="flex items-center gap-1.5">
                {getPageNumbers().map((page, i) =>
                  page === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-[#58334a]/20 text-[11px] font-bold select-none">···</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={`w-9 h-9 rounded-xl text-[12px] font-bold transition-all duration-200 ${
                        currentPage === page
                          ? 'bg-[#58334a] text-white shadow-lg shadow-purple-900/20 border border-[#58334a]'
                          : 'bg-white/20 backdrop-blur-md border border-white/30 text-slate-500 hover:text-[#58334a] hover:bg-white/40 hover:border-[#58334a]/20'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 shadow-sm text-[13px] font-bold uppercase tracking-[0.15em] text-slate-500 hover:text-[#58334a] hover:border-[#58334a]/20 hover:bg-white/40 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Header Row */}
        <div className="grid grid-cols-[1fr_2fr] md:grid-cols-[1fr_2fr_2fr] px-4 md:px-8 py-3.5 border-b border-white/20 bg-white/5 backdrop-blur-[80px] relative z-20 shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">
          <span className="text-[13px] md:text-[16px] font-bold font-sans text-[#58334a] tracking-[0.1em]">Weeks</span>
          <span className="text-[13px] md:text-[16px] font-bold font-sans text-[#58334a] tracking-[0.1em]">Intakes Dates</span>
          <span className="hidden md:block text-[16px] font-bold font-sans text-[#58334a] tracking-[0.1em]">Unit of Competency Code</span>
        </div>

        {/* Card Rows */}
        <div className="divide-y divide-white/30 relative z-20">
          {paginatedRows.map((row, idx) => (
            <motion.div
              key={row.week}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => {
                setSelectedWeek(row);
                const weekStart = parseDateString(row.startDate);
                const targetDate = new Date(weekStart);
                const day = targetDate.getDay();
                if (day === 0) {
                  targetDate.setDate(targetDate.getDate() + 1);
                } else if (day !== 1) {
                  targetDate.setDate(targetDate.getDate() - (day - 1));
                }
                setSelectedDayDetail({ day: targetDate.getDate(), month: targetDate.getMonth(), year: targetDate.getFullYear() });
                setIsDetailModalOpen(true);
              }}
              className={`group cursor-pointer grid grid-cols-[1fr_2fr] md:grid-cols-[1fr_2fr_2fr] items-center px-4 md:px-8 py-3.5
                transition-all duration-300
                hover:bg-white/50
                ${row.isCurrent
                  ? 'bg-gradient-to-r from-[#58334a]/[0.06] via-white/30 to-white/20'
                  : 'bg-white/10'
                }`}
            >
              {/* Week number */}
              <span className={`font-body text-[13px] md:text-[15px] font-bold ${row.isBreak ? 'text-slate-300' : 'text-slate-900 group-hover:text-[#58334a] transition-colors'}`}>
                {row.week.toString().padStart(2, '0')}
              </span>

              {/* Intake Dates / Unit Code (Combined for mobile) */}
              <div className="flex flex-col gap-1">
                <span className={`font-body text-[12px] md:text-[14px] font-bold ${row.isBreak ? 'text-slate-400' : 'text-slate-900'}`}>
                  {row.startDate} - {row.endDate}
                </span>
                <span className="md:hidden text-[11px] font-bold text-slate-500 truncate">
                  {row.isBreak ? 'Institutional Recess' : row.intakeCode}
                </span>
                {row.isCurrent && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="relative flex items-center justify-center w-2.5 h-2.5">
                      <div className="absolute inset-0 rounded-full border border-emerald-500/40" />
                      <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Active</span>
                  </div>
                )}
              </div>

              {/* Unit Code (Desktop only) */}
              <span className={`hidden md:block font-body text-[15px] font-bold ${row.isBreak ? 'text-slate-300' : 'text-slate-900'}`}>
                {row.isBreak ? 'Institutional Recess' : row.intakeCode}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
