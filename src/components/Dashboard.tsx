import { motion } from 'motion/react';
import { Calendar, Download, Loader2 } from 'lucide-react';
import Timeline from './Timeline';
import CourseCard from './CourseCard';
import { TimetableRow, Course } from '../types';

interface DashboardProps {
  selectedCourseId: string | null;
  setSelectedCourseId: (id: string | null) => void;
  filteredCourses: Course[];
  uploadedData: any;
  selectedUploadedIntake: number;
  selectedIntake: any;
  timetable: TimetableRow[];
  handleCapture: () => void;
  isCapturing: boolean;
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  rowsPerPage: number;
  setSelectedWeek: (week: TimetableRow) => void;
  setSelectedDayDetail: (detail: { day: number, month: number, year: number }) => void;
  setIsDetailModalOpen: (open: boolean) => void;
  activeTab: string;
}

const Dashboard = ({
  selectedCourseId,
  setSelectedCourseId,
  filteredCourses,
  uploadedData,
  selectedUploadedIntake,
  selectedIntake,
  timetable,
  handleCapture,
  isCapturing,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setSelectedWeek,
  setSelectedDayDetail,
  setIsDetailModalOpen,
}: DashboardProps) => {

  const renderCoursesDashboard = () => {
    if (selectedCourseId) {
      const activeCourse = filteredCourses.find(c => c.id === selectedCourseId);
      if (!activeCourse) {
        setSelectedCourseId(null);
        return null;
      }

      const intakeName = uploadedData && selectedCourseId && uploadedData[selectedCourseId]
        ? uploadedData[selectedCourseId][selectedUploadedIntake]?.name ?? ''
        : selectedIntake?.date ?? '';

      // Improved week detection
      let totalWeeks = 0;
      const weekRegex = /(\d+)\s*([Ww]eek|[Ww])/i;
      const weekMatch = intakeName.match(weekRegex);
      if (weekMatch) {
        totalWeeks = parseInt(weekMatch[1]);
      } else {
        if (uploadedData && selectedCourseId && uploadedData[selectedCourseId]) {
          for (const sheet of uploadedData[selectedCourseId]) {
            const sm = sheet.name.match(weekRegex);
            if (sm) {
              totalWeeks = parseInt(sm[1]);
              break;
            }
          }
        }
        
        if (totalWeeks === 0 || totalWeeks < 10) {
          const courseMatch = (activeCourse.name + ' ' + activeCourse.desc).match(weekRegex);
          if (courseMatch) {
            totalWeeks = parseInt(courseMatch[1]);
          } else {
            const maxWeekInData = timetable.length > 0 ? Math.max(...timetable.map(r => r.week)) : 0;
            if (maxWeekInData > 0) {
              totalWeeks = maxWeekInData;
            } else if (timetable.length > 0) {
              totalWeeks = timetable.length;
            } else {
              totalWeeks = 52;
            }
          }
        }
      }

      return (
        <div className="space-y-[16px] md:space-y-[24px] mt-[8px] md:mt-[24px] w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-[24px] border-b border-[#ebe9e4] pb-5 md:pb-[24px]"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-[20px] overflow-hidden border border-white/50 bg-white/40 backdrop-blur-[40px] shadow-[0_8px_32px_-8px_rgba(88,51,74,0.10),inset_0_1px_2px_0_rgba(255,255,255,0.9)] px-4 md:px-5 py-3.5 flex items-center gap-3 md:gap-4 ml-0 mr-auto"
            >
              <motion.div
                animate={{ x: ['-100%', '300%'] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", repeatDelay: 8 }}
                className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-35deg] z-10 opacity-50"
              />
              <div className="w-9 h-9 rounded-xl bg-[#58334a] flex items-center justify-center shadow-lg shadow-purple-900/15 flex-shrink-0 relative z-20">
                <Calendar className="text-white w-3.5 h-3.5" />
              </div>
              <div className="relative z-20 text-left">
                <p className="text-[11px] font-bold font-sans uppercase tracking-[0.25em] text-slate-800 mb-0.5">Study Duration</p>
                <p className="text-[18px] font-bold font-sans text-slate-900 leading-none">
                  {totalWeeks} <span className="text-[12px] font-bold font-sans text-slate-600 uppercase tracking-widest ml-1">Weeks</span>
                </p>
              </div>
            </motion.div>

            <div className="flex items-center gap-4 md:gap-5">
              <button
                onClick={handleCapture}
                disabled={isCapturing}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#58334a] text-white rounded-2xl font-medium text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-purple-900/15 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 font-sans"
              >
                {isCapturing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                <span>Secure Export</span>
              </button>
            </div>
          </motion.div>

          <div className="">
            <Timeline 
              timetable={timetable}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              rowsPerPage={rowsPerPage}
              setSelectedWeek={setSelectedWeek}
              setSelectedDayDetail={setSelectedDayDetail}
              setIsDetailModalOpen={setIsDetailModalOpen}
            />
          </div>
        </div>
      );
    }

    const containerVariants = {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.08,
          delayChildren: 0.1
        }
      }
    };

    return (
      <div className="space-y-6 w-full flex flex-col items-start p-0 md:p-[10px]">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.05 }}
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-[20px] md:mt-[30px]"
        >
          {filteredCourses.map((course) => {
            const uploads = uploadedData?.[course.id];
            const weeksList = uploads && uploads.length > 0
              ? uploads.map((u: any) => {
                  const m = u.name.match(/(\d+)\s*[Ww]eeks?/i);
                  return m ? parseInt(m[1]) : u.rows.length;
                })
              : null;
            
            const durationDisplay = weeksList
              ? (weeksList.length === 1 || Math.min(...weeksList) === Math.max(...weeksList)
                  ? `${weeksList[0]} Weeks`
                  : `${Math.min(...weeksList)}-${Math.max(...weeksList)} Weeks`)
              : null;

            return (
              <CourseCard 
                key={course.id}
                course={course}
                durationDisplay={durationDisplay}
                onSelect={setSelectedCourseId}
              />
            );
          })}
        </motion.div>
      </div>
    );
  };

  return renderCoursesDashboard();
};

export default Dashboard;
