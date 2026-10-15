/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, MapPin, Phone, Mail, Award, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface InfoModalProps {
  type: 'about' | 'delivery' | 'refund' | 'contact' | 'privacy' | null;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ type, onClose }) => {
  const { lang, t } = useLanguage();

  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <h2 className="font-bold text-stone-900 text-base">
            {type === 'about' && t('আমাদের পরিচিতি ও খামারের গল্প', 'About Us & Farm Legacy')}
            {type === 'delivery' && t('ডেলিভারি পলিসি ও চার্জ', 'Delivery Policy & Rates')}
            {type === 'refund' && t('রিটার্ন ও রিফান্ড নীতিমালা', 'Return & Refund Policy')}
            {type === 'contact' && t('যোগাযোগ ও প্রধান কার্যালয়', 'Contact & Head Office')}
            {type === 'privacy' && t('প্রাইভেসি পলিসি ও শর্তাবলী', 'Privacy Policy & Terms')}
          </h2>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed flex-1">
          {type === 'about' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  {t('প্রতিষ্ঠাতা ও সিইও বার্তা', 'Leadership Note')}
                </span>
                <h4 className="font-bold text-base">মোসাম্মৎ মারুফা খাতুন (মিস মারুফা খাতুন)</h4>
                <p className="text-xs leading-relaxed">
                  "আমাদের লক্ষ্য সাধারণ মুনাফা নয়—বরং কুড়িগ্রামের চরাঞ্চল ও উত্তরের উর্বর জমির কৃষক ভাইদের পরিশ্রমের খাঁটি ফসল মধ্যস্বত্বভোগী ছাড়া সরাসরি শহরের প্রতিটি স্বাস্থ্যসচেতন পরিবারের ডাইনিং টেবিলে পৌঁছে দেওয়া।"
                </p>
                <div className="text-[11px] text-emerald-800 pt-1">
                  সিস্টেম অ্যাডমিনিস্ট্রেটর: <strong>ওসমান গনি</strong>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-stone-900 text-sm mb-1">
                  {t('কেন মাই এগ্রো ফার্ম?', 'Why MyAgro Farm?')}
                </h3>
                <p>
                  আমরা উত্তরবঙ্গের কুড়িগ্রাম জেলার স্থানীয় কৃষকদের সাথে অংশীদারিত্বের মাধ্যমে নিজস্ব খামারে উৎপাদিত খাঁটি সরিষা থেকে কাঠের ঘানির তেল, প্রাকৃতিক মধু, গাওয়া ঘি, ও খাঁটি চাল-মসলা সংগ্রহ করি।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <strong className="block text-stone-900 mb-1">{t('১০০% খাঁটি ও ট্রেসেবল', '100% Traceable')}</strong>
                  <p className="text-xs text-stone-600">প্রতিটি পণ্যের খামারের ঠিকানা ও ফসল কাটার সময় উল্লেখ থাকে।</p>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <strong className="block text-stone-900 mb-1">{t('ল্যাব টেস্টে নিরাপদ', 'Lab Tested Purity')}</strong>
                  <p className="text-xs text-stone-600">কোনো কৃত্রিম বিষাক্ত রঙ বা ভেজালমুক্তির সার্বক্ষণিক ল্যাব পরীক্ষা।</p>
                </div>
              </div>
            </div>
          )}

          {type === 'delivery' && (
            <div className="space-y-3">
              <p>
                {t(
                  'মাই এগ্রো ফার্ম কুড়িগ্রাম সদর ও রংপুর থেকে নিজস্ব ডেলিভারি ও দেশের শীর্ষ কুরিয়ার সার্ভিসের মাধ্যমে সারাদেশে পণ্য পৌঁছে দেয়।',
                  'We ship products from Kurigram & Rangpur hubs nationwide.'
                )}
              </p>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <div className="flex justify-between border-b border-stone-200 pb-1">
                  <span>কুড়িগ্রাম সদর (Kurigram Sadar)</span>
                  <span className="font-bold tabular-nums">৳৫০ (২৪ ঘণ্টার মধ্যে ডেলিভারি)</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-1">
                  <span>রংপুর বিভাগ (Rangpur Division)</span>
                  <span className="font-bold tabular-nums">৳৮০ (২৪-৪৮ ঘণ্টা)</span>
                </div>
                <div className="flex justify-between">
                  <span>ঢাকা ও সারাদেশ (Nationwide Courier)</span>
                  <span className="font-bold tabular-nums">৳১২০ (২-৩ দিন)</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-950 font-bold text-xs">
                {t('বিশেষ সুবিধা: ৳২,০০০ বা তার বেশি মূল্যের অর্ডারে সারা বাংলাদেশে সম্পূর্ণ ফ্রি ডেলিভারি!', 'Free nationwide delivery on orders over ৳2,000!')}
              </div>
            </div>
          )}

          {type === 'refund' && (
            <div className="space-y-3">
              <h3 className="font-bold text-stone-900">
                {t('৭ দিনের সহজ রিটার্ন ও রিফান্ড গ্যারান্টি', '7-Day Return & Replacement Policy')}
              </h3>
              <p>
                পণ্য গ্রহণের পর যদি প্যাকেটে কোনো লিকেজ, ভাঙা বা পণ্যের মান সন্তোষজনক না মনে হয়, আপনি ডেলিভারির ৭ দিনের মধ্যে আমাদের ওয়েবসাইট থেকে সরাসরি অভিযোগ বা রিফান্ড আবেদন করতে পারবেন।
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-stone-600">
                <li>ডেলিভারি রাইডারের উপস্থিতিতে প্যাকেট যাচাই করে নেওয়া উত্তম।</li>
                <li>ত্রুটিযুক্ত পণ্য দ্রুত বিনামূল্যে পরিবর্তন করে নতুন পণ্য পাঠানো হয়।</li>
                <li>অনলাইন পেমেন্ট করা থাকলে ৩-৫ কার্যদিবসের মধ্যে একই অ্যাকাউন্টে টাকা রিফান্ড করা হবে।</li>
              </ul>
            </div>
          )}

          {type === 'contact' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-900">{t('প্রধান কার্যালয়', 'Head Office')}:</strong>
                    <span>কলেজ মোড়, কুড়িগ্রাম সদর, রংপুর বিভাগ, বাংলাদেশ</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-900">{t('ফোন / হটলাইন', 'Phone / Hotline')}:</strong>
                    <span className="font-mono">+880 1712-345678 (সকাল ৮টা - রাত ১০টা)</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-900">{t('ইমেইল', 'Email')}:</strong>
                    <span>contact@myagrofarm.com</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs">
                <strong>{t('খামার পরিদর্শন', 'Farm Visits')}:</strong>
                <p className="text-stone-600 mt-1">
                  অগ্রিম নোটিশে কুড়িগ্রাম চরাঞ্চলের সরিষা খেত ও ডেইরি খামার পরিদর্শনে স্বাস্থ্যসচেতন পরিবার ও কৃষি গবেষকদের সবসময় স্বাগতম।
                </p>
              </div>
            </div>
          )}

          {type === 'privacy' && (
            <div className="space-y-3">
              <h3 className="font-bold text-stone-900">{t('তথ্য সুরক্ষা ও গোপনীয়তা', 'Privacy Commitment')}</h3>
              <p>
                মাই এগ্রো ফার্ম আপনার নাম, মোবাইল নম্বর এবং ডেলিভারি ঠিকানাকে সর্বোচ্চ নিরাপত্তার সাথে সংরক্ষণ করে। আপনার কোনো ব্যক্তিগত তথ্য বা পেমেন্ট তথ্য কোনো তৃতীয় পক্ষের কাছে বিক্রি বা শেয়ার করা হয় না।
              </p>
              <p className="text-stone-500 text-xs">
                অনলাইন পেমেন্টের ক্ষেত্রে কোনো পিন (PIN) বা ওটিপি (OTP) সংরক্ষণ করা হয় না; শুধুমাত্র নিরাপদ ট্রানজেকশন রেফারেন্স অডিট ট্রেইলে যুক্ত থাকে।
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
