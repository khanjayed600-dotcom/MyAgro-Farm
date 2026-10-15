/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LanguageProvider,
  useLanguage,
} from './context/LanguageContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider, useCart } from './context/CartContext.tsx';
import { WishlistProvider, useWishlist } from './context/WishlistContext.tsx';

import { Navbar } from './components/Navbar.tsx';
import { CategoryBar } from './components/CategoryBar.tsx';
import { HeroBanner } from './components/HeroBanner.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { OrderSuccessModal } from './components/OrderSuccessModal.tsx';
import { OrderTrackingModal } from './components/OrderTrackingModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { CustomerProfileModal } from './components/CustomerProfileModal.tsx';
import { ComplaintModal } from './components/ComplaintModal.tsx';
import { WishlistModal } from './components/WishlistModal.tsx';
import { InfoModal } from './components/InfoModal.tsx';
import { Footer } from './components/Footer.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { AdminLoginModal } from './components/admin/AdminLoginModal.tsx';
import { FirebaseSetupModal } from './components/FirebaseSetupModal.tsx';

import { Product, Category, Order } from './types.ts';
import {
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  Sparkles,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Award,
  Star,
} from 'lucide-react';

function StorefrontApp() {
  const { lang, t } = useLanguage();
  const { adminUser } = useAuth();
  const { isCartDrawerOpen, setIsCartDrawerOpen } = useCart();

  // Navigation View: Storefront vs Admin
  const [view, setView] = useState<'storefront' | 'admin'>('storefront');

  // Product and Category Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<number>(2000);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingOrderNo, setTrackingOrderNo] = useState('');
  const [trackingPhone, setTrackingPhone] = useState('');
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [complaintOrderNo, setComplaintOrderNo] = useState('');
  const [infoModalType, setInfoModalType] = useState<'about' | 'delivery' | 'refund' | 'contact' | 'privacy' | null>(null);
  const [isFirebaseSetupOpen, setIsFirebaseSetupOpen] = useState(false);

  // Fetch Products & Categories
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [selectedCategory, searchQuery, sortBy, inStockOnly, priceRange]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (inStockOnly) params.append('inStock', 'true');
      if (sortBy) params.append('sort', sortBy);
      params.append('maxPrice', String(priceRange));

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleOpenTrackingWithDetails = (orderNo: string, phone: string) => {
    setTrackingOrderNo(orderNo);
    setTrackingPhone(phone);
    setIsTrackingOpen(true);
  };

  const handleOpenComplaintWithOrder = (orderNo: string = '') => {
    setComplaintOrderNo(orderNo);
    setIsComplaintOpen(true);
  };

  const handleNavigateSection = (section: string) => {
    if (section === 'home') {
      setSelectedCategory('all');
      setSearchQuery('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (section === 'products') {
      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'farms' || section === 'story') {
      document.getElementById('farm-story-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // If in Admin view, render AdminDashboard directly
  if (view === 'admin' && adminUser) {
    return <AdminDashboard onBackToStore={() => setView('storefront')} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900 selection:bg-emerald-800 selection:text-white">
      {/* 1. Header & Navigation */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAdminLogin={() => {
          if (adminUser) {
            setView('admin');
          } else {
            setIsAdminLoginOpen(true);
          }
        }}
        onOpenTracking={() => setIsTrackingOpen(true)}
        onNavigateSection={handleNavigateSection}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* 2. Category Navigation Bar (All 13 categories) */}
      <CategoryBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(slug) => {
          setSelectedCategory(slug);
          document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 3. Hero Campaign Banner */}
      <HeroBanner
        onShopNow={() => {
          document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onTrackOrder={() => setIsTrackingOpen(true)}
      />

      {/* 4. Products & Catalog Section */}
      <section id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full flex-1 space-y-6">
        {/* Section Header & Filters Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              <span>{t('তাজা ও খাঁটি খাদ্য সম্ভার', 'Farm Fresh Catalog')}</span>
              <span aria-hidden="true">·</span>
              <span className="text-stone-500 font-normal">
                {products.length} {t('টি পণ্য প্রদর্শিত হচ্ছে', 'products found')}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mt-1 font-sans">
              {selectedCategory === 'all'
                ? t('আমাদের খামারজাত খাদ্যপণ্য', 'Our Fresh Farm Products')
                : categories.find((c) => c.slug === selectedCategory)?.nameBn || 'নির্বাচিত পণ্যসমূহ'}
            </h2>
          </div>

          {/* Interactive Filter Controls complying with Design Constitution */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* In-Stock Toggle Filter */}
            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                inStockOnly
                  ? 'bg-emerald-900 text-white border-emerald-900'
                  : 'bg-white text-stone-700 border-stone-300 hover:border-emerald-800'
              }`}
            >
              {t('শুধু মজুদ আছে', 'In Stock Only')}
            </button>

            {/* Price filter dropdown */}
            <div className="relative">
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-semibold bg-white text-stone-700 border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800 cursor-pointer"
              >
                <option value={2000}>{t('সর্বোচ্চ মূল্য: ৳২,০০০ পর্যন্ত', 'Price: Up to ৳2,000')}</option>
                <option value={1000}>{t('সর্বোচ্চ মূল্য: ৳১,০০০ পর্যন্ত', 'Price: Up to ৳1,000')}</option>
                <option value={500}>{t('সর্বোচ্চ মূল্য: ৳৫০০ পর্যন্ত', 'Price: Up to ৳500')}</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-white text-stone-700 border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-800 cursor-pointer"
              >
                <option value="popular">{t('জনপ্রিয়তা অনুযায়ী (Popular)', 'Most Popular')}</option>
                <option value="price_asc">{t('মূল্য: কম থেকে বেশি', 'Price: Low to High')}</option>
                <option value="price_desc">{t('মূল্য: বেশি থেকে কম', 'Price: High to Low')}</option>
                <option value="rating">{t('সর্বোচ্চ রেটিং', 'Highest Rated')}</option>
                <option value="newest">{t('নতুন সংগৃহীত', 'Newest Harvest')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-stone-200 aspect-[4/5] animate-pulse p-4 space-y-3"
              >
                <div className="bg-stone-200 aspect-[4/3] rounded-lg" />
                <div className="h-4 bg-stone-200 rounded w-3/4" />
                <div className="h-3 bg-stone-200 rounded w-1/2" />
                <div className="h-5 bg-stone-200 rounded w-1/3 mt-4" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-stone-200 p-8">
            <Search className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="font-bold text-stone-900 text-base">
              {t('কোনো পণ্য খুঁজে পাওয়া যায়নি', 'No Products Found')}
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {t(
                'আপনার অনুসন্ধানের ফিল্টার পরিবর্তন করুন অথবা সকল পণ্য দেখতে ফিল্টার রিসেট করুন।',
                'Try adjusting your search terms or reset filters.'
              )}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setInStockOnly(false);
                setPriceRange(2000);
              }}
              className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              {t('সব ফিল্টার রিসেট করুন', 'Reset All Filters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenDetails={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. Farm-to-Table Story & Leadership Section */}
      <section id="farm-story-section" className="bg-white border-t border-b border-stone-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <span>{t('কুড়িগ্রাম সদর ও রংপুর বিভাগের মাটির ঐতিহ্য', 'Kurigram Agricultural Heritage')}</span>
                <span aria-hidden="true">·</span>
                <span>{t('খামার পরিচিতি', 'Our Legacy')}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
                {t(
                  'কৃষকের পরিশ্রম ও প্রকৃতির বিশুদ্ধতার মেলবন্ধন: মাই এগ্রো ফার্ম',
                  'Fusing Honest Farming with Natural Purity: MyAgro Farm'
                )}
              </h2>

              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                {t(
                  'উত্তরবঙ্গের তিস্তা ও ধরলা নদীর পলিমাটির সুবাস ও উর্বরতা আমাদের ফসলের অনন্য শক্তি। কাঠের ঘানিতে ভাঙানো খাঁটি সরিষার তেল থেকে শুরু করে সুন্দরবনের খলিসা মধু, গাওয়া দানাদার ঘি এবং সুগন্ধি পোলাও চাল—প্রতিটি পণ্য নিজস্ব তদারকিতে প্রস্তুত হয়। আমরা কোনো মধ্যস্বত্বভোগী রাখি না, ফলে কৃষক পায় ন্যায্যমূল্য আর আপনি পান নির্ভেজাল নিরাপদ খাদ্য।',
                  'From riverine alluvial soils of northern Bangladesh, our mustard oil, raw forest honey, clarified butter, and heirloom aromatic rice are processed naturally without additives or artificial chemicals.'
                )}
              </p>

              {/* Leadership Box */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-stone-900">
                  <Award className="w-4 h-4 text-emerald-800" />
                  <span>প্রতিষ্ঠাতা ও সিইও: মোসাম্মৎ মারুফা খাতুন (মিস মারুফা খাতুন)</span>
                </div>
                <div className="text-stone-600">
                  সিস্টেম অ্যান্ড অপারেশনস অ্যাডমিনিস্ট্রেটর: <strong>ওসমান গনি</strong>
                </div>
                <div className="text-[11px] text-stone-500">
                  প্রধান কার্যালয়: কলেজ মোড়, কুড়িগ্রাম সদর, রংপুর বিভাগ, বাংলাদেশ
                </div>
              </div>
            </div>

            {/* Farm Proof Grid */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <ShieldCheck className="w-6 h-6 text-emerald-800" />
                <h4 className="font-bold text-stone-900 text-sm">১০০% ট্রেসেবল সোর্স</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  প্যাকেটের উপর খামারের নাম, এলাকা ও ফসল তোলার সময় উল্লেখ থাকে।
                </p>
              </div>

              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <Sparkles className="w-6 h-6 text-emerald-800" />
                <h4 className="font-bold text-stone-900 text-sm">ল্যাব টেস্টে নিরাপদ</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  কোনো রাসায়নিক প্রিজারভেটিভ, খনিজ তেল বা কৃত্রিম রঙ নেই।
                </p>
              </div>

              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-800" />
                <h4 className="font-bold text-stone-900 text-sm">ক্যাশ অন ডেলিভারি</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  পণ্য হাতে পাওয়ার পর মূল্য পরিশোধ করার পূর্ণ নিশ্চয়তা।
                </p>
              </div>

              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <MapPin className="w-6 h-6 text-emerald-800" />
                <h4 className="font-bold text-stone-900 text-sm">সারাদেশে ডেলিভারি</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  কুড়িগ্রাম ২৪ ঘ., রংপুর ৪৮ ঘ. এবং দেশের সকল প্রান্তে দ্রুত কুরিয়ার।
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Customer Reviews & Social Proof */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 w-full space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            {t('আস্থার মূল্যায়ন', 'Customer Satisfaction')}
          </span>
          <h2 className="text-2xl font-bold text-stone-900">
            {t('আমাদের বিশ্বস্ত গ্রাহকদের মতামত', 'What Our Customers Say')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-white rounded-2xl border border-stone-200 space-y-3 text-xs shadow-xs">
            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
              ))}
            </div>
            <p className="text-stone-700 leading-relaxed italic">
              "ঘানির সরিষার তেল ও সুন্দরবনের মধু অর্ডার করেছিলাম। তেলের তীব্র ঝাঁজেই বোঝা যায় সম্পূর্ণ খাঁটি। কুড়িগ্রাম থেকে এত দ্রুত ডেলিভারি পেয়ে মুগ্ধ!"
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <div>
                <strong className="text-stone-900 block">আরিফুল ইসলাম</strong>
                <span className="text-stone-400 text-[10px]">উত্তরা, ঢাকা</span>
              </div>
              <span className="text-emerald-800 font-semibold text-[10px]">✓ যাচাইকৃত ক্রেতা</span>
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-stone-200 space-y-3 text-xs shadow-xs">
            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
              ))}
            </div>
            <p className="text-stone-700 leading-relaxed italic">
              "গাওয়া দানাদার ঘি এর ঘ্রাণ একদম খাঁটি মায়ের হাতের তৈরি ঘির মতো। গরম ভাতের সাথে খেলে অসাধারণ তৃপ্তি লাগে। প্যাকেজিংও খুব চমৎকার ছিল।"
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <div>
                <strong className="text-stone-900 block">নাজমুন নাহার</strong>
                <span className="text-stone-400 text-[10px]">রংপুর সদর</span>
              </div>
              <span className="text-emerald-800 font-semibold text-[10px]">✓ যাচাইকৃত ক্রেতা</span>
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-stone-200 space-y-3 text-xs shadow-xs">
            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
              ))}
            </div>
            <p className="text-stone-700 leading-relaxed italic">
              "চিনিগুঁড়া চাল ও হলুদ গুঁড়া নিয়েছি। রান্না করার পর কোনো কৃত্রিম গন্ধ ছিল না। খাঁটি দেশি হলুদ গুঁড়ার রঙ ও তরকারির স্বাদ অসাধারণ হয়েছে।"
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <div>
                <strong className="text-stone-900 block">মো. তানভীর আহমেদ</strong>
                <span className="text-stone-400 text-[10px]">ধানমন্ডি, ঢাকা</span>
              </div>
              <span className="text-emerald-800 font-semibold text-[10px]">✓ যাচাইকৃত ক্রেতা</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <Footer
        onOpenInfo={(t) => setInfoModalType(t)}
        onOpenAdminLogin={() => {
          if (adminUser) {
            setView('admin');
          } else {
            setIsAdminLoginOpen(true);
          }
        }}
      />

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOpenComplaint={(orderNo) => handleOpenComplaintWithOrder(orderNo)}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(order) => setSuccessOrder(order)}
      />

      <OrderSuccessModal
        order={successOrder}
        onClose={() => setSuccessOrder(null)}
        onTrackOrder={(orderNo, phone) => handleOpenTrackingWithDetails(orderNo, phone)}
      />

      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        initialOrderNumber={trackingOrderNo}
        initialPhone={trackingPhone}
        onOpenComplaint={(orderNo) => handleOpenComplaintWithOrder(orderNo)}
      />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <CustomerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onTrackOrder={(orderNo, phone) => handleOpenTrackingWithDetails(orderNo, phone)}
      />

      <ComplaintModal
        isOpen={isComplaintOpen}
        onClose={() => setIsComplaintOpen(false)}
        initialOrderNumber={complaintOrderNo}
      />

      <WishlistModal
        products={products}
        onOpenProductDetails={(p) => setSelectedProduct(p)}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => setView('admin')}
        onOpenFirebaseSetup={() => setIsFirebaseSetupOpen(true)}
      />

      <FirebaseSetupModal
        isOpen={isFirebaseSetupOpen}
        onClose={() => setIsFirebaseSetupOpen(false)}
      />

      <InfoModal type={infoModalType} onClose={() => setInfoModalType(null)} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <StorefrontApp />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
