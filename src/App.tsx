/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  Calendar, 
  ChevronDown, 
  Download,
  Layout,
  AlignLeft,
  Columns,
  Loader2,
  GraduationCap,
  Briefcase,
  BookOpen,
  FileText,
  Shield,
  Newspaper,
  ScrollText
} from 'lucide-react';
import { INTAKE_OPTIONS, MODULE_MAPPING, DEFAULT_MODE, COURSE_NAME } from './constants';
import { TimetableRow, Theme } from './types';

// Helper to format date and add weeks
const getWeekDates = (startDateStr: string, weekIndex: number) => {
  const start = new Date(startDateStr);
  start.setDate(start.getDate() + (weekIndex * 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const format = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
  return { start: format(start), end: format(end) };
};

export default function App() {
  const [selectedIntake, setSelectedIntake] = useState(INTAKE_OPTIONS[2]);
  const [currentTheme, setCurrentTheme] = useState<Theme>('sophisticated-dark');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const timetableRef = useRef<HTMLDivElement>(null);

  const timetable = useMemo(() => {
    const rows: TimetableRow[] = [];
    for (let i = 0; i < 20; i++) {
      const dates = getWeekDates(selectedIntake.date, i);
      rows.push({
        week: i + 1,
        startDate: dates.start,
        endDate: dates.end,
        intakeCode: MODULE_MAPPING[i + 1] || 'TBA',
        mode: DEFAULT_MODE
      });
    }
    return rows;
  }, [selectedIntake]);

  const handleCapture = async () => {
    if (!timetableRef.current) return;
    setIsCapturing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const element = timetableRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: currentTheme === 'sophisticated-dark' ? '#09090b' : '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${currentTheme}_Academic_Schedule.pdf`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCapturing(false);
    }
  };

  const designs = [
    { id: 'sophisticated-dark' as Theme, name: 'Executive Dark', icon: <Layout size={14} /> },
    { id: 'university-portal' as Theme, name: 'Uni Portal', icon: <GraduationCap size={14} /> },
    { id: 'academic-tech' as Theme, name: 'Tech Grid', icon: <Columns size={14} /> },
    { id: 'minimal-research' as Theme, name: 'Minimalist', icon: <AlignLeft size={14} /> },
    { id: 'modern-corporate' as Theme, name: 'Corporate', icon: <Briefcase size={14} /> },
    { id: 'classic-heritage' as Theme, name: 'Heritage', icon: <BookOpen size={14} /> },
    { id: 'scientific-journal' as Theme, name: 'Journal', icon: <FileText size={14} /> },
    { id: 'government-official' as Theme, name: 'Official', icon: <Shield size={14} /> },
    { id: 'campus-bulletin' as Theme, name: 'Bulletin', icon: <Newspaper size={14} /> },
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-700 ease-in-out pb-32 md:pb-24 ${
      currentTheme === 'sophisticated-dark' ? 'bg-zinc-950 text-zinc-300 font-sans' :
      currentTheme === 'university-portal' ? 'bg-[#f0f2f5] text-slate-800 font-["Inter"]' :
      currentTheme === 'academic-tech' ? 'bg-[#F1F5F9] font-["JetBrains_Mono"]' :
      currentTheme === 'classic-heritage' ? 'bg-[#fdfcf7] text-emerald-950 font-serif' :
      currentTheme === 'modern-corporate' ? 'bg-white text-slate-900 font-["Inter"]' :
      currentTheme === 'scientific-journal' ? 'bg-white font-["JetBrains_Mono"]' :
      currentTheme === 'government-official' ? 'bg-slate-50 font-["Public_Sans"]' :
      currentTheme === 'campus-bulletin' ? 'bg-[#fef9f2] text-amber-900 font-["Inter"]' :
      'bg-white text-stone-800 font-["Public_Sans"]'
    }`}>
      
      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-12">
        <div ref={timetableRef} className={`max-w-6xl mx-auto shadow-none ${
          currentTheme === 'sophisticated-dark' ? 'space-y-10' :
          currentTheme === 'university-portal' ? 'space-y-8' :
          currentTheme === 'classic-heritage' ? 'space-y-12 border-double border-4 border-emerald-900/20 p-12' :
          currentTheme === 'modern-corporate' ? 'space-y-0 text-center max-w-5xl' :
          currentTheme === 'scientific-journal' ? 'space-y-4 max-w-4xl border-x border-slate-200 px-8' :
          currentTheme === 'government-official' ? 'space-y-0 border-4 border-slate-900 p-2' :
          currentTheme === 'campus-bulletin' ? 'space-y-6 bg-white p-10 rounded-3xl border-4 border-dashed border-amber-200' :
          'space-y-0 border-t-2 border-stone-800 pt-10'
        }`}>
          
          {/* Layout Variant: Header */}
          <header className={`flex flex-col gap-6 ${
            currentTheme === 'sophisticated-dark' ? 'md:flex-row md:items-end justify-between border-b border-zinc-800 pb-8' :
            currentTheme === 'university-portal' ? 'bg-white p-8 rounded-2xl shadow-sm border border-slate-200 md:flex-row md:items-center justify-between' :
            currentTheme === 'classic-heritage' ? 'items-center text-center pb-12 border-b-2 border-emerald-900/30' :
            currentTheme === 'modern-corporate' ? 'bg-slate-900 text-white p-12 md:flex-row md:items-center justify-between rounded-t-3xl' :
            currentTheme === 'scientific-journal' ? 'border-b-4 border-black pb-4' :
            currentTheme === 'government-official' ? 'bg-slate-900 text-white p-10 mb-8 flex-row items-center justify-between' :
            currentTheme === 'campus-bulletin' ? 'md:flex-row md:items-center justify-between bg-amber-50 p-8 rounded-2xl border-2 border-amber-100' :
            'pb-12 border-b border-stone-200'
          }`}>
            <div className={`space-y-1 ${currentTheme === 'modern-corporate' || currentTheme === 'sophisticated-dark' || currentTheme === 'minimal-research' ? 'text-left' : ''}`}>
              <div className="flex items-center gap-3">
                 {currentTheme === 'classic-heritage' && <ScrollText className="text-emerald-800" size={32} />}
                 <h1 className={`${
                  currentTheme === 'sophisticated-dark' ? 'text-zinc-50 text-4xl font-serif italic' :
                  currentTheme === 'university-portal' ? 'text-3xl font-bold text-slate-900 tracking-tight' :
                  currentTheme === 'classic-heritage' ? 'text-5xl font-bold text-emerald-950 uppercase tracking-tight' :
                  currentTheme === 'modern-corporate' ? 'text-3xl font-black uppercase tracking-tighter' :
                  currentTheme === 'scientific-journal' ? 'text-2xl font-black' :
                  currentTheme === 'government-official' ? 'text-4xl font-black uppercase' :
                  currentTheme === 'campus-bulletin' ? 'text-4xl font-black text-amber-950' :
                  'text-5xl font-extrabold text-stone-900 uppercase tracking-tighter italic'
                }`}>
                  Academic Schedule
                </h1>
               </div>
              <p className={`${
                currentTheme === 'sophisticated-dark' ? 'text-amber-500/80 text-sm font-medium tracking-wide font-mono uppercase' :
                currentTheme === 'university-portal' ? 'text-blue-600 font-bold text-sm' :
                currentTheme === 'classic-heritage' ? 'text-emerald-700 italic text-xl font-serif mt-2' :
                currentTheme === 'modern-corporate' ? 'text-slate-400 font-bold tracking-widest text-xs uppercase' :
                currentTheme === 'scientific-journal' ? 'text-slate-500 text-xs italic' :
                currentTheme === 'government-official' ? 'text-slate-400 font-bold' :
                currentTheme === 'campus-bulletin' ? 'text-amber-600 font-bold italic' :
                'text-stone-500 text-lg'
              }`}>
                {COURSE_NAME}
              </p>
            </div>

            <button 
              onClick={handleCapture}
              disabled={isCapturing}
              className={`flex items-center gap-2 px-6 py-2.5 transition-all active:scale-95 disabled:opacity-50 ${
                currentTheme === 'sophisticated-dark' ? 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded hover:bg-zinc-800' :
                currentTheme === 'university-portal' ? 'bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700' :
                currentTheme === 'classic-heritage' ? 'bg-emerald-900 text-white rounded-none border-b-4 border-emerald-950 px-10' :
                currentTheme === 'modern-corporate' ? 'bg-white text-slate-900 font-black rounded-full' :
                currentTheme === 'scientific-journal' ? 'border-2 border-black font-black uppercase text-sm' :
                currentTheme === 'government-official' ? 'bg-lime-400 text-slate-900 font-black uppercase italic' :
                currentTheme === 'campus-bulletin' ? 'bg-amber-950 text-white rounded-2xl' :
                'bg-stone-900 text-white font-bold hover:bg-stone-800'
              }`}
            >
              {isCapturing ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
              {isCapturing ? 'Generating...' : 'Export PDF'}
            </button>
          </header>

          {/* Layout Variant: Controls */}
          <div className={`${
            currentTheme === 'sophisticated-dark' ? 'grid grid-cols-1 md:grid-cols-3 gap-8' :
            currentTheme === 'university-portal' ? 'grid grid-cols-1 md:grid-cols-3 gap-6' :
            currentTheme === 'classic-heritage' ? 'max-w-3xl mx-auto space-y-6 text-center my-10' :
            currentTheme === 'modern-corporate' ? 'bg-slate-50 p-12 grid grid-cols-1 md:grid-cols-2 gap-12' :
            currentTheme === 'scientific-journal' ? 'bg-slate-50 p-4 border border-slate-200 text-xs italic' :
            currentTheme === 'government-official' ? 'bg-white p-8 border-b-4 border-slate-900 flex justify-between items-center' :
            currentTheme === 'campus-bulletin' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' :
            'grid grid-cols-1 md:grid-cols-2 gap-20 py-12'
          }`}>
            <div className={`space-y-4 ${currentTheme === 'sophisticated-dark' || currentTheme === 'university-portal' ? 'md:col-span-2' : ''}`}>
              <label className={`text-[10px] uppercase font-black tracking-widest opacity-40 ${
                 currentTheme === 'sophisticated-dark' ? 'text-zinc-500' : 'text-slate-500'
              }`}>Select Enrollment Cycle</label>
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full flex items-center justify-between p-3 font-semibold transition-all ${
                    currentTheme === 'sophisticated-dark' ? 'bg-zinc-900 border border-zinc-800 rounded text-zinc-100 font-serif italic text-lg text-left' :
                    currentTheme === 'university-portal' ? 'bg-white border border-slate-200 rounded-xl text-slate-900 shadow-inner' :
                    currentTheme === 'classic-heritage' ? 'text-4xl underline italic font-black text-emerald-950 decoration-emerald-200 bg-transparent' :
                    currentTheme === 'modern-corporate' ? 'bg-white border-2 border-slate-200 rounded-lg p-5 text-2xl' :
                    currentTheme === 'scientific-journal' ? 'font-black underline bg-transparent' :
                    currentTheme === 'government-official' ? 'text-3xl font-black bg-slate-100 p-4 rounded' :
                    currentTheme === 'campus-bulletin' ? 'bg-amber-100/50 p-4 rounded-2xl text-2xl font-black' :
                    'text-3xl border-b-2 border-stone-300 font-black'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {currentTheme !== 'minimal-research' && <Calendar size={18} className="opacity-40" />}
                    <span>{selectedIntake.date}</span>
                  </div>
                  <ChevronDown size={14} className={isDropdownOpen ? 'rotate-180' : ''} />
                </button>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.ul 
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      className={`absolute left-0 mt-2 w-full shadow-2xl z-50 py-2 max-h-60 overflow-y-auto ${
                        currentTheme === 'sophisticated-dark' ? 'bg-zinc-900 border border-zinc-800 rounded text-zinc-400' : 
                        currentTheme === 'university-portal' ? 'bg-white border border-slate-200 rounded-2xl' :
                        currentTheme === 'academic-tech' ? 'bg-slate-50 border border-slate-300' :
                        currentTheme === 'classic-heritage' ? 'bg-[#fdfcf7] border-2 border-emerald-900' :
                        'bg-white border-2 border-stone-800'
                      }`}
                    >
                      {INTAKE_OPTIONS.map(o => (
                        <li key={o.id}>
                          <button 
                            onClick={() => { setSelectedIntake(o); setIsDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-2 transition-colors text-sm font-medium ${
                              currentTheme === 'sophisticated-dark' ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            {o.date}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className={`p-4 flex flex-col justify-center ${
              currentTheme === 'sophisticated-dark' ? 'bg-zinc-900/50 border border-zinc-800 rounded text-zinc-100' :
              currentTheme === 'university-portal' ? 'bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-900' :
              currentTheme === 'modern-corporate' ? 'bg-white border-2 border-slate-200 rounded-lg text-center' :
              currentTheme === 'campus-bulletin' ? 'bg-white rounded-2xl border-2 border-amber-50 shadow-sm text-center' :
              currentTheme === 'government-official' ? 'text-right' : ''
            }`}>
              <p className="text-[10px] uppercase font-black tracking-widest opacity-30 italic">Program Data</p>
              <p className={`font-bold ${
                currentTheme === 'sophisticated-dark' ? 'italic text-lg' :
                currentTheme === 'classic-heritage' ? 'text-2xl italic' :
                currentTheme === 'minimal-research' ? 'text-4xl uppercase' :
                'text-xl'
              }`}>20-Week Duration</p>
            </div>
          </div>

          {/* Layout Variant: Timetable Grid */}
          <div className={`${
            currentTheme === 'sophisticated-dark' ? 'border border-zinc-800 rounded overflow-hidden bg-zinc-900/20 backdrop-blur-sm' :
            currentTheme === 'university-portal' ? 'bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200' :
            currentTheme === 'academic-tech' ? 'border border-slate-300' :
            currentTheme === 'modern-corporate' ? 'bg-white shadow-2xl rounded-b-3xl overflow-hidden' :
            currentTheme === 'classic-heritage' ? 'bg-white p-1 shadow-lg' :
            currentTheme === 'campus-bulletin' ? 'bg-white overflow-hidden' :
            'border-t-2 border-stone-800 bg-stone-50/30'
          }`}>
            <div className="overflow-x-auto overflow-y-hidden">
              <table className={`w-full min-w-[800px] border-collapse ${currentTheme === 'academic-tech' ? 'table-fixed' : ''}`}>
                <thead className={`${
                  currentTheme === 'sophisticated-dark' ? 'bg-zinc-950/50 border-b border-zinc-800 text-zinc-600' :
                  currentTheme === 'university-portal' ? 'bg-slate-900 text-slate-400' :
                  currentTheme === 'academic-tech' ? 'bg-slate-800 text-white' :
                  currentTheme === 'modern-corporate' ? 'bg-slate-100 text-slate-500 uppercase text-[10px] font-black' :
                  currentTheme === 'classic-heritage' ? 'bg-emerald-900 text-white font-serif italic' :
                  currentTheme === 'scientific-journal' ? 'border-b-2 border-black' :
                  currentTheme === 'government-official' ? 'bg-slate-900 text-white' :
                  currentTheme === 'campus-bulletin' ? 'bg-amber-400 text-amber-950 font-black italic' :
                  'border-b-2 border-stone-800 text-stone-900'
                }`}>
                  <tr>
                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] ${currentTheme === 'academic-tech' ? 'border-r border-white/20' : ''}`}>Week</th>
                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] ${currentTheme === 'academic-tech' ? 'border-r border-white/20' : ''}`}>Mod. Dates</th>
                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] ${currentTheme === 'academic-tech' ? 'border-r border-white/20' : ''}`}>Code</th>
                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em]`}>Delivery Information</th>
                  </tr>
                </thead>
                <tbody className={`${
                  currentTheme === 'sophisticated-dark' ? 'divide-y divide-zinc-800/30' :
                  currentTheme === 'university-portal' ? 'divide-y divide-slate-100' :
                  currentTheme === 'academic-tech' ? 'divide-y divide-slate-300' :
                  currentTheme === 'modern-corporate' ? 'divide-y divide-slate-100' :
                  currentTheme === 'classic-heritage' ? 'divide-y divide-emerald-100' :
                  currentTheme === 'scientific-journal' ? 'divide-y divide-slate-200' :
                  'divide-y divide-slate-100'
                }`}>
                  {timetable.map((row) => (
                    <tr key={row.week} className={`group transition-all ${
                      currentTheme === 'sophisticated-dark' ? 'hover:bg-zinc-900' :
                      currentTheme === 'university-portal' ? 'hover:bg-blue-50/30' :
                      currentTheme === 'classic-heritage' ? 'hover:bg-emerald-50/30 font-medium' :
                      currentTheme === 'modern-corporate' ? 'hover:bg-slate-50' :
                      'hover:bg-white'
                    }`}>
                      <td className={`px-6 py-5 text-center ${currentTheme === 'academic-tech' ? 'border-r border-slate-300' : ''}`}>
                        <span className={`font-bold ${
                          currentTheme === 'sophisticated-dark' ? 'font-mono text-zinc-600 group-hover:text-amber-500' :
                          currentTheme === 'classic-heritage' ? 'text-emerald-900 text-lg font-black' :
                          currentTheme === 'modern-corporate' ? 'text-slate-400 font-black' :
                          currentTheme === 'campus-bulletin' ? 'bg-amber-100 px-3 py-1 rounded-lg text-amber-900' :
                          'font-mono'
                        }`}>{row.week.toString().padStart(2, '0')}</span>
                      </td>
                      <td className={`px-6 py-5 ${currentTheme === 'academic-tech' ? 'border-r border-slate-300' : ''}`}>
                        <div className="space-y-0.5 text-xs">
                          <p className={`font-bold ${currentTheme === 'sophisticated-dark' ? 'text-zinc-100' : 'text-slate-900'}`}>{row.startDate} — {row.endDate}</p>
                          <p className="text-[8px] uppercase tracking-widest opacity-40 font-black font-mono">Fiscal Duration</p>
                        </div>
                      </td>
                      <td className={`px-6 py-5 ${currentTheme === 'academic-tech' ? 'border-r border-slate-300' : ''}`}>
                        <div className={`inline-block px-3 py-1 transition-all ${
                          currentTheme === 'sophisticated-dark' ? 'bg-zinc-900 border-l-2 border-amber-600 text-zinc-100' :
                          currentTheme === 'university-portal' ? 'bg-blue-50 text-blue-600 rounded-full font-bold text-[10px]' :
                          currentTheme === 'classic-heritage' ? 'border-b-2 border-emerald-900 text-emerald-950 font-black' :
                          currentTheme === 'modern-corporate' ? 'font-black text-slate-900 bg-slate-100 rounded-md' :
                          currentTheme === 'scientific-journal' ? 'font-black underline uppercase text-xs' :
                          currentTheme === 'campus-bulletin' ? 'text-amber-600 font-bold italic underline decoration-amber-200' :
                          'bg-slate-800 text-white font-mono'
                        }`}>
                          {row.intakeCode}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs font-semibold ${currentTheme === 'sophisticated-dark' ? 'text-zinc-300' : 'text-slate-700'}`}>{row.mode}</span>
                          <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${
                               currentTheme === 'university-portal' ? 'bg-blue-500' : 
                               currentTheme === 'classic-heritage' ? 'bg-emerald-600' :
                               currentTheme === 'campus-bulletin' ? 'bg-amber-400' :
                               'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                             }`} />
                             <span className="text-[7px] uppercase tracking-widest font-black opacity-30">Registered Format</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER: Design Switcher */}
      <footer className={`fixed bottom-0 left-0 right-0 border-t px-4 py-4 z-[100] ${
        currentTheme === 'sophisticated-dark' ? 'bg-zinc-950/95 border-zinc-800 text-zinc-400 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]' : 'bg-white/95 border-slate-200 text-slate-400 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]'
      } backdrop-blur-xl`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center gap-2 shrink-0 border-r pr-4 border-zinc-800">
               <GraduationCap className={currentTheme === 'sophisticated-dark' ? 'text-zinc-600' : 'text-slate-400'} size={18} />
               <span className="text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Institutional Layout Gallery</span>
            </div>
            <div className="flex gap-2 min-w-max px-2">
              {designs.map(d => (
                <button 
                  key={d.id}
                  onClick={() => setCurrentTheme(d.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${
                    currentTheme === d.id 
                      ? (currentTheme === 'sophisticated-dark' ? 'bg-amber-600 text-white shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 'bg-blue-600 text-white shadow-lg')
                      : (currentTheme === 'sophisticated-dark' ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 focus:outline-none' : 'text-slate-500 hover:bg-slate-100 focus:outline-none')
                  }`}
                >
                  {d.icon}
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&family=Public+Sans:wght@400;900&display=swap');
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
