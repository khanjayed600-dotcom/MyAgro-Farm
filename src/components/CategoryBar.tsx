/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Droplet,
  Sparkles,
  Flame,
  Sprout,
  Wheat,
  Apple,
  CircleDot,
  Layers,
  Sun,
  Cookie,
  Feather,
  Coffee,
  Package,
  LayoutGrid,
} from 'lucide-react';
import { Category } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface CategoryBarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Droplet,
  Sparkles,
  Flame,
  Sprout,
  Wheat,
  Apple,
  CircleDot,
  Layers,
  Sun,
  Cookie,
  Feather,
  Coffee,
  Package,
};

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const { lang, t } = useLanguage();

  return (
    <section className="bg-stone-50 border-b border-stone-200 py-3 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1">
          {/* All Categories Option */}
          <button
            onClick={() => onSelectCategory('all')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-emerald-900 text-white shadow-sm'
                : 'bg-white text-stone-700 border border-stone-200 hover:border-emerald-700 hover:text-emerald-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span>{t('সকল ক্যাটাগরি', 'All Categories')}</span>
          </button>

          {/* 13 Categories */}
          {categories.map((cat) => {
            const Icon = ICON_MAP[cat.iconName] || Package;
            const isSelected = selectedCategory === cat.slug;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-900 text-white shadow-sm'
                    : 'bg-white text-stone-700 border border-stone-200 hover:border-emerald-700 hover:text-emerald-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-300' : 'text-emerald-700'}`} />
                <span>{lang === 'bn' ? cat.nameBn : cat.nameEn}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
