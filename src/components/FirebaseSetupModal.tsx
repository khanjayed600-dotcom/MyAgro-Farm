/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Database,
  X,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
} from 'lucide-react';
import {
  getFirebaseConfig,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  isFirebaseConfigured,
  FirebaseConfigOptions,
} from '../firebase/firebase.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface FirebaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseSetupModal: React.FC<FirebaseSetupModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const currentConfig = getFirebaseConfig();
  const isConfigured = isFirebaseConfigured();

  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [projectId, setProjectId] = useState(currentConfig?.projectId || '');
  const [authDomain, setAuthDomain] = useState(currentConfig?.authDomain || '');
  const [appId, setAppId] = useState(currentConfig?.appId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig?.messagingSenderId || '');

  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      alert('API Key এবং Project ID পূরণ করা আবশ্যক।');
      return;
    }

    const config: FirebaseConfigOptions = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      appId: appId.trim(),
      storageBucket: storageBucket.trim() || `${projectId.trim()}.appspot.com`,
      messagingSenderId: messagingSenderId.trim(),
    };

    saveCustomFirebaseConfig(config);
    setSaveStatus('Firebase সফলভাবে কনফিগার করা হয়েছে!');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    if (confirm('আপনি কি বিদ্যমান Firebase কনফিগারেশন মুছে ফেলতে চান?')) {
      clearCustomFirebaseConfig();
    }
  };

  const netlifyEnvExample = `VITE_FIREBASE_API_KEY=${apiKey || 'AIzaSy...'}\nVITE_FIREBASE_PROJECT_ID=${projectId || 'myagro-farm-xxxx'}\nVITE_FIREBASE_AUTH_DOMAIN=${authDomain || (projectId ? `${projectId}.firebaseapp.com` : 'myagro-farm-xxxx.firebaseapp.com')}\nVITE_FIREBASE_APP_ID=${appId || '1:123456789:web:abcdef'}\nVITE_FIREBASE_ADMIN_EMAIL=khanjayed600@gmail.com`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(netlifyEnvExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-stone-200 max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                {t('ফায়ারবেস ক্লাউড ডাটাবেস সংযোগ', 'Firebase Central Database Setup')}
              </h2>
              <p className="text-xs text-stone-400">
                {t('যেকোনো ডিভাইস থেকে অর্ডার ও রিয়েল-টাইম অ্যাডমিন প্যানেল সিঙ্ক', 'Centralized cross-device ordering & live admin panel')}
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

        {/* Status Indicator */}
        <div className="px-6 py-3.5 bg-stone-100 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-700">{t('বর্তমান ডাটাবেস স্ট্যাটাস:', 'Current Database Status:')}</span>
            {isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('সরাসরি ফায়ারবেসে সংযুক্ত (Live Firestore)', 'Connected to Live Firestore')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t('কনফিগারেশন অপেক্ষমাণ (লোকাল স্টোরেজ সক্রিয়)', 'Pending Config (Local fallback active)')}
              </span>
            )}
          </div>

          {currentConfig && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
            >
              {t('রিসেট করুন', 'Reset Config')}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-800">
          {/* Quick Guide Card */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs space-y-2 text-emerald-950">
            <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>{t('কীভাবে সহজে সেটআপ করবেন (Step-by-step Guide)', 'How to Connect in 3 Simple Steps')}</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-emerald-900/90 leading-relaxed">
              <li>
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline inline-flex items-center gap-1 text-emerald-700"
                >
                  Firebase Console <ExternalLink className="w-3 h-3" />
                </a>{' '}
                -এ গিয়ে একটি নতুন প্রজেক্ট তৈরি করুন।
              </li>
              <li>
                <strong>Build &gt; Firestore Database</strong> থেকে ডাটাবেস সক্রিয় করুন (rules ফাইলে প্রদত্ত সিকিউরিটি রুলস স্বয়ংক্রিয়ভাবে প্রস্তুত)।
              </li>
              <li>
                <strong>Project Settings &gt; General &gt; Your apps</strong> থেকে Web App (<code>&lt;/&gt;</code>) যোগ করে ক্রেডেনশিয়াল নিচে পেস্ট করুন বা Netlify-তে ভ্যারিয়েবল সেট করুন।
              </li>
            </ol>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  API Key <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSyA1B2C3D4..."
                  className="w-full text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Project ID <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="myagro-farm-12345"
                  className="w-full text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Auth Domain
                </label>
                <input
                  type="text"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  placeholder="myagro-farm-12345.firebaseapp.com"
                  className="w-full text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  App ID
                </label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:123456789:web:abcdef..."
                  className="w-full text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-stone-500">
                {t('তথ্য সরাসরি এই ব্রাউজারে সংরক্ষিত হবে।', 'Stored securely in your current browser.')}
              </span>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                {t('সেভ করুন ও সংযুক্ত করুন', 'Save & Connect Live Database')}
              </button>
            </div>
          </form>

          {/* Netlify Deployment Section */}
          <div className="pt-4 border-t border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                  {t('Netlify ডিপ্লয়মেন্ট এনভায়রনমেন্ট ভ্যারিয়েবল', 'Netlify Deployment Environment Variables')}
                </h3>
              </div>
              <button
                type="button"
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-300 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? t('কপি হয়েছে!', 'Copied!') : t('কপি করুন', 'Copy Env Format')}
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {t(
                'Netlify-তে সাইট ডিপ্লয় করার পর Netlify Dashboard &gt; Site configuration &gt; Environment variables-এ এই ভ্যারিয়েবলগুলো যোগ করে দিন। এতে কোনো সার্ভার ছাড়াই সম্পূর্ণ ফ্রন্টএন্ড থেকে ক্লাউড ফায়ারবেস কার্যকর হবে।',
                'Add these in Netlify Dashboard > Site configuration > Environment variables. Your site will run as a serverless SPA connecting directly to Firestore!'
              )}
            </p>

            <pre className="bg-stone-900 text-emerald-400 p-3 rounded-xl text-[11px] font-mono overflow-x-auto selection:bg-stone-700">
              {netlifyEnvExample}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {t('বন্ধ করুন', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
