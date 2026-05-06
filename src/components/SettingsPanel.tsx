import { ChangeEvent, RefObject } from 'react';
import { motion } from 'motion/react';
import { Edit2, Check, Loader2, Camera, Mail, Calendar, Phone, ShieldCheck, ArrowRight } from 'lucide-react';
import { User, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface SettingsPanelProps {
  user: User;
  userData: any;
  isEditingProfile: boolean;
  setIsEditingProfile: (editing: boolean) => void;
  editName: string;
  setEditName: (name: string) => void;
  editPhone: string;
  setEditPhone: (phone: string) => void;
  isUpdating: boolean;
  handleUpdateProfile: () => void;
  photoInputRef: RefObject<HTMLInputElement>;
  handlePhotoUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  selectedIntake: any;
}

const SettingsPanel = ({
  user,
  userData,
  isEditingProfile,
  setIsEditingProfile,
  editName,
  setEditName,
  editPhone,
  setEditPhone,
  isUpdating,
  handleUpdateProfile,
  photoInputRef,
  handlePhotoUpload,
  selectedIntake,
}: SettingsPanelProps) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-5xl space-y-10 pb-20"
    >
      <div className="grid grid-cols-1 gap-10">
        <motion.div variants={itemVariants} className="space-y-10 mt-[10px] md:mt-[30px]">
          <div className="bg-white rounded-[2rem] md:rounded-[4rem] border border-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.1)] p-6 md:p-[40px] transition-all hover:shadow-[0_48px_96px_-24px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 md:mb-14 gap-6">
              <h3 className="text-[22px] md:text-[30px] font-bold text-slate-900 font-sans tracking-tight leading-none">Profile</h3>
              {!isEditingProfile ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsEditingProfile(true)}
                  className="flex items-center gap-2.5 px-6 py-3 bg-[#58334a]/5 text-[#58334a] rounded-xl text-[13px] md:text-[14px] font-bold font-sans transition-all tracking-widest border border-[#58334a]/10 hover:bg-[#58334a]/10 w-full sm:w-auto justify-center"
                >
                  <Edit2 size={16} />
                  Modify Record
                </motion.button>
              ) : (
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="px-6 py-3 text-[11px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex-1 sm:flex-none font-sans"
                  >
                    Abort
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpdateProfile}
                    disabled={isUpdating}
                    className="flex items-center gap-2.5 px-6 py-3 bg-[#58334a] text-white rounded-xl text-[11px] font-bold transition-all uppercase tracking-widest shadow-lg shadow-purple-900/20 disabled:opacity-30 flex-1 sm:flex-none justify-center font-sans"
                  >
                    {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Sync Identity
                  </motion.button>
                </div>
              )}
            </div>

            <div className="space-y-10 md:space-y-14">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 text-center md:text-left">
                <div className="relative group/photo">
                  <div className="w-26 md:w-28 h-26 md:h-28 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center overflow-hidden transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] group-hover/photo:border-[#58334a]/30 group-hover/photo:shadow-xl transition-all duration-500">
                    {userData?.photoURL || user.photoURL ? (
                      <img src={userData?.photoURL || user.photoURL} alt="Avatar" className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white text-[#58334a] font-bold text-4xl md:text-5xl font-sans uppercase group-hover/photo:scale-110 transition-transform duration-700">
                        {user.displayName?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-11 md:w-12 h-11 md:h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] hover:bg-[#58334a] transition-all z-10 border-[4px] border-white focus:outline-none"
                  >
                    <Camera size={18} />
                  </motion.button>
                  <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </div>

                <div className="flex-1 space-y-3 md:space-y-4 md:pt-2">
                  <p className="text-[12px] md:text-[14px] font-bold text-slate-400 uppercase tracking-[0.25em] opacity-80 md:pl-1 font-sans">Institutional Identity</p>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-[#58334a]/20 py-2 text-2xl md:text-3xl font-bold text-slate-900 focus:outline-none focus:border-[#58334a] transition-all font-sans text-center md:text-left"
                      placeholder="Legal Full Name"
                    />
                  ) : (
                    <h4 className="text-[22px] md:text-[30px] font-bold text-slate-900 tracking-tight font-sans leading-tight">{user.displayName || 'Authorized User'}</h4>
                  )}
                  <div className="flex items-center justify-center md:justify-start gap-3 pt-1">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[12px] md:text-[14px] font-bold text-emerald-600 uppercase tracking-widest opacity-90 font-sans">Verified Student Credentials</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-50 text-left">
                <div className="space-y-4">
                  <p className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80 pl-2 font-sans">Network Address</p>
                  <div className="flex items-center gap-5 text-slate-900 font-bold bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/80 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-white">
                    <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                      <Mail size={18} className="text-[#58334a]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] text-slate-400  tracking-widest font-sans mb-0.5">Primary Email</span>
                      <span className="text-[15px] font-bold font-sans truncate max-w-[200px]">{user.email}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80 pl-2 font-sans">Intake Date</p>
                  <div className="flex items-center gap-5 text-slate-900 font-bold bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/80 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-white">
                    <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                      <Calendar size={18} className="text-[#58334a]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] text-slate-400  tracking-widest font-sans mb-0.5">Academic Entry</span>
                      <span className="text-[15px] font-bold font-sans">{selectedIntake.date || 'Pending Assignment'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80 pl-2 font-sans">Telecommunication</p>
                  {isEditingProfile ? (
                    <div className="flex items-center gap-5 bg-white border-2 border-[#58334a]/20 p-6 rounded-[2rem] shadow-2xl shadow-purple-900/5 transition-all focus-within:border-[#58334a]/40">
                      <div className="w-11 h-11 rounded-2xl bg-[#58334a]/5 flex items-center justify-center">
                        <Phone size={18} className="text-[#58334a]" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <span className="text-[10px] text-[#58334a] uppercase tracking-widest font-sans mb-0.5">Edit Contact</span>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="bg-transparent border-none outline-none font-bold text-slate-900 w-full text-[15px] p-0 h-auto font-sans placeholder:text-slate-300"
                          placeholder="+61 400 000 000"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-5 text-slate-900 font-bold bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/80 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-white">
                      <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                        <Phone size={18} className="text-[#58334a]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] text-slate-400  tracking-widest font-sans mb-0.5">Primary Contact</span>
                        <span className="text-[15px] font-bold font-sans">{userData?.phone || 'Not provided'}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-80 pl-2 font-sans">Security Integrity</p>
                  <div className="flex items-center gap-5 text-[#58334a] font-bold bg-[#58334a]/5 p-6 rounded-[2rem] border border-[#58334a]/10">
                    <div className="w-11 h-11 rounded-2xl bg-white/50 flex items-center justify-center border border-[#58334a]/10">
                      <ShieldCheck size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] text-[#58334a]/60  tracking-widest font-sans mb-0.5">Authentication Status</span>
                      <span className="text-[11px] font-bold font-sans uppercase tracking-[0.15em]">End-to-End Encrypted</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 pt-10 border-t border-slate-50">
              <motion.button
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={async () => {
                  try {
                    await sendPasswordResetEmail(auth, user.email!);
                    alert("A secure reset link has been dispatched to your institutional inbox.");
                  } catch (e) {
                    console.error("Failed to send reset email.", e);
                  }
                }}
                className="w-full py-6 bg-white border border-slate-100 text-[#58334a] hover:bg-slate-50 rounded-[2rem] font-bold text-[14px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-sm hover:shadow-2xl hover:shadow-purple-900/10 font-sans"
              >
                <ArrowRight size={18} />
                <span>Request Credential Reset Sequence</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SettingsPanel;
