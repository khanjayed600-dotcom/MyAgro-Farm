/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  Heart,
  User as UserIcon,
  Globe,
  ShieldCheck,
  Menu,
  X,
  MapPin,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenAdminLogin: () => void;
  onOpenTracking: () => void;
  onNavigateSection: (section: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenProfile,
  onOpenAdminLogin,
  onOpenTracking,
  onNavigateSection,
  searchQuery,
  setSearchQuery,
}) => {
  const { lang, toggleLang, t } = useLanguage();
  const { user, adminUser } = useAuth();
  const { totalItemsCount, setIsCartDrawerOpen } = useCart();
  const { wishlistIds, setIsWishlistOpen } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* Top Notification / Trust Strip */}
      <div className="bg-stone-900 text-stone-200 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              {t('কুড়িগ্রাম সদর ও রংপুর থেকে সারাদেশে ডেলিভারি', 'Delivering nationwide from Kurigram & Rangpur')}
            </span>
            <span className="hidden sm:inline text-stone-500">·</span>
            <span className="hidden sm:inline text-stone-300">
              {t('৳২,০০০+ অর্ডারে সম্পূর্ণ ফ্রি ডেলিভারি', 'Free delivery on orders over ৳2,000')}
            </span>
          </div>

          <div className="flex items-center gap-4 text-stone-400">
            <span className="flex items-center gap-1 hover:text-stone-200 transition-colors">
              <PhoneCall className="w-3 h-3" />
              01712-345678
            </span>
            <span className="text-stone-600">·</span>
            <button
              onClick={onOpenAdminLogin}
              className="text-stone-400 hover:text-emerald-400 text-xs transition-colors cursor-pointer"
            >
              {adminUser ? t('অ্যাডমিন পোর্টাল ✓', 'Admin Portal ✓') : t('অ্যাডমিন লগইন', 'Admin Portal')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar complying with 3-Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single element Brand Wordmark */}
        <button
          onClick={() => onNavigateSection('home')}
          className="text-left shrink-0 cursor-pointer group flex items-baseline gap-2"
        >
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-950 font-sans group-hover:text-emerald-800 transition-colors">
            MyAgro Farm
          </span>
          <span className="text-sm font-semibold text-emerald-700 hidden sm:inline">
            (মাই এগ্রো ফার্ম)
          </span>
        </button>

        {/* Zone 2: 4-5 concise single-line text links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-stone-700">
          <button
            onClick={() => onNavigateSection('home')}
            className="hover:text-emerald-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            {t('হোম', 'Home')}
          </button>
          <button
            onClick={() => onNavigateSection('products')}
            className="hover:text-emerald-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            {t('সকল পণ্য', 'All Products')}
          </button>
          <button
            onClick={() => onNavigateSection('farms')}
            className="hover:text-emerald-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            {t('আমাদের খামার', 'Our Farms')}
          </button>
          <button
            onClick={() => onNavigateSection('story')}
            className="hover:text-emerald-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            {t('খামার পরিচিতি ও সিইও', 'About & Leadership')}
          </button>
          <button
            onClick={onOpenTracking}
            className="hover:text-emerald-800 transition-colors whitespace-nowrap cursor-pointer text-emerald-700 font-semibold"
          >
            {t('অর্ডার ট্র্যাকিং', 'Track Order')}
          </button>
        </nav>

        {/* Zone 3: Functional Utilities & Cart CTA */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Search Input */}
          <div className="relative hidden md:block w-48 xl:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('সরিষা তেল, মধু, ঘি খুঁজুন...', 'Search mustard oil, honey...')}
              className="w-full text-xs bg-stone-100 hover:bg-stone-50 focus:bg-white text-stone-900 placeholder:text-stone-400 pl-8 pr-3 py-2 rounded-lg border border-transparent focus:border-emerald-600 focus:outline-none transition-all"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-stone-400 hover:text-stone-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Language Switch */}
          <button
            onClick={toggleLang}
            className="p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title="বাংলা / English"
          >
            <Globe className="w-4 h-4 text-stone-500" />
            <span>{lang === 'bn' ? 'বাং' : 'EN'}</span>
          </button>

          {/* Wishlist Button */}
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="relative p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            title={t('উইশলিস্ট', 'Wishlist')}
          >
            <Heart className={`w-5 h-5 ${wishlistIds.length > 0 ? 'text-rose-600 fill-rose-600' : ''}`} />
            {wishlistIds.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
                {wishlistIds.length}
              </span>
            )}
          </button>

          {/* Account Button */}
          {user ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <UserIcon className="w-4 h-4 text-emerald-700" />
              <span className="max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              title={t('লগইন / নিবন্ধন', 'Login / Register')}
            >
              <UserIcon className="w-5 h-5" />
            </button>
          )}

          {/* Primary Action: Shopping Cart Button */}
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="relative flex items-center gap-2 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">{t('কার্ট', 'Cart')}</span>
            <span className="bg-emerald-700 px-1.5 py-0.5 rounded text-[11px] font-bold tabular-nums">
              {totalItemsCount}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search & Menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('পণ্য খুঁজুন...', 'Search products...')}
              className="w-full text-sm bg-stone-100 text-stone-900 placeholder:text-stone-400 pl-9 pr-3 py-2.5 rounded-lg border border-transparent focus:border-emerald-600 focus:outline-none"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </div>

          <div className="flex flex-col space-y-2 pt-2 text-sm font-medium text-stone-700">
            <button
              onClick={() => {
                onNavigateSection('home');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-2 hover:bg-stone-50 rounded"
            >
              {t('হোম', 'Home')}
            </button>
            <button
              onClick={() => {
                onNavigateSection('products');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-2 hover:bg-stone-50 rounded"
            >
              {t('সকল পণ্য', 'All Products')}
            </button>
            <button
              onClick={() => {
                onNavigateSection('farms');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-2 hover:bg-stone-50 rounded"
            >
              {t('আমাদের খামার', 'Our Farms')}
            </button>
            <button
              onClick={() => {
                onNavigateSection('story');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-2 hover:bg-stone-50 rounded"
            >
              {t('খামার পরিচিতি ও সিইও', 'About & Leadership')}
            </button>
            <button
              onClick={() => {
                onOpenTracking();
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-2 text-emerald-700 font-semibold hover:bg-emerald-50 rounded"
            >
              {t('অর্ডার ট্র্যাক করুন', 'Track Order')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
