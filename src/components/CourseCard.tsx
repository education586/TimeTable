import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Course } from '../types';

interface CourseCardProps {
  course: Course;
  durationDisplay: string | null;
  onSelect: (id: string | null) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, durationDisplay, onSelect }) => {
  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(course.id)}
      className="group relative flex flex-col text-left p-5 md:p-6 rounded-[1.5rem] bg-white/20 backdrop-blur-3xl border border-white/40 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.08),inset_0_1px_2px_rgba(255,255,255,0.8)] hover:shadow-[0_24px_48px_-12px_rgba(88,51,74,0.12)] hover:border-[#58334a]/30 transition-all overflow-hidden h-full"
    >
      {/* Dynamic Border Animation */}
      <motion.div
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute inset-[-100%] bg-gradient-to-r from-transparent via-[#58334a]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-2xl z-0"
      />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-6">
          <div className="w-12 h-12 rounded-xl bg-white/40 backdrop-blur-md border border-white flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:shadow-lg transition-all shadow-sm">
            <course.icon className="text-[#58334a] transition-colors" size={24} />
          </div>
          {durationDisplay && (
            <div className="px-3 py-1 bg-[#58334a]/10 border border-[#58334a]/10 rounded-full text-[10px] font-bold text-[#58334a] uppercase tracking-widest">
              {durationDisplay}
            </div>
          )}
        </div>
        <h3 className="text-[16px] md:text-[20px] font-bold font-sans text-slate-900 mb-4 tracking-[0.3px] leading-tight group-hover:text-[#58334a] transition-colors min-h-[44px] md:min-h-[52px] flex items-center">{course.name}</h3>
        <p className="text-slate-700 text-[11px] md:text-[13px] font-bold font-secondary leading-relaxed mb-4 flex-grow group-hover:text-slate-900 transition-colors drop-shadow-sm">{course.desc}</p>
        <div className="mt-auto flex items-center gap-2 text-[12px] md:text-[11px] font-bold font-sans uppercase tracking-[0.2em] text-[#58334a] group-hover:gap-3 transition-all">
          <span>Access Materials</span>
          <ArrowRight size={14} />
        </div>
      </div>
    </motion.button>
  );
};

export default CourseCard;
