import { motion, AnimatePresence } from 'motion/react';
import { Cpu, LogOut } from 'lucide-react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface SidebarProps {
  user: User;
  userData: any;
  studentRegistry: any[] | null;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  setSelectedCourseId: (id: string | null) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  menuItems: any[];
}

const Sidebar = ({
  user,
  userData,
  studentRegistry,
  activeTab,
  setActiveTab,
  setSelectedCourseId,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  menuItems,
}: SidebarProps) => {
  return (
    <motion.aside
      initial={{ x: -280, opacity: 0 }}
      animate={{
        x: (isMobileMenuOpen || window.innerWidth >= 1024) ? 0 : -280,
        opacity: 1
      }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed lg:flex w-full lg:w-[20%] h-screen left-0 top-0 bg-white/95 lg:bg-white/10 backdrop-blur-[80px] border-r border-white/20 z-[80] flex flex-col py-6 lg:py-10 px-5 lg:px-8 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.05)] overflow-y-auto overflow-x-hidden custom-scrollbar ${isMobileMenuOpen ? 'flex animate-in slide-in-from-left duration-500' : 'hidden lg:flex'}`}
    >
      {/* Glass sweep animation - sidebar */}
      <motion.div
        animate={{
          x: ['-100%', '300%'],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 3
        }}
        className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-35deg] z-0 opacity-40"
      />

      <div className="flex items-center gap-6 mb-12 px-2 relative z-10">
        <div className="w-16 h-16 bg-[#58334a] rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-purple-900/30 transition-transform hover:scale-105 duration-500 border border-white/20">
          <Cpu className="text-white w-9 h-9" />
        </div>
        <div className="flex flex-col">
          <span className="text-[21px] font-bold font-sans text-slate-900 tracking-tight leading-none mb-2 transition-colors group-hover:text-[#58334a]">The College</span>
          <span className="text-[16px] font-bold font-sans text-[#58334a] tracking-[0.2em] uppercase opacity-80">(Demo)</span>
        </div>
      </div>

      <motion.nav
        variants={{
          show: {
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
        initial="hidden"
        animate="show"
        className="flex-1 space-y-2 relative z-10"
      >
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            variants={{
              hidden: { x: -20, opacity: 0 },
              show: { x: 0, opacity: 1 }
            }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setActiveTab(item.id as any);
              if (item.id === 'dashboard') setSelectedCourseId(null);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-[18px] font-sans font-bold text-[14px] tracking-tight transition-all group ${
              activeTab === item.id
                ? 'bg-[#58334a] text-white shadow-xl shadow-purple-900/15'
                : 'text-slate-500 hover:bg-[#f7f6f3] hover:text-[#58334a]'
            }`}
          >
            <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-[#58334a]'}`} />
            {item.label}
          </motion.button>
        ))}
      </motion.nav>

      <div className="mt-auto pt-8 border-t border-slate-100/40 relative z-10">
        <div className="bg-white/30 backdrop-blur-2xl rounded-[20px] p-4 border border-white/40 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.5)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-md border border-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
              {userData?.photoURL || user.photoURL ? (
                <img src={userData?.photoURL || user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="font-bold text-[#58334a] text-sm uppercase">{user.displayName?.charAt(0) || 'U'}</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold font-sans text-slate-900 truncate uppercase tracking-tight leading-none drop-shadow-sm">
                {user.displayName?.split(' ')?.[0] || 'Student'}
              </p>
              {(() => {
                const reg = studentRegistry?.find(s => s.email.toLowerCase() === user?.email?.toLowerCase());
                if (reg) {
                  return (
                    <p className="text-[9px] font-bold text-[#58334a] uppercase tracking-widest mt-1 opacity-60 truncate">
                      {reg.qualification}
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="w-full py-2.5 bg-white/50 backdrop-blur-md border border-white text-slate-600 hover:text-red-600 hover:bg-red-50/50 rounded-xl text-[12px] font-bold font-sans uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3 shadow-[0_4px_8px_-2px_rgba(0,0,0,0.02),inset_0_1px_1px_rgba(255,255,255,0.8)] hover:shadow-lg hover:shadow-red-900/5"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
