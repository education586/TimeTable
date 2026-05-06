import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, Loader2, ShieldAlert } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your registered email and password.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Authentication failed. Please contact your administrator.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F0EB] flex items-center justify-center p-5 relative overflow-x-hidden selection:bg-[#58334a]/10 no-scrollbar">
      {/* Premium Background Architecture */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Luxury Base Layer */}
        <div className="absolute inset-0 bg-[#F3F0EB]" />

        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
        >
          <source src="/bg.mp4" type="video/mp4" />
        </video>

        {/* Refined Mesh Pattern - more prominent dots */}
        <div 
          className="absolute inset-0 opacity-[0.04]" 
          style={{ 
            backgroundImage: `radial-gradient(#58334a 1.2px, transparent 1.2px)`,
            backgroundSize: `40px 40px`,
          }} 
        />

        {/* Wave pattern overlay simulation */}
        <div 
          className="absolute inset-0 opacity-[0.03] rotate-12 scale-150" 
          style={{ 
            backgroundImage: `linear-gradient(90deg, #58334a 1px, transparent 1px), linear-gradient(0deg, #58334a 1px, transparent 1px)`,
            backgroundSize: `160px 160px`,
            maskImage: `radial-gradient(ellipse at center, black, transparent)`
          }} 
        />

        {/* Soft Ambient lighting */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-[#58334a]/5" />
      </div>
      
      {/* Outer card with premium glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[1140px] bg-white/75 backdrop-blur-[64px] rounded-[48px] lg:rounded-[72px] border border-white/60 shadow-[0_100px_200px_-50px_rgba(0,0,0,0.15),inset_0_1px_2px_0_rgba(255,255,255,0.9),inset_0_-1px_1px_0_rgba(255,255,255,0.2)] overflow-hidden flex flex-col lg:flex-row h-auto lg:h-[700px] relative z-10"
      >
        {/* Ambient luxury light sweep */}
        <motion.div
          animate={{
            x: ['-100%', '300%'],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 4
          }}
          className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-35deg] z-10 opacity-70"
        />

        {/* ── Left Column: Form ── */}
        <div className="w-full lg:w-[50%] p-5 pl-[55px] pt-[50px] flex flex-col relative z-20">
          <div className="flex-1 flex flex-col justify-start max-w-[460px] w-full">

          {/* Logo */}
<div className="flex items-center gap-4 mb-6 lg:mb-10 flex-shrink-0">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.05 }}
              className="w-14 h-14 bg-[#58334a] rounded-2xl flex items-center justify-center shadow-xl shadow-purple-900/10"
            >
              <span className="text-white text-lg font-bold tracking-tight">DEMO</span>
            </motion.div>
            <div className="flex flex-col leading-tight">
              <span className="text-[26px] font-bold font-sans text-slate-900 tracking-tight">The College</span>
              <span className="text-[20px] font-bold font-sans text-[#58334a] tracking-wide uppercase opacity-90">(DEMO)</span>
            </div>
          </div>

            <div className="flex flex-col">
              {/* Heading */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-[26px] font-bold font-sans text-slate-900 tracking-[0.5px] mb-4 leading-tight">Welcome Back</h1>
<p className="text-[15px] lg:text-[17px] text-slate-600 font-bold leading-relaxed mb-6 lg:mb-10 opacity-80">
                  Sign in with your registered college email to access your student portal and academic resources.
                </p>
              </motion.div>

              {/* Error message */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="bg-red-50 border border-red-200 text-red-700 text-[13px] font-semibold px-4 py-3 rounded-xl mb-6 flex items-center gap-2"
                  >
                    <ShieldAlert size={16} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.form 
                variants={{
                  show: {
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
                initial="hidden"
                animate="show"
                onSubmit={handleEmailAuth} 
                className="space-y-4 lg:space-y-6"
              >
                {/* Registered Email */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    show: { opacity: 1, x: 0 }
                  }}
                >
                  <label className="block text-[14px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Education Institutonal Email
                  </label>
                  <div className="flex items-center gap-4 bg-[#fcfbf9] border-[1.5px] border-[#ebe9e4] rounded-2xl px-6 py-[14px] transition-all focus-within:bg-white focus-within:border-[#58334a] focus-within:shadow-[0_0_0_4px_rgba(88,51,74,0.06)]">
                    <Mail className="w-5 h-5 text-slate-300 flex-shrink-0" />
                    <input
                      type="email"
                      className="flex-1 bg-transparent border-none p-0 text-[16px] font-medium text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-300"
                      placeholder="student@college.edu.au"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    show: { opacity: 1, x: 0 }
                  }}
                >
                  <label className="block text-[14px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Password
                  </label>
                  <div className="flex items-center gap-4 bg-[#fcfbf9] border-[1.5px] border-[#ebe9e4] rounded-2xl px-6 py-[14px] transition-all focus-within:bg-white focus-within:border-[#58334a] focus-within:shadow-[0_0_0_4px_rgba(88,51,74,0.06)]">
                    <Lock className="w-5 h-5 text-slate-300 flex-shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="flex-1 bg-transparent border-none p-0 text-[16px] font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-300"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-300 hover:text-[#58334a] transition-colors flex-shrink-0"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>

                {/* Remember me + Forgot password */}
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    show: { opacity: 1, x: 0 }
                  }}
                  className="flex items-center justify-between pt-1 px-1"
                >
                  <label className="flex items-center gap-3 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 accent-[#58334a] cursor-pointer"
                    />
                    <span className="text-[14px] font-bold text-slate-500 group-hover:text-slate-800 transition-colors">
                      Keep me signed in
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-[14px] font-bold text-[#58334a] hover:opacity-70 transition-all uppercase tracking-wider"
                  >
                    Forgot Password?
                  </button>
                </motion.div>

                {/* Submit */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  className="space-y-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#58334a] hover:bg-[#48283a] text-white py-4 lg:py-5 rounded-2xl font-bold text-[16px] uppercase tracking-[0.1em] transition-all shadow-xl shadow-[#58334a]/20 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing…
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </motion.button>
                </motion.div>
              </motion.form>
            </div>
          </div>
        </div>

        {/* ── Right Column: Visual Panel ── */}
        <div className="hidden lg:flex flex-1 p-8">
          <div className="w-full h-full relative rounded-[40px] overflow-hidden group shadow-2xl">
            <img
              src="https://tan-occasional-flamingo-688.mypinata.cloud/ipfs/bafybeib2ynygn56ej24pevcd23cidjh52hy3r2jxqgzipefqmlm7wwjgzy"
              className="w-full h-full object-cover transition-transform duration-[6s] group-hover:scale-105"
              alt="College Campus"
            />

            {/* Premium ambient gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/40 via-transparent to-transparent" />

            {/* Overlay branding */}
            <div className="absolute bottom-16 left-16 z-20">
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
