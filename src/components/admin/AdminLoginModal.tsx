/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  KeyRound,
  Database,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { isFirebaseConfigured } from '../../firebase/firebase.ts';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenFirebaseSetup?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenFirebaseSetup,
}) => {
  const { t } = useLanguage();
  const { loginAdmin, loginAdminWithGoogle } = useAuth();
  const isFbReady = isFirebaseConfigured();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError(t('ইমেইল এবং পাসওয়ার্ড প্রদান করুন।', 'Please provide email and password.'));
      return;
    }

    setIsLoading(true);
    const res = await loginAdmin(email.trim(), password);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || t('অ্যাডমিন লগইন ব্যর্থ হয়েছে।', 'Admin authentication failed.'));
    } else {
      onSuccess();
      onClose();
    }
  };

  const handleGoogleAdminLogin = async () => {
    setError('');
    setIsGoogleLoading(true);
    const res = await loginAdminWithGoogle();
    setIsGoogleLoading(false);

    if (!res.success) {
      setError(res.error || t('গুগল অ্যাডমিন লগইন ব্যর্থ হয়েছে।', 'Google admin sign-in failed.'));
    } else {
      onSuccess();
      onClose();
    }
  };

  const handleAutofillOsman = () => {
    setEmail('admin@myagrofarm.com');
    setPassword('AdminAgro2026!');
  };

  const handleAutofillMarufa = () => {
    setEmail('ceo@myagrofarm.com');
    setPassword('MarufaCEO2026!');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="font-bold text-sm sm:text-base font-sans">
                {t('ম্যানেজমেন্ট অ্যাডমিন পোর্টাল', 'Management Admin Login')}
              </h2>
              <p className="text-[11px] text-stone-400">
                {t('Firebase Auth সুরক্ষিত সেন্ট্রাল ড্যাশবোর্ড', 'Firebase Auth Protected Central Dashboard')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Firebase Google Auth Button */}
          {isFbReady ? (
            <div>
              <button
                type="button"
                onClick={handleGoogleAdminLogin}
                disabled={isGoogleLoading}
                className="w-full py-2.5 px-3 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isGoogleLoading ? t('যাচাই করা হচ্ছে...', 'Verifying...') : t('Google দিয়ে অ্যাডমিন প্রবেশ (Firebase Auth)', 'Sign in with Google Admin')}</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white px-2 text-stone-400">
                    {t('অথবা ইমেইল ও পাসওয়ার্ড', 'Or Official Email & Password')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{t('ফায়ারবেস ক্লাউড সংযোগ অপেক্ষমাণ।', 'Cloud Firebase not connected yet.')}</span>
              </div>
              {onOpenFirebaseSetup && (
                <button
                  type="button"
                  onClick={onOpenFirebaseSetup}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium text-[11px] rounded-lg cursor-pointer"
                >
                  {t('সেটআপ', 'Setup')}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                {t('অ্যাডমিন অফিসিয়াল ইমেইল *', 'Admin Email *')}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@myagrofarm.com"
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg pl-9 pr-3 py-2.5 focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                {t('গোপন পাসওয়ার্ড *', 'Secret Password *')}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg pl-9 pr-3 py-2.5 focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoading ? t('যাচাই করা হচ্ছে...', 'Authenticating...') : t('ড্যাশবোর্ডে প্রবেশ করুন', 'Enter Admin Dashboard')}</span>
            </button>
          </form>

          {/* Quick Leadership Demo Fill */}
          <div className="pt-3 border-t border-stone-200 space-y-2">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block text-center">
              {t('টেস্টিং ক্রেডেনশিয়াল (Quick Access)', 'Testing Credentials (Quick Access)')}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleAutofillOsman}
                className="p-2 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 border border-stone-200 rounded-lg text-left text-xs transition-colors cursor-pointer"
              >
                <div className="font-bold">ওসমান গনি</div>
                <div className="text-[10px] text-stone-500">System Admin</div>
              </button>

              <button
                type="button"
                onClick={handleAutofillMarufa}
                className="p-2 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 border border-stone-200 rounded-lg text-left text-xs transition-colors cursor-pointer"
              >
                <div className="font-bold">মোসাম্মৎ মারুফা খাতুন</div>
                <div className="text-[10px] text-stone-500">Founder & CEO</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
