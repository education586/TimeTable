import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Calendar, User as UserIcon, Download, Coffee } from 'lucide-react';
import { TimetableRow } from '../types';
import { parseDateString, getCalendarDays } from '../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWeek: TimetableRow | null;
  selectedDayDetail: { day: number, month: number, year: number } | null;
  setSelectedDayDetail: (detail: { day: number, month: number, year: number }) => void;
}

const DetailModal = ({
  isOpen,
  onClose,
  selectedWeek,
  selectedDayDetail,
  setSelectedDayDetail
}: DetailModalProps) => {
  if (!selectedWeek) return null;

  const DEMO_TRAINERS = ['Demo', 'Demo'];
  const DEMO_TIMES = [
    '08:30 AM - 04:30 PM',
    '09:00 AM - 05:00 PM',
    '08:00 AM - 04:00 PM',
    '09:30 AM - 05:30 PM',
    '08:30 AM - 03:30 PM',
  ];
  const demoTime = DEMO_TIMES[(selectedWeek.week - 1) % DEMO_TIMES.length];
  const demoTrainer = DEMO_TRAINERS[(selectedWeek.week - 1) % DEMO_TRAINERS.length];

  let isNoClassToday = false;
  let isWeekendStatus = false;
  
  if (selectedDayDetail) {
    const d = new Date(selectedDayDetail.year, selectedDayDetail.month, selectedDayDetail.day);
    const dayOfWeek = d.getDay();
    isWeekendStatus = dayOfWeek === 0 || dayOfWeek === 6;
    
    const classCountOptions = [2, 3, 2, 3, 3, 2, 3, 2, 2, 3];
    const classCount = classCountOptions[(selectedWeek.week - 1) % classCountOptions.length];
    const dayPickOptions: Record<number, number[]> = {
      2: [[1,3],[2,4],[1,4],[2,5],[3,5],[1,5]][(selectedWeek.week - 1) % 6],
      3: [[1,3,5],[2,4,5],[1,2,4],[1,3,4],[2,3,5],[1,2,5]][(selectedWeek.week - 1) % 6],
    };
    const classDays: number[] = (dayPickOptions as any)[classCount] || [1,3];
    const isClassDay = !isWeekendStatus && classDays.includes(dayOfWeek);
    
    if (isWeekendStatus || !isClassDay) {
      isNoClassToday = true;
    }
  }

  const handleDownload = async () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80);
    doc.text(`Week ${selectedWeek.week} - Session Detail`, 105, 15, { align: 'center' });
    autoTable(doc, {
      startY: 25,
      head: [['Field', 'Detail']],
      body: [
        ['Unit Code', selectedWeek.intakeCode],
        ['Date Range', `${selectedWeek.startDate} - ${selectedWeek.endDate}`],
        ['Schedule', selectedWeek.time || demoTime],
        ['Faculty', selectedWeek.trainers || demoTrainer],
      ],
      theme: 'grid',
      headStyles: { fillColor: [88, 51, 74], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
    });
    doc.save(`Week_${selectedWeek.week}_${selectedWeek.startDate}.pdf`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-6 md:p-12 overflow-hidden font-body text-left">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-5xl h-full max-h-[85vh] flex flex-col md:flex-row shadow-[0_80px_150px_-30px_rgba(0,0,0,0.4)] rounded-[3.5rem] overflow-hidden bg-white/95 lg:bg-white/90 backdrop-blur-[100px] border border-white/40"
          >
            {/* Left Side - Calendar Grid View */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-10 min-h-[80px]">
                <div className="flex items-center gap-10">
                  <h2 className="text-[32px] font-sans font-bold tracking-[0.1px] leading-none flex items-baseline select-none text-slate-900">
                    {(() => {
                      const start = parseDateString(selectedWeek.startDate);
                      const end = parseDateString(selectedWeek.endDate);
                      return `${start.getDate()} - ${end.getDate()}`;
                    })()}
                    <span className="text-[24px] font-sans font-bold ml-4 text-slate-600">
                      {(() => {
                        const d = parseDateString(selectedWeek.startDate);
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return months[d.getMonth()];
                      })()}
                    </span>
                  </h2>

                  <div className="h-12 w-[2px] bg-slate-200 hidden md:block" />

                  <div className="flex flex-col">
                    <p className="text-[14px] font-sans font-bold uppercase tracking-[0.3em] text-[#58334a] leading-none mb-1.5 opacity-80">Schedule</p>
                    <p className="text-[30px] font-sans font-bold tracking-[0.5px] text-slate-900 uppercase leading-none">Week {selectedWeek.week.toString().padStart(2, '0')}</p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-4 hover:bg-slate-100 rounded-full transition-all group"
                >
                  <X size={24} className="opacity-30 group-hover:opacity-100 transition-all" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-4 mb-4">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                  <div key={day} className={`text-center text-[14px] font-bold tracking-[0.3em] ${day === 'SAT' || day === 'SUN' ? 'text-slate-400' : 'text-slate-500'}`}>{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-4 md:gap-5">
                {(() => {
                  const classCountOptions = [2, 3, 2, 3, 3, 2, 3, 2, 2, 3];
                  const classCount = classCountOptions[(selectedWeek.week - 1) % classCountOptions.length];
                  const dayPickOptions: Record<number, number[]> = {
                    2: [[1,3],[2,4],[1,4],[2,5],[3,5],[1,5]][(selectedWeek.week - 1) % 6],
                    3: [[1,3,5],[2,4,5],[1,2,4],[1,3,4],[2,3,5],[1,2,5]][(selectedWeek.week - 1) % 6],
                  };
                  const classDays: number[] = (dayPickOptions as any)[classCount] || [1,3];

                  return getCalendarDays(parseDateString(selectedWeek.startDate)).map((dayObj, idx) => {
                    const currentDay = new Date(dayObj.year, dayObj.month, dayObj.day);
                    const weekStart = parseDateString(selectedWeek.startDate);
                    const weekEnd = parseDateString(selectedWeek.endDate);
                    const isInWeek = currentDay >= weekStart && currentDay <= weekEnd;
                    const dayOfWeek = currentDay.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const isClassDay = isInWeek && !isWeekend && classDays.includes(dayOfWeek);
                    const isToday = currentDay.toDateString() === new Date().toDateString();
                    const isSelected = selectedDayDetail?.day === dayObj.day && selectedDayDetail?.month === dayObj.month && selectedDayDetail?.year === dayObj.year;

                    return (
                      <button
                        key={idx}
                        disabled={!dayObj.isCurrentMonth}
                        onClick={() => dayObj.isCurrentMonth && setSelectedDayDetail({ day: dayObj.day, month: dayObj.month, year: dayObj.year })}
                        className={`aspect-square rounded-[1.5rem] p-4 flex flex-col items-center justify-center relative transition-all duration-300 group/day ${
                          !dayObj.isCurrentMonth
                            ? 'opacity-5 cursor-default'
                            : isWeekend
                              ? 'opacity-60 cursor-not-allowed bg-slate-50/50 border border-slate-100'
                              : isSelected
                                ? 'bg-[#58334a] text-white shadow-2xl scale-105 z-10'
                                : isClassDay
                                  ? 'bg-[#58334a]/10 text-[#58334a] hover:bg-[#58334a]/20 cursor-pointer'
                                  : 'bg-[#f7f6f3] border border-[#ebe9e4] hover:bg-white hover:border-[#58334a]/30 cursor-pointer'
                        } ${isToday && !isSelected ? 'ring-2 ring-[#58334a]' : ''} active:scale-95`}
                      >
                        <span className={`text-xl md:text-2xl font-bold ${
                          isSelected ? 'text-white' :
                            isWeekend ? 'text-slate-400' :
                              isClassDay ? 'text-[#58334a]' : 'text-slate-900'
                        }`}>
                          {dayObj.day}
                        </span>
                        {isClassDay && !isSelected && (
                          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#58334a]/40" />
                        )}
                        {isClassDay && !isSelected && (
                          <span className="text-[7px] font-bold uppercase tracking-widest text-[#58334a]/50 mt-0.5">Class</span>
                        )}
                      </button>
                    );
                  })
                })()}
              </div>
            </div>

            {/* Right Side - Information Panel */}
            <div className="w-full md:w-[420px] p-8 md:p-12 border-t md:border-t-0 md:border-l bg-[#f7f6f3] border-[#ebe9e4] flex flex-col relative overflow-y-auto custom-scrollbar">
              <div className="space-y-12">
                <div className="min-h-[80px] flex flex-col justify-center text-left">
                  <p className="text-[18px] font-bold tracking-[0.3em] text-[#58334a]">
                    Weekly Session Details
                  </p>
                  <div className="h-0.5 w-16 bg-[#58334a]/60 rounded-full mt-3" />
                </div>

                <div className="space-y-6">
                  {isNoClassToday ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                      <div className="w-24 h-24 rounded-[3rem] bg-white flex items-center justify-center mb-8 border border-white shadow-md">
                        <Coffee size={40} className="text-[#58334a]/20" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">No Classes Today</h3>
                      <p className="text-slate-500 font-bold mb-10 max-w-[240px] text-[11px] leading-relaxed uppercase tracking-[0.2em]">
                        {isWeekendStatus ? 'Scheduled Weekend Break' : 'Non-Teaching Academic Day'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6 text-left">
                      {/* Unit Card */}
                      <div className="p-[35px] rounded-[3rem] bg-white border border-white/60 shadow-sm relative group">
                        <div className="flex justify-between items-start mb-4">
                          <p className="text-[16px] font-bold tracking-[0.15em] text-slate-500">Unit of Competency Code</p>
                          <Globe size={22} className="text-slate-400 group-hover:text-[#58334a] transition-colors" />
                        </div>
                        <p className="text-[22px] font-bold text-[#58334a] tracking-[-0.02em] leading-tight uppercase">{selectedWeek.intakeCode}</p>
                      </div>

                      {/* Schedule Card */}
                      <div className="p-[25px] rounded-[3rem] bg-white border border-white/60 shadow-sm relative group">
                        <div className="flex justify-between items-start mb-4">
                          <p className="text-[16px] font-bold tracking-[0.15em] text-slate-500">Schedule Time Period</p>
                          <Calendar size={22} className="text-slate-400 group-hover:text-[#58334a] transition-colors" />
                        </div>
                        <p className="text-[22px] font-bold text-slate-800 tracking-[-0.02em] leading-tight">{selectedWeek.time || demoTime}</p>
                      </div>

                      {/* Faculty Card */}
                      <div className="p-[25px] rounded-[3rem] bg-white border border-white/60 shadow-sm relative group">
                        <div className="flex justify-between items-start mb-4">
                          <p className="text-[16px] font-bold tracking-[0.15em] text-slate-500">Trainers</p>
                          <UserIcon size={22} className="text-slate-400 group-hover:text-[#58334a] transition-colors" />
                        </div>
                        <p className="text-[22px] font-bold text-slate-800 tracking-[-0.02em] leading-tight">{selectedWeek.trainers || demoTrainer}</p>
                      </div>
                    </div>
                  )}

                  {!isNoClassToday && (
                    <div className="pt-6">
                      <button
                        onClick={handleDownload}
                        className="w-full py-6 rounded-[2rem] bg-[#58334a] text-white text-[14px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-purple-900/30 hover:bg-[#6b3f5a] transition-all hover:scale-[1.02] active:scale-[0.98] font-sans"
                      >
                        <Download size={18} />
                        Download Week {selectedWeek.week}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DetailModal;
