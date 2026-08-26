import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, ShieldCheck, Check, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService, type UserProfile } from '../../services/authService';
import type { Translations } from '../../constants/translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  t: Translations;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, t }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [registeredEmailPending, setRegisteredEmailPending] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError(t.authErrorEmail || 'Format email tidak valid.');
      return;
    }
    if (password.length < 6) {
      setError(t.authErrorWeakPassword || 'Kata sandi minimal 6 karakter.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError(t.authErrorPasswordMatch || 'Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      setIsLoading(true);
      
      if (mode === 'signup') {
        const user = await authService.registerWithEmail(cleanEmail, password, name);
        if (user.requiresEmailConfirmation) {
          // Tampilkan pesan bahwa email konfirmasi telah dikirim
          setRegisteredEmailPending(cleanEmail);
          setIsLoading(false);
          return;
        }
        onSuccess(user);
      } else {
        const user = await authService.loginWithEmail(cleanEmail, password);
        onSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses akun.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setError('');
    setRegisteredEmailPending(null);
  };

  const toggleMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    resetForm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="glass-modal rounded-3xl w-full max-w-sm shadow-glass-lg overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          >
        
        {/* Header Tabs */}
        <div className="flex items-center border-b border-slate-200/80 dark:border-slate-800/80">
          <button
            onClick={() => toggleMode('signin')}
            className={`flex-1 py-4 text-sm font-bold transition-all relative ${
              mode === 'signin' 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t.authSignIn}
            {mode === 'signin' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full shadow-[0_-2px_10px_rgba(16,185,129,0.5)]" />
            )}
          </button>
          <button
            onClick={() => toggleMode('signup')}
            className={`flex-1 py-4 text-sm font-bold transition-all relative ${
              mode === 'signup' 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t.authSignUp}
            {mode === 'signup' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full shadow-[0_-2px_10px_rgba(16,185,129,0.5)]" />
            )}
          </button>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {registeredEmailPending ? (
            /* Email Confirmation Notification View */
            <div className="text-center py-2 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 mx-auto bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                  Pendaftaran Berhasil!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed px-2">
                  Tautan konfirmasi telah dikirim ke <strong className="text-emerald-600 dark:text-emerald-400">{registeredEmailPending}</strong>. Silakan periksa inbox/spam email Anda untuk aktivasi akun.
                </p>
              </div>
              
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-700 dark:text-amber-300 text-left">
                <strong>Tips:</strong> Jika Anda ingin bisa login instan tanpa konfirmasi email, matikan opsi <em>"Confirm email"</em> di Dashboard Supabase (<strong>Authentication &gt; Providers &gt; Email</strong>).
              </div>

              <button
                type="button"
                onClick={() => {
                  setRegisteredEmailPending(null);
                  setMode('signin');
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>Beralih ke Halaman Masuk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 mx-auto bg-emerald-600 rounded-xl flex items-center justify-center text-white mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white">
                  {mode === 'signin' ? t.authSignIn : t.authSignUp}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.authLoginToSync}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-start space-x-2 font-medium leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.authNameLabel}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors"
                    />
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.authEmailLabel}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.authPasswordLabel}
                    required
                    className="w-full pl-10 pr-10 py-3 rounded-2xl glass-input text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {mode === 'signup' && (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
                      <Check className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t.authConfirmPasswordLabel}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] text-white font-bold text-sm flex items-center justify-center space-x-2 transition-colors active:scale-[0.98] disabled:opacity-70 cursor-pointer"
                >
                  <span>{isLoading ? 'Memproses...' : (mode === 'signin' ? t.authSignIn : t.authSignUp)}</span>
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </>
          )}
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
