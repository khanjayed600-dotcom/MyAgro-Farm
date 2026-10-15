/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Lock, Phone, User as UserIcon, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { loginCustomer, registerCustomer } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [district, setDistrict] = useState('কুড়িগ্রাম');
  const [thana, setThana] = useState('কুড়িগ্রাম সদর');
  const [streetAddress, setStreetAddress] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const res = await loginCustomer(identifier.trim(), password);
    setIsLoading(false);
    if (!res.success) {
      setError(res.error || 'লগইন ব্যর্থ হয়েছে।');
    } else {
      onClose();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !regPhone.trim() || !regPassword.trim()) {
      setError(t('নাম, ফোন ও পাসওয়ার্ড আবশ্যক।', 'Name, phone and password required.'));
      return;
    }

    setIsLoading(true);
    const res = await registerCustomer({
      name: name.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim() || undefined,
      password: regPassword,
      district,
      thana,
      streetAddress: streetAddress.trim(),
    });
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || 'নিবন্ধন ব্যর্থ হয়েছে।');
    } else {
      onClose();
    }
  };

  const handleDemoFill = () => {
    setMode('login');
    setIdentifier('01711223344');
    setPassword('Customer123!');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-800" />
            <h2 className="font-bold text-stone-900 text-sm sm:text-base">
              {mode === 'login'
                ? t('গ্রাহক একাউন্টে লগইন করুন', 'Customer Account Login')
                : t('নতুন একাউন্ট খুলুন', 'Create Customer Account')}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-stone-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              mode === 'login'
                ? 'border-b-2 border-emerald-800 text-emerald-950 bg-white font-bold'
                : 'text-stone-500 bg-stone-50 hover:text-stone-900'
            }`}
          >
            {t('লগইন', 'Sign In')}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              mode === 'register'
                ? 'border-b-2 border-emerald-800 text-emerald-950 bg-white font-bold'
                : 'text-stone-500 bg-stone-50 hover:text-stone-900'
            }`}
          >
            {t('নতুন নিবন্ধন', 'Register')}
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  {t('মোবাইল নম্বর বা ইমেইল *', 'Phone Number or Email *')}
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="01711223344"
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  {t('পাসওয়ার্ড *', 'Password *')}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoading ? t('প্রবেশ করা হচ্ছে...', 'Signing In...') : t('লগইন করুন', 'Sign In')}
              </button>

              {/* Quick Demo Credentials */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="text-xs text-emerald-800 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('ডেমো ক্রেতা অ্যাকাউন্ট দিয়ে টেস্ট করুন', 'Autofill Demo Customer Credentials')}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  {t('আপনার পূর্ণ নাম *', 'Full Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('যেমন: শফিকুল আলম', 'e.g. Shafiqul Alam')}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-stone-700 block mb-1">
                    {t('মোবাইল নম্বর *', 'Phone Number *')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="01712345678"
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 font-mono focus:bg-white focus:border-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-700 block mb-1">
                    {t('পাসওয়ার্ড *', 'Password *')}
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 focus:bg-white focus:border-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  {t('ঠিকানা (ঐচ্ছিক)', 'Delivery Address (Optional)')}
                </label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder={t('বাড়ি, রোড বা এলাকা...', 'House, road, locality...')}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer mt-2 disabled:opacity-50"
              >
                {isLoading ? t('নিবন্ধন হচ্ছে...', 'Creating Account...') : t('অ্যাকাউন্ট খুলুন', 'Create Account')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
