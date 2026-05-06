import { motion } from 'motion/react';
import { Course } from '../types';

interface HeaderProps {
  activeTab: string;
  selectedCourseId: string | null;
  filteredCourses: Course[];
}

const Header = ({ activeTab, selectedCourseId, filteredCourses }: HeaderProps) => {
  const activeCourse = selectedCourseId ? filteredCourses.find(c => c.id === selectedCourseId) : null;

  return (
    <header className={`w-full flex flex-col md:flex-row md:items-center justify-start md:justify-between gap-6 mb-2 text-left relative overflow-hidden p-5 md:p-6 rounded-[1.5rem] bg-[#58334a]/[0.02] border border-[#58334a]/5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)] ${(activeTab === 'dashboard' && !selectedCourseId) ? 'min-h-[280px]' : 'min-h-[190px]'}`}>
      {/* Branded Banner Background */}
      <div className="absolute inset-0 z-[1] opacity-50 pointer-events-none">
        <img
          src="https://tan-occasional-flamingo-688.mypinata.cloud/ipfs/bafybeiftrwk66i2xev4rrotd4ss6sr2tykflx5vxuljrasdc5satuukria"
          alt=""
          className="w-full h-full object-cover scale-110 blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f0ede8] via-transparent to-[#f0ede8]" />
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex flex-col text-left">
          <h1 className="course-heading text-slate-900 leading-tight">
            {activeTab === 'dashboard' ? (selectedCourseId ? (activeCourse?.name || 'Schedule Explorer') : 'Academic Timetable') :
              activeTab === 'lms' ? 'LMS Dashboard' :
                activeTab === 'moodle' ? 'SMS Dashboard' :
                  activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>
          {activeTab === 'dashboard' && selectedCourseId && activeCourse && (
            <p className="course-desc text-slate-900 mt-2 font-bold leading-relaxed text-left">
              {activeCourse.desc}
            </p>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
