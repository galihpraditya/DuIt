import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, ShieldCheck, Check } from 'lucide-react';
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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError(t.authErrorEmail);
      return;
    }
    if (password.length < 6) {
      setError(t.authErrorWeakPassword);
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError(t.authErrorPasswordMatch);
      return;
    }

    try {
      setIsLoading(true);
      let user: UserProfile;
      
      if (mode === 'signup') {
        user = await authService.registerWithEmail(email, password, name);
      } else {
        user = await authService.loginWithEmail(email, password);
      }
      
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Error occurred');
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
  };

  const toggleMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
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
            className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 mb-3">
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
              <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-center font-medium">
                {error}
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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.authPasswordLabel}
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors"
              />
            </div>

            {mode === 'signup' && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
                  <Check className="w-4 h-4" />
                </div>
                <input
                  type="password"
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
              className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              <span>{isLoading ? '...' : (mode === 'signin' ? t.authSignIn : t.authSignUp)}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
