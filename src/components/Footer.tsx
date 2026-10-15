/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin, Phone, Mail, ShieldCheck, Heart, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface FooterProps {
  onOpenInfo: (type: 'about' | 'delivery' | 'refund' | 'contact' | 'privacy') => void;
  onOpenAdminLogin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenInfo, onOpenAdminLogin }) => {
  const { t } = useLanguage();

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white tracking-tight font-sans">
                MyAgro Farm
              </span>
              <span className="text-xs text-emerald-400 font-semibold">(মাই এগ্রো ফার্ম)</span>
            </div>

            <p className="text-stone-400 leading-relaxed max-w-sm">
              {t(
                'কুড়িগ্রাম ও রংপুর বিভাগের চরাঞ্চলের পরিশ্রমী কৃষকদের থেকে সরাসরি সংগৃহীত খাঁটি সরিষার তেল, প্রাকৃতিক মধু, গাওয়া ঘি, চাল ও বিশুদ্ধ মসলা পৌঁছে দিচ্ছি আপনার ঘরে।',
                'Delivering pure farm-to-table organic and fresh food directly from Kurigram farmlands to homes across Bangladesh.'
              )}
            </p>

            {/* Leadership Info */}
            <div className="p-3 bg-stone-800/80 rounded-xl border border-stone-700/60 space-y-1 text-stone-300">
              <div className="text-stone-200">
                প্রতিষ্ঠাতা ও সিইও: <strong className="text-white">মোসাম্মৎ মারুফা খাতুন</strong>
              </div>
              <div className="text-stone-400 text-[11px]">
                সিস্টেম অ্যাডমিনিস্ট্রেটর: <strong className="text-stone-300">ওসমান গনি</strong>
              </div>
              <div className="text-stone-400 text-[11px]">
                প্রধান কার্যালয়: কুড়িগ্রাম সদর, রংপুর বিভাগ, বাংলাদেশ
              </div>
            </div>
          </div>

          {/* Col 2: Useful Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">
              {t('প্রয়োজনীয় লিংক', 'Company & Story')}
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button
                  onClick={() => onOpenInfo('about')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {t('আমাদের খামারের পরিচিতি', 'About Our Farms')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenInfo('delivery')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {t('ডেলিভারি পলিসি ও এলাকা', 'Delivery Coverage')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenInfo('refund')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {t('রিটার্ন ও রিফান্ড নীতি', 'Return & Refund Policy')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenInfo('privacy')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {t('শর্তাবলী ও প্রাইভেসি', 'Terms & Privacy Policy')}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Product Highlights */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">
              {t('জনপ্রিয় খাদ্যপণ্য', 'Popular Products')}
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li>{t('ঘানির খাঁটি সরিষার তেল', 'Cold-Pressed Mustard Oil')}</li>
              <li>{t('প্রাকৃতিক খলিসা মধু', 'Raw Multifloral Honey')}</li>
              <li>{t('খাঁটি গাওয়া দানাদার ঘি', 'Grass-Fed Cow Ghee')}</li>
              <li>{t('সুগন্ধি চিনিগুঁড়া পোলাও চাল', 'Aromatic Chinigura Rice')}</li>
              <li>{t('বোঁটাহীন শুকনো মরিচ গুঁড়া', 'Stemless Red Chili Powder')}</li>
            </ul>
          </div>

          {/* Col 4: Contact & Office */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">
              {t('যোগাযোগ ও সহায়তা', 'Customer Hotline')}
            </h4>
            <div className="space-y-2 text-stone-400">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-white font-semibold">01712-345678</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>contact@myagrofarm.com</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>কুড়িগ্রাম সদর, রংপুর বিভাগ</span>
              </div>
            </div>

            {/* Admin Portal Gateway */}
            <div className="pt-2">
              <button
                onClick={onOpenAdminLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>{t('ম্যানেজমেন্ট অ্যাডমিন পোর্টাল', 'Management Admin Login')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar with payment marks and copyright */}
        <div className="mt-12 pt-6 border-t border-stone-800 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            © 2026 MyAgro Farm (মাই এগ্রো ফার্ম). {t('সর্বস্বত্ব সংরক্ষিত।', 'All rights reserved.')}
          </div>

          {/* Clean payment text references */}
          <div className="flex items-center gap-3 text-[11px] text-stone-400 font-medium">
            <span>{t('নিরাপদ পেমেন্ট:', 'Accepted Payments:')}</span>
            <span className="text-stone-300 font-semibold">ক্যাশ অন ডেলিভারি (COD)</span>
            <span aria-hidden="true">·</span>
            <span className="text-pink-400 font-semibold">বিকাশ (bKash)</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-400 font-semibold">নগদ (Nagad)</span>
            <span aria-hidden="true">·</span>
            <span className="text-stone-300 font-semibold">ব্যাংক ট্রান্সফার</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
