import { ChangeEvent, RefObject } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, ShieldCheck, Upload, Users, Layout, BookOpen, Trash2, ArrowRight, Database, Settings } from 'lucide-react';
import { TimetableRow, Course } from '../types';

interface AdminPanelProps {
  isAdmin: boolean;
  uploadedData: Record<string, { name: string, rows: TimetableRow[] }[]> | null;
  setUploadedData: (data: any) => void;
  studentRegistry: any[] | null;
  setStudentRegistry: (data: any) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  handleFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  studentRegistryInputRef: RefObject<HTMLInputElement>;
  handleStudentRegistryUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  setSelectedCourseId: (id: string | null) => void;
  setSelectedUploadedIntake: (intake: number) => void;
  setActiveTab: (tab: any) => void;
  showMasterLedger: boolean;
  setShowMasterLedger: (show: boolean) => void;
  isLightMode: boolean;
  COURSES: Course[];
  syncRegistryToFirestore: (list: any[]) => void;
}

const AdminPanel = ({
  isAdmin,
  uploadedData,
  setUploadedData,
  studentRegistry,
  setStudentRegistry,
  fileInputRef,
  handleFileUpload,
  studentRegistryInputRef,
  handleStudentRegistryUpload,
  setSelectedCourseId,
  setSelectedUploadedIntake,
  setActiveTab,
  showMasterLedger,
  setShowMasterLedger,
  isLightMode,
  COURSES,
  syncRegistryToFirestore,
}: AdminPanelProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  if (!isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 max-w-2xl"
      >
        <div className="w-24 h-24 bg-red-50 rounded-[2rem] border border-red-100 flex items-center justify-center mb-10">
          <ShieldAlert size={40} className="text-red-500" />
        </div>
        <h2 className="text-4xl font-bold tracking-[0.5px] text-slate-900 mb-5">Unauthorized Access</h2>
        <p className="text-slate-500 font-bold text-base leading-relaxed opacity-70">This terminal is restricted to institutional administrators. Your access attempt has been logged.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-6xl space-y-12 pb-12"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-end justify-between gap-8">
        <div className="space-y-4 w-full">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 1 }}
              className="w-12 h-12 bg-[#58334a]/10 rounded-2xl flex items-center justify-center border border-[#58334a]/20"
            >
              <ShieldCheck className="text-[#58334a]" size={24} />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-[0.5px]">Institutional Command</h2>
          </div>
          <p className="text-slate-500 font-bold max-w-xl opacity-70">Configuration terminal for institutional records and master timetable nodes.</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
          className="px-8 py-5 bg-[#58334a] text-white rounded-2xl font-medium text-xs uppercase tracking-[0.2em] flex items-center gap-4 shadow-2xl shadow-purple-900/20 transition-all font-sans"
        >
          <Upload size={18} />
          Update Master Ledger
        </motion.button>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => studentRegistryInputRef.current?.click()}
          className="px-8 py-5 bg-white border border-[#58334a]/20 text-[#58334a] rounded-2xl font-medium text-xs uppercase tracking-[0.2em] flex items-center gap-4 shadow-xl transition-all hover:bg-[#58334a]/5 font-sans"
        >
          <Users size={18} />
          Enrol Students
        </motion.button>
        <input type="file" ref={studentRegistryInputRef} onChange={handleStudentRegistryUpload} accept=".xlsx, .xls" className="hidden" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <motion.div variants={itemVariants} className="lg:col-span-2 p-12 rounded-[3rem] bg-white border border-[#ebe9e4] shadow-sm">
          <h3 className="text-xl font-semibold tracking-[0.5px] mb-10 flex items-center gap-4">
            <Layout size={20} className="text-[#58334a]" />
            Authorized Data Repository
          </h3>

          {!uploadedData ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800/10 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="font-bold uppercase tracking-widest text-[11px] text-slate-400">Institutional System Files</h4>
                </div>
              </div>
              {showMasterLedger ? (
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`p-8 rounded-[2rem] border flex items-center justify-between bg-slate-50 border-slate-100 group transition-all hover:bg-white hover:shadow-xl hover:border-[#58334a]/10`}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#58334a]/5 flex items-center justify-center group-hover:bg-[#58334a]/10 transition-colors">
                      <BookOpen className="text-[#58334a]" size={24} />
                    </div>
                    <div>
                      <p className="text-[17px] font-bold text-slate-900 leading-tight">Master_Institutional_Ledger_2026.xlsx</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active System File</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">1.4 MB</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedCourseId(COURSES[0].id);
                        setActiveTab('dashboard');
                      }}
                      className="px-6 py-3 bg-[#58334a] text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-[#48283a] transition-all shadow-lg shadow-purple-900/10 font-sans"
                    >
                      Launch
                    </button>
                    <button
                      className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      onClick={() => setShowMasterLedger(false)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                  <Trash2 size={40} className="mb-4 text-slate-300" />
                  <p className="font-bold">No system files currently active.</p>
                  <button
                    onClick={() => setShowMasterLedger(true)}
                    className="mt-4 text-[11px] font-bold uppercase tracking-widest text-[#58334a] hover:underline"
                  >
                    Restore Base Ledger
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(uploadedData).map(([courseId, intakes]) => {
                const courseIntakes = intakes as { name: string, rows: TimetableRow[] }[];
                const course = COURSES.find(c => c.id === courseId);
                return (
                  <div key={courseId} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800/10 pb-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${course?.color || 'bg-slate-500'}`} />
                        <h4 className="font-bold uppercase tracking-widest text-sm">{course?.name || 'Unassigned Sheets'}</h4>
                      </div>
                      <span className="text-[10px] font-bold uppercase opacity-30 tracking-[0.2em]">{courseIntakes.length} Intakes Detected</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {courseIntakes.map((intake, i) => (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.02 }}
                          className={`p-5 rounded-2xl border flex items-center justify-between ${isLightMode ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/40 border-slate-700/50'}`}
                        >
                          <p className="text-xs font-bold truncate max-w-[150px]">{intake.name}</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedCourseId(courseId === 'unassigned' ? COURSES[0].id : courseId);
                                setSelectedUploadedIntake(i);
                                setActiveTab('dashboard');
                              }}
                              className="p-2 hover:bg-indigo-500/10 rounded-lg transition-all text-indigo-400"
                            >
                              <ArrowRight size={16} />
                            </button>
                            <button
                              onClick={() => {
                                const newData = { ...uploadedData };
                                const courseArr = [...newData[courseId]];
                                courseArr.splice(i, 1);
                                if (courseArr.length === 0) {
                                  delete newData[courseId];
                                } else {
                                  newData[courseId] = courseArr;
                                }
                                setUploadedData(Object.keys(newData).length === 0 ? null : newData);
                              }}
                              className="p-2 hover:bg-red-500/10 rounded-lg transition-all text-red-400"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <motion.button
                whileHover={{ backgroundColor: '#fee2e2' }}
                onClick={() => setUploadedData(null)}
                className="w-full py-4 border border-red-500/20 text-red-400 font-bold uppercase text-[10px] tracking-widest rounded-2xl transition-all font-sans"
              >
                Clear All Cached Data
              </motion.button>
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-8">
          {/* Student Enrollment Card */}
          <div className={`p-8 rounded-[2.5rem] border ${isLightMode ? 'bg-[#58334a] text-white' : 'bg-slate-900 border-slate-800'}`}>
            <h3 className="text-[11px] font-bold tracking-[0.3em] uppercase mb-8 opacity-60 flex items-center gap-3">
              <Users size={16} className="text-white/40" />
              Student Enrollment
            </h3>

            {!studentRegistry ? (
              <div className="space-y-6">
                <div className="p-8 rounded-[2rem] border border-white/10 bg-white/5 flex flex-col items-center text-center">
                  <Database size={32} className="text-white/20 mb-4" />
                  <p className="text-[10px] font-bold text-white/40 mb-6 uppercase tracking-widest">Registry Empty</p>
                  <button
                    onClick={() => studentRegistryInputRef.current?.click()}
                    className="w-full py-4 bg-white text-[#58334a] rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-white/90 transition-all font-sans"
                  >
                    Import Students
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-black/20 p-2 rounded-xl flex items-center justify-between px-4">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Verified Records</span>
                  <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full font-sans">{studentRegistry.length}</span>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {studentRegistry.map((s, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2 relative">
                      <div className="flex items-start justify-between text-left">
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold truncate text-white">{s.name}</p>
                          <p className="text-[10px] opacity-70 truncate text-white/80 font-sans">{s.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            const newList = [...studentRegistry];
                            newList.splice(idx, 1);
                            setStudentRegistry(newList.length === 0 ? null : newList);
                            syncRegistryToFirestore(newList.length === 0 ? [] : newList);
                          }}
                          className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="text-[9px] font-bold opacity-40 uppercase tracking-widest text-[#b36688] truncate text-left">{s.qualification}</div>
                        <div className="text-[9px] font-bold opacity-60 uppercase tracking-widest text-emerald-400 text-right font-sans">Intake: {s.intakeDate}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStudentRegistry(null)}
                  className="w-full py-3 border border-white/10 text-white/40 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all font-sans"
                >
                  Clear Registry
                </button>
              </div>
            )}
          </div>

          <div className={`p-8 rounded-[2.5rem] border ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/40 border-slate-800'}`}>
            <h3 className="text-sm font-bold tracking-widest uppercase mb-6 opacity-40">System Status</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-body font-bold opacity-60">Auth Engine</p>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-sans font-bold rounded-lg uppercase">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-body font-bold opacity-60">Storage Sync</p>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-sans font-bold rounded-lg uppercase">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-body font-bold opacity-60">Data Latency</p>
                <span className="text-xs font-sans font-bold">14ms</span>
              </div>
            </div>
          </div>

          <div className={`p-8 rounded-[2.5rem] border bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden group`}>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700" />
            <Settings className="mb-6 opacity-50 transition-transform duration-700 group-hover:rotate-90" size={32} />
            <h3 className="text-lg font-semibold tracking-[0.5px] mb-2 uppercase">Bulk Maintenance</h3>
            <p className="text-xs font-bold opacity-80 leading-relaxed mb-6">Need to update all courses at once? Our intelligent parser detects groups across multiple sheets automatically.</p>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
               <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
               AI Assisted Parsing Active
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminPanel;
