/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, ShieldCheck, Truck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface HeroBannerProps {
  onShopNow: () => void;
  onTrackOrder: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onShopNow, onTrackOrder }) => {
  const { t } = useLanguage();

  return (
    <section className="bg-gradient-to-b from-stone-100 to-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* 2-Column Split Hero with stretch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Editorial Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide">
              <span>{t('কুড়িগ্রাম ও রংপুর বিভাগের নিজস্ব খামার', 'Native Farmstead from Kurigram & Rangpur')}</span>
              <span aria-hidden="true">·</span>
              <span>{t('সরাসরি কৃষকের তৈরি', 'Direct from Farmers')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 leading-[1.15] text-balance font-sans">
              {t(
                'খামার থেকে খাঁটি খাবার সরাসরি আপনার পরিবারের টেবিলে',
                'Authentic, Farm-Fresh Food Direct to Your Family Table'
              )}
            </h1>

            <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-xl">
              {t(
                'কাঠের ঘানির খাঁটি সরিষার তেল, প্রাকৃতিক খলিসা মধু, গাওয়া দানাদার ঘি, সুগন্ধি চাল এবং টাটকা মসলা। কোনো রাসায়নিক প্রিজারভেটিভ নেই—শতভাগ খাঁটি ও ট্রেসেবল।',
                'Cold-pressed wooden ghani mustard oil, raw wildflower honey, granulated cow milk ghee, aromatic rice, and clean ground spices. Zero adulteration, 100% farm-traceable.'
              )}
            </p>

            {/* Quick Proof Strip */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-700 font-medium pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                {t('নিজস্ব তত্ত্বাবধানে প্রস্তুত', 'Farmer Supervised')}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                {t('বিএসটিআই ও ল্যাব টেস্ট নিশ্চিত', 'Lab Tested Purity')}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                {t('সারা বাংলাদেশে হোম ডেলিভারি', 'Nationwide Delivery')}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onShopNow}
                className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>{t('তাজা পণ্য দেখুন', 'Explore Products')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onTrackOrder}
                className="px-5 py-3 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                {t('অর্ডার ট্র্যাক করুন', 'Track Order')}
              </button>
            </div>
          </div>

          {/* Right Visual Image */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden shadow-md border border-stone-200 aspect-[4/3] lg:aspect-auto lg:h-[380px] bg-stone-200">
              <img
                src="/src/assets/images/hero_agro_farm_1792012102295.jpg"
                alt="MyAgro Farm Farmlands in Kurigram"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-5">
                <div className="text-white space-y-1">
                  <div className="text-xs font-semibold text-emerald-300">
                    {t('কুড়িগ্রামের চরাঞ্চলের নিজস্ব কৃষিজমি', 'Farmland of Kurigram')}
                  </div>
                  <div className="text-sm font-medium">
                    {t('প্রতিষ্ঠাতা: মোসাম্মৎ মারুফা খাতুন', 'Founder: Mosammat Marufa Khatun')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Feature Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900">{t('১০০% খাঁটি পণ্য', '100% Authentic')}</h4>
              <p className="text-[11px] text-stone-500">{t('ভেজালমুক্ত ও স্বাস্থ্যসম্মত', 'No chemicals or dyes')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900">{t('দ্রুত ডেলিভারি', 'Fast Home Delivery')}</h4>
              <p className="text-[11px] text-stone-500">{t('কুড়িগ্রাম ২৪ ঘ., সারা দেশ ৪৮-৭২ ঘ.', 'Fast dispatch & tracking')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900">{t('ক্যাশ অন ডেলিভারি', 'Cash on Delivery')}</h4>
              <p className="text-[11px] text-stone-500">{t('হাতে পেয়ে মূল্য পরিশোধ', 'Pay after receiving')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900">{t('সহজ রিটার্ন পলিসি', 'Easy Return Policy')}</h4>
              <p className="text-[11px] text-stone-500">{t('সমস্যা হলে রিফান্ড নিশ্চয়তা', 'Instant support & replace')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
