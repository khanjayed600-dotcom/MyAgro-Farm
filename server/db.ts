/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Product,
  Category,
  User,
  Order,
  Review,
  Complaint,
  Coupon,
  AppNotification,
  AuditLog,
  SiteSettings,
} from '../src/types.ts';

// Filepath for JSON store
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Memory structures
export interface DatabaseSchema {
  users: (User & { passwordHash: string; salt: string })[];
  products: Product[];
  categories: Category[];
  orders: Order[];
  reviews: Review[];
  complaints: Complaint[];
  coupons: Coupon[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  settings: SiteSettings;
}

// Event listeners for SSE real-time notifications
type NotificationListener = (notification: AppNotification) => void;
const notificationListeners: Set<NotificationListener> = new Set();

export function subscribeToNotifications(listener: NotificationListener) {
  notificationListeners.add(listener);
  return () => {
    notificationListeners.delete(listener);
  };
}

export function broadcastNotification(notification: AppNotification) {
  for (const listener of notificationListeners) {
    try {
      listener(notification);
    } catch (e) {
      console.error('Error dispatching notification to listener:', e);
    }
  }
}

// Password hashing utilities using Node.js crypto
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Simple token generator and verification
const ACTIVE_SESSIONS: Map<string, { userId: string; role: string; expiresAt: number }> = new Map();

export function createSessionToken(userId: string, role: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  // 7 days expiration
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  ACTIVE_SESSIONS.set(token, { userId, role, expiresAt });
  return token;
}

export function verifySessionToken(token?: string): { userId: string; role: string } | null {
  if (!token) return null;
  const session = ACTIVE_SESSIONS.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    ACTIVE_SESSIONS.delete(token);
    return null;
  }
  return session;
}

// Default Seed Categories (All 13 categories as requested)
const SEED_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    slug: 'mustard-oil',
    nameBn: 'খাঁটি সরিষার তেল',
    nameEn: 'Pure Mustard Oil',
    descriptionBn: 'ঘানিতে ভাঙানো ১০০% খাঁটি দেশি হলুদ ও মাঘী সরিষার তেল। ঝাঁজালো ও প্রাকৃতিক পুষ্টিসমৃদ্ধ।',
    descriptionEn: 'Cold-pressed traditional expeller pure mustard oil with sharp natural aroma and rich nutrients.',
    iconName: 'Droplet',
    itemCount: 4,
  },
  {
    id: 'cat-2',
    slug: 'turmeric-powder',
    nameBn: 'দেশি হলুদ গুঁড়া',
    nameEn: 'Native Turmeric Powder',
    descriptionBn: 'কুড়িগ্রামের পাহাড়ি ও চরাঞ্চলের খাঁটি দেশি কাঁচা হলুদ শুকিয়ে ভাঙানো। কোনো কৃত্রিম রং নেই।',
    descriptionEn: 'Sun-dried raw native turmeric powder from Kurigram farmlands, with zero artificial dyes.',
    iconName: 'Sparkles',
    itemCount: 3,
  },
  {
    id: 'cat-3',
    slug: 'red-chili-powder',
    nameBn: 'লাল মরিচ গুঁড়া',
    nameEn: 'Red Chili Powder',
    descriptionBn: 'প্রাকৃতিক বোঁটাহীন লাল মরিচ রোদে শুকিয়ে গুঁড়া করা। সঠিক ঝাল ও স্বাভাবিক উজ্জ্বল রং।',
    descriptionEn: 'Stemless sun-dried red chili ground to perfection with authentic heat and natural color.',
    iconName: 'Flame',
    itemCount: 3,
  },
  {
    id: 'cat-4',
    slug: 'coriander-powder',
    nameBn: 'ধনে গুঁড়া',
    nameEn: 'Coriander Powder',
    descriptionBn: 'দেশি ধনে বীজ ভেজে চূর্ণ করা সুবাসিত মসলা। তরকারির অনন্য স্বাদ ও সুবাস বৃদ্ধি করে।',
    descriptionEn: 'Finely ground roasted native coriander seeds for aromatic traditional curries.',
    iconName: 'Sprout',
    itemCount: 2,
  },
  {
    id: 'cat-5',
    slug: 'cumin-powder',
    nameBn: 'জিরা গুঁড়া',
    nameEn: 'Cumin Powder',
    descriptionBn: 'বাছাইকৃত খাঁটি জিরা ধুয়ে শুকিয়ে পরিচ্ছন্নভাবে ভাঙানো বিশেষ মশলা।',
    descriptionEn: 'Hand-sorted premium cumin seeds carefully washed, dried, and freshly milled.',
    iconName: 'Wheat',
    itemCount: 2,
  },
  {
    id: 'cat-6',
    slug: 'native-onion',
    nameBn: 'দেশি পেঁয়াজ',
    nameEn: 'Native Onion',
    descriptionBn: 'রংপুর অঞ্চলের তাজা লাল দেশি পেঁয়াজ। তীব্র ঝাঁজ ও দীর্ঘস্থায়ী সংরক্ষণ উপযোগী।',
    descriptionEn: 'Farm-fresh native pungent red onions from Rangpur division, excellent keeping quality.',
    iconName: 'Apple',
    itemCount: 2,
  },
  {
    id: 'cat-7',
    slug: 'native-garlic',
    nameBn: 'দেশি রসুন',
    nameEn: 'Native Garlic',
    descriptionBn: 'ছোট কোয়ার সুস্বাদু খাঁটি দেশি রসুন। রান্নায় অনন্য সুবাস ও ভেষজ গুণাগুণ।',
    descriptionEn: 'Traditional small-clove native garlic packed with natural allicin and strong flavor.',
    iconName: 'CircleDot',
    itemCount: 2,
  },
  {
    id: 'cat-8',
    slug: 'fresh-ginger',
    nameBn: 'তাজা আদা',
    nameEn: 'Fresh Ginger',
    descriptionBn: 'মাটি থেকে তোলা তাজা পাহাড়ি ও চরাঞ্চলের দেশি আঁশযুক্ত ঝাঁজালো আদা।',
    descriptionEn: 'Freshly harvested pungent ginger root straight from northern silt soils.',
    iconName: 'Layers',
    itemCount: 2,
  },
  {
    id: 'cat-9',
    slug: 'natural-honey',
    nameBn: 'প্রাকৃতিক মধু',
    nameEn: 'Natural Raw Honey',
    descriptionBn: 'সুন্দরবন ও চরাঞ্চলের প্রাকৃতিক ফুলের খাঁটি র-হানি। কোনো চিনি বা রাসায়নিক নেই।',
    descriptionEn: '100% Raw unprocessed multifloral honey from wild hives and trusted local apiaries.',
    iconName: 'Sun',
    itemCount: 4,
  },
  {
    id: 'cat-10',
    slug: 'pure-ghee',
    nameBn: 'খাঁটি ঘি',
    nameEn: 'Pure Cow Ghee',
    descriptionBn: 'দেশি গরুর দুধের সরের মাখন থেকে তৈরি দানাদার সুগন্ধি খাঁটি গাওয়া ঘি।',
    descriptionEn: 'Artisanal golden granulated butter ghee churned from grass-fed indigenous cows.',
    iconName: 'Cookie',
    itemCount: 3,
  },
  {
    id: 'cat-11',
    slug: 'aromatic-rice',
    nameBn: 'সুগন্ধি চাল',
    nameEn: 'Aromatic Farm Rice',
    descriptionBn: 'উত্তরবঙ্গের বিখ্যাত চিনিগুঁড়া, কালোজিরা ও তুলশীমালা সুগন্ধি পোলাও চাল।',
    descriptionEn: 'Aromatic aged Chinigura, Kalijira and Katari native heirloom rice for festive dining.',
    iconName: 'Feather',
    itemCount: 4,
  },
  {
    id: 'cat-12',
    slug: 'fresh-dairy',
    nameBn: 'তাজা দুধ ও দুগ্ধজাত পণ্য',
    nameEn: 'Fresh Dairy & Milk',
    descriptionBn: 'কুড়িগ্রামের স্থানীয় নিজস্ব খামারের খাঁটি তরল দুধ, ছানা ও ক্ষীরসা।',
    descriptionEn: 'Wholesome morning whole milk, fresh farm paneer and traditional cottage dairy.',
    iconName: 'Coffee',
    itemCount: 3,
  },
  {
    id: 'cat-13',
    slug: 'other-farm-food',
    nameBn: 'অন্যান্য খামারভিত্তিক খাদ্যপণ্য',
    nameEn: 'Other Farm-to-Table Food',
    descriptionBn: 'হাতে তৈরি চালের গুঁড়া, কালোজিরা বীজ, মেথি, কালিজিরা তেল ও ভেষজ পণ্য।',
    descriptionEn: 'Milled rice flour, black cumin seeds, organic fenugreek, and seasonal farm treasures.',
    iconName: 'Package',
    itemCount: 3,
  },
];

// Initial Seed Products
const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    nameBn: 'ঘানিতে ভাঙানো খাঁটি সরিষার তেল',
    nameEn: 'Cold-Pressed Wooden Ghani Mustard Oil',
    slug: 'cold-pressed-mustard-oil',
    categorySlug: 'mustard-oil',
    descriptionBn: 'কুড়িগ্রামের স্থানীয় কৃষকদের বাছাইকৃত মাঘী সরিষা থেকে কাঠের ঘানিতে ভাঙানো ১০০% খাঁটি তেল। কোনো প্রিজারভেটিভ বা কেমিক্যাল মুক্ত। ঐতিহ্যবাহী তীব্র ঝাঁজ এবং খাঁটি প্রাকৃতিক ঘ্রাণযুক্ত।',
    descriptionEn: '100% pure expeller mustard oil produced from locally sourced Maghi mustard seeds in Kurigram. Free from chemical bleaching or mineral oil.',
    price: 320,
    discountPrice: 290,
    discountPercent: 9,
    packageSizes: ['500ml', '1 Litre', '2 Litre', '5 Litre'],
    selectedSize: '1 Litre',
    stock: 45,
    unit: 'লিটার',
    images: ['/src/assets/images/product_mustard_oil_1792012102350.jpg'],
    farmOriginBn: 'কুড়িগ্রাম সদর ও নাগেশ্বরী চরাঞ্চল, রংপুর',
    farmOriginEn: 'Kurigram Sadar & Nageshwari Chars, Rangpur',
    harvestDate: 'ফেব্রুয়ারি ২০২৬',
    bestBefore: '১২ মাস',
    certificationsBn: 'BSTI মানসম্মত ল্যাব টেস্ট ও অ্যাসিড ভ্যালু পরীক্ষিত',
    certificationsEn: 'Laboratory tested for acid value & food grade purity',
    deliveryEligibility: 'all_bd',
    rating: 4.9,
    reviewCount: 38,
    featured: true,
    bestSeller: true,
    isOrganicCertified: false,
    isLabTested: true,
    sku: 'MAF-OIL-001',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    nameBn: 'প্রাকৃতিক সুন্দরবনের খলিসা ফুলের মধু',
    nameEn: 'Raw Natural Wildflower Honey',
    slug: 'raw-natural-honey',
    categorySlug: 'natural-honey',
    descriptionBn: 'সম্পূর্ণ কাঁচা ও প্রাকৃতিক উপায়ে সংগৃহীত মধু। কোনো তাপ প্রয়োগ বা কৃত্রিম সুগার সিরাপ মেশানো হয়নি। প্রাকৃতিক এনজাইম, পরাগরেণু ও অ্যান্টিঅক্সিডেন্টে ভরপুর।',
    descriptionEn: 'Unfiltered, unpasteurized 100% raw honey collected from native wild flora. High natural pollen and enzyme integrity.',
    price: 950,
    discountPrice: 850,
    discountPercent: 11,
    packageSizes: ['250g', '500g', '1 Kg'],
    selectedSize: '500g',
    stock: 28,
    unit: 'গ্রাম',
    images: ['/src/assets/images/product_natural_honey_1792012103960.jpg'],
    farmOriginBn: 'খামারি নেটওয়ার্ক ও সুন্দরবন সংলগ্ন বিশ্বস্ত মৌচাষি',
    farmOriginEn: 'Verified Bee-Keepers Network & Natural Hives',
    harvestDate: 'মার্চ ২০২৬',
    bestBefore: '২৪ মাস',
    certificationsBn: 'বিশুদ্ধতা ল্যাব টেস্টে ১০০% সুক্রোজ ও ফ্রুক্টোজ ব্যালান্সড',
    certificationsEn: 'Lab certified zero added sucrose & pure moisture control',
    deliveryEligibility: 'all_bd',
    rating: 4.8,
    reviewCount: 29,
    featured: true,
    bestSeller: true,
    isOrganicCertified: false,
    isLabTested: true,
    sku: 'MAF-HNY-002',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    nameBn: 'খাঁটি গাওয়া দানাদার ঘি',
    nameEn: 'Traditional Farm Granulated Cow Ghee',
    slug: 'pure-farm-cow-ghee',
    categorySlug: 'pure-ghee',
    descriptionBn: 'ঘাসের মাঠে চরে বেড়ানো দেশি গরুর কাঁচা দুধ থেকে তৈরি মাখন জ্বাল দিয়ে তৈরি ঐতিহ্যবাহী সোনালী দানাদার ঘি। মিষ্টি ঘ্রাণ ও অতুলনীয় স্বাদ।',
    descriptionEn: 'Golden granulated clarified butter prepared traditionally from grass-fed native cow milk cream. Rich aroma and authentic texture.',
    price: 1650,
    discountPrice: 1500,
    discountPercent: 9,
    packageSizes: ['250g', '500g', '1 Kg'],
    selectedSize: '500g',
    stock: 19,
    unit: 'গ্রাম',
    images: ['/src/assets/images/product_pure_ghee_1792012104130.jpg'],
    farmOriginBn: 'মারুফা খাতুন ডেইরি ও স্থানীয় খামারি, কুড়িগ্রাম',
    farmOriginEn: 'Marufa Khatun Dairy & Kurigram Farmstead',
    harvestDate: 'এপ্রিল ২০২৬',
    bestBefore: '৮ মাস',
    certificationsBn: 'কোনো ডালডা, সুগন্ধি বা ভেজালমুক্ত গ্যারান্টি',
    certificationsEn: 'Guaranteed 100% cow milk fat with zero artificial butter flavoring',
    deliveryEligibility: 'all_bd',
    rating: 5.0,
    reviewCount: 42,
    featured: true,
    bestSeller: true,
    isOrganicCertified: false,
    isLabTested: true,
    sku: 'MAF-GHE-003',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    nameBn: 'উত্তরবঙ্গের সুগন্ধি চিনিগুঁড়া চাল',
    nameEn: 'Premium Northern Aromatic Chinigura Rice',
    slug: 'aromatic-chinigura-rice',
    categorySlug: 'aromatic-rice',
    descriptionBn: 'উত্তরবঙ্গের উর্বর পলিমাটির সুগন্ধি ধান থেকে তৈরি পোলাও, বিরিয়ানি ও ক্ষীরের জন্য সেরা ছোট দানার চিনিগুঁড়া চাল। বয়স্ক চাল হওয়ায় রান্নায় সুন্দর ফোটে।',
    descriptionEn: 'Naturally aged small grain aromatic Chinigura rice harvested in northern riverine silt basins, ideal for biryani and polao.',
    price: 150,
    discountPrice: 135,
    discountPercent: 10,
    packageSizes: ['1 Kg', '2 Kg', '5 Kg', '10 Kg'],
    selectedSize: '2 Kg',
    stock: 80,
    unit: 'কেজি',
    images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80'],
    farmOriginBn: 'চিলমারী ও উলিপুর ধানের খামার, কুড়িগ্রাম',
    farmOriginEn: 'Chilmari & Ulipur Paddy Fields, Kurigram',
    harvestDate: 'আমন মৌসুম ২০২৫-২৬',
    bestBefore: '১২ মাস',
    certificationsBn: 'কোনো প্লাস্টিক পলিশ বা কেমিক্যাল রাইস প্রসেসিং নেই',
    certificationsEn: 'Unpolished traditional mill processing with zero artificial scenting',
    deliveryEligibility: 'all_bd',
    rating: 4.7,
    reviewCount: 22,
    featured: true,
    bestSeller: false,
    isOrganicCertified: false,
    isLabTested: true,
    sku: 'MAF-RCE-004',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    nameBn: 'খাঁটি দেশি কাঁচা হলুদ গুঁড়া',
    nameEn: 'Pure Native Sun-Dried Turmeric Powder',
    slug: 'pure-native-turmeric-powder',
    categorySlug: 'turmeric-powder',
    descriptionBn: 'কুড়িগ্রামের চরাঞ্চলের নিজস্ব কৃষকদের থেকে সংগৃহীত দেশি হলুদ। রোদে শুকিয়ে পরিচ্ছন্নভাবে ভাঙানো। উচ্চ কারকিউমিন সমৃদ্ধ ও খাঁটি রঙের নিশ্চয়তা।',
    descriptionEn: 'High-curcumin native dried turmeric root ground hygienically without lead chromate or synthetic yellow powder.',
    price: 360,
    discountPrice: 320,
    discountPercent: 11,
    packageSizes: ['250g', '500g', '1 Kg'],
    selectedSize: '500g',
    stock: 65,
    unit: 'গ্রাম',
    images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80'],
    farmOriginBn: 'কুড়িগ্রাম চর ও তিস্তা অববাহিকা',
    farmOriginEn: 'Kurigram Chars & Teesta Basin',
    harvestDate: 'জানুয়ারি ২০২৬',
    bestBefore: '১৮ মাস',
    certificationsBn: 'কৃত্রিম রঙ মুক্ত ও ১০০% পিউর ফুড গ্রেড',
    certificationsEn: 'Chemical test certified free from artificial colorants',
    deliveryEligibility: 'all_bd',
    rating: 4.9,
    reviewCount: 17,
    featured: false,
    bestSeller: true,
    isOrganicCertified: false,
    isLabTested: true,
    sku: 'MAF-TRM-005',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    nameBn: 'বোঁটাহীন শুকনো লাল মরিচ গুঁড়া',
    nameEn: 'Stemless Pure Red Chili Powder',
    slug: 'pure-red-chili-powder',
    categorySlug: 'red-chili-powder',
    descriptionBn: 'হাত দিয়ে প্রতিটি মরিচের বোঁটা ছাড়িয়ে ধুলোবালিমুক্ত করে গুঁড়ো করা হয়েছে। রান্নায় স্বাস্থ্যকর ঝাল ও অপূর্ব লালচে আভা এনে দেয়। ইট-গুঁড়া বা কাপড়ের রঙ সম্পূর্ণ নিষিদ্ধ।',
    descriptionEn: 'Clean stemless sun-dried spicy red chilies milled without foreign matter or harmful pigments.',
    price: 420,
    discountPrice: 380,
    discountPercent: 10,
    packageSizes: ['250g', '500g', '1 Kg'],
    selectedSize: '500g',
    stock: 52,
    unit: 'গ্রাম',
    images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80'],
    farmOriginBn: 'রংপুর ও তিস্তা নদীর পলিচর এলাকা',
    farmOriginEn: 'Rangpur & Teesta River Alluvial Plains',
    harvestDate: 'ফেব্রুয়ারি ২০২৬',
    bestBefore: '১২ মাস',
    certificationsBn: 'কোনো রাসায়নিক ঝাঁজ বা কৃত্রিম রং নেই',
    certificationsEn: '100% natural chili capsaicin & natural color verified',
    deliveryEligibility: 'all_bd',
    rating: 4.8,
    reviewCount: 14,
    featured: false,
    bestSeller: false,
    isOrganicCertified: false,
    isLabTested: true,
    sku: 'MAF-CHL-006',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    nameBn: 'তাজা দেশি ছোট রসুন',
    nameEn: 'Fresh Native Small-Clove Garlic',
    slug: 'fresh-native-garlic',
    categorySlug: 'native-garlic',
    descriptionBn: 'দেশি ছোট কোয়া বিশিষ্ট রসুন যা রান্নায় এনে দেয় অপূর্ব তীব্র স্বাদ ও ঝাঁজ। প্রাকৃতিকভাবে শুকানো যা দীর্ঘ সময় ঘরে ভালো থাকে।',
    descriptionEn: 'Native small-clove garlic directly sourced after soil harvest and curing, rich in herbal allicin.',
    price: 210,
    discountPrice: 190,
    discountPercent: 10,
    packageSizes: ['1 Kg', '2 Kg', '5 Kg'],
    selectedSize: '1 Kg',
    stock: 75,
    unit: 'কেজি',
    images: ['https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=800&q=80'],
    farmOriginBn: 'কুড়িগ্রাম সদর কৃষক সমিতি',
    farmOriginEn: 'Kurigram Sadar Farmer Cooperative',
    harvestDate: 'মার্চ ২০২৬',
    bestBefore: '২ মাস',
    certificationsBn: 'কোনো রাসায়নিক স্প্রে ছাড়াই স্বাভাবিক বাতাস ও রোদে শুকানো',
    certificationsEn: 'Natural shade dried with zero preservative dip',
    deliveryEligibility: 'all_bd',
    rating: 4.7,
    reviewCount: 9,
    featured: false,
    bestSeller: false,
    isOrganicCertified: false,
    isLabTested: false,
    sku: 'MAF-GRL-007',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-8',
    nameBn: 'খামার তাজা খাঁটি তরল দুধ',
    nameEn: 'Farm-Fresh Raw Cow Milk',
    slug: 'farm-fresh-cow-milk',
    categorySlug: 'fresh-dairy',
    descriptionBn: 'প্রতিদিন সকালের সুস্থ দেশি ও শাহিওয়াল গরুর খাঁটি দুধ। কোনো পানি মেশানো হয় না। নিরাপদ স্বাস্থ্যকর বোতলজাত। (শুধুমাত্র কুড়িগ্রাম ও রংপুর সদর এলাকার জন্য দ্রুত ডেলিভারি)',
    descriptionEn: 'Raw pure cow milk chilled right after morning milking. No added water or thickeners.',
    price: 90,
    discountPrice: 85,
    discountPercent: 6,
    packageSizes: ['1 Litre', '2 Litre', '5 Litre'],
    selectedSize: '1 Litre',
    stock: 30,
    unit: 'লিটার',
    images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80'],
    farmOriginBn: 'মারুফা খাতুন এগ্রো ডেইরি খামার, কুড়িগ্রাম',
    farmOriginEn: 'Marufa Khatun Agro Dairy, Kurigram',
    harvestDate: 'প্রতিদিন সকাল',
    bestBefore: '৪৮ ঘণ্টা (রেফ্রিজারেটেড)',
    certificationsBn: 'ল্যাকটোমিটার টেস্ট ও ফ্যাট ৪.২% নিশ্চিত',
    certificationsEn: '4.2% milk fat & zero adulteration verified',
    deliveryEligibility: 'kurigram_rangpur_only',
    rating: 5.0,
    reviewCount: 31,
    featured: true,
    bestSeller: true,
    isOrganicCertified: false,
    isLabTested: true,
    sku: 'MAF-MLK-008',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-9',
    nameBn: 'খাঁটি কালোজিরা তেল (কোল্ড প্রেস)',
    nameEn: 'Cold-Pressed Pure Black Cumin Seed Oil',
    slug: 'pure-black-seed-oil',
    categorySlug: 'other-farm-food',
    descriptionBn: 'অর্গানিক কালোজিরা থেকে সরাসরি কোল্ড প্রেস পদ্ধতিতে তৈরি নিরেট কালোজিরার তেল। নানা রোগ প্রতিরোধ ও রোগমুক্তি উপাদানে সমৃদ্ধ।',
    descriptionEn: 'Cold-pressed Nigella Sativa oil from select virgin seeds, unrefined and antioxidant rich.',
    price: 450,
    discountPrice: 400,
    discountPercent: 11,
    packageSizes: ['100ml', '250ml'],
    selectedSize: '100ml',
    stock: 22,
    unit: 'মিলি',
    images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80'],
    farmOriginBn: 'রংপুর বিভাগের কৃষি অঞ্চল',
    farmOriginEn: 'Rangpur Agricultural Zone',
    harvestDate: 'ফেব্রুয়ারি ২০২৬',
    bestBefore: '২৪ মাস',
    certificationsBn: '১০০% পিউরিটি ল্যাব ভেরিফায়েড',
    certificationsEn: 'Pure virgin cold-pressed extraction verified',
    deliveryEligibility: 'all_bd',
    rating: 4.9,
    reviewCount: 19,
    featured: true,
    bestSeller: false,
    isOrganicCertified: false,
    isLabTested: true,
    sku: 'MAF-BLK-009',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-10',
    nameBn: 'হাতে ভাজা খাঁটি জিরা গুঁড়া',
    nameEn: 'Roasted Native Cumin Powder',
    slug: 'roasted-cumin-powder',
    categorySlug: 'cumin-powder',
    descriptionBn: 'ধোয়া ও বাছাই করা জিরা মৃদু আঁচে টেলে তারপর চূর্ণ করা। মাংস, ডাল ও বিভিন্ন রান্নায় চমৎকার ভাজা জিরার ঘ্রাণ পাওয়া যায়।',
    descriptionEn: 'Slow roasted whole cumin seeds milled into fragrant brown powder, enhancing authentic tastes.',
    price: 480,
    discountPrice: 440,
    discountPercent: 8,
    packageSizes: ['200g', '500g'],
    selectedSize: '200g',
    stock: 35,
    unit: 'গ্রাম',
    images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80'],
    farmOriginBn: 'কুড়িগ্রাম মসলা প্রসেসিং কেন্দ্র',
    farmOriginEn: 'Kurigram Spice Hub',
    harvestDate: 'মার্চ ২০২৬',
    bestBefore: '১২ মাস',
    certificationsBn: 'কোনো ধুলাবালি বা কাঠের গুঁড়া নেই',
    certificationsEn: '100% whole cumin ground without fillers',
    deliveryEligibility: 'all_bd',
    rating: 4.8,
    reviewCount: 11,
    featured: false,
    bestSeller: false,
    isOrganicCertified: false,
    isLabTested: true,
    sku: 'MAF-CMN-010',
    createdAt: new Date().toISOString(),
  },
];

// Initial Site Settings
const SEED_SETTINGS: SiteSettings = {
  brandNameBn: 'মাই এগ্রো ফার্ম',
  brandNameEn: 'MyAgro Farm',
  taglineBn: 'খামার থেকে খাঁটি খাবার সরাসরি আপনার টেবিলে',
  taglineEn: 'Direct Farm-to-Table Fresh & Authentic Food',
  founderName: 'মোসাম্মৎ মারুফা খাতুন (মিস মারুফা খাতুন)',
  founderTitle: 'প্রতিষ্ঠাতা ও সিইও (Founder & CEO)',
  systemAdminName: 'ওসমান গনি',
  headOfficeAddress: 'কুড়িগ্রাম সদর, রংপুর বিভাগ, বাংলাদেশ',
  contactPhone: '+880 1712-345678',
  contactEmail: 'contact@myagrofarm.com',
  emergencyHotline: '16247',
  freeDeliveryThreshold: 2000,
  deliveryFees: {
    kurigramSadar: 50,
    rangpurDivision: 80,
    nationwide: 120,
  },
  paymentGateways: {
    bkashActive: true,
    bkashMerchantNumber: '01811-MYAGRO',
    nagadActive: true,
    nagadMerchantNumber: '01711-MYAGRO',
    bankActive: true,
    bankAccountName: 'MyAgro Farm Enterprise',
    bankAccountNumber: '205021302001234',
    bankName: 'Agrani Bank PLC',
    bankBranch: 'Kurigram Main Branch',
    isTestMode: true,
  },
};

// Initial coupons
const SEED_COUPONS: Coupon[] = [
  {
    id: 'coup-1',
    code: 'AGRO10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 500,
    maxDiscount: 200,
    expiryDate: '2026-12-31',
    usageLimit: 500,
    usedCount: 34,
    isActive: true,
  },
  {
    id: 'coup-2',
    code: 'EIDFRESH',
    discountType: 'flat',
    discountValue: 100,
    minOrderValue: 1000,
    expiryDate: '2026-12-31',
    usageLimit: 300,
    usedCount: 18,
    isActive: true,
  },
  {
    id: 'coup-3',
    code: 'KURIGRAM50',
    discountType: 'flat',
    discountValue: 50,
    minOrderValue: 400,
    expiryDate: '2026-12-31',
    usageLimit: 1000,
    usedCount: 76,
    isActive: true,
  },
];

// In-memory Database Instance
class Database {
  private data: DatabaseSchema;
  private isSaving = false;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        // Ensure all arrays are initialized
        return {
          users: parsed.users || [],
          products: parsed.products?.length ? parsed.products : SEED_PRODUCTS,
          categories: parsed.categories?.length ? parsed.categories : SEED_CATEGORIES,
          orders: parsed.orders || [],
          reviews: parsed.reviews || [],
          complaints: parsed.complaints || [],
          coupons: parsed.coupons || SEED_COUPONS,
          notifications: parsed.notifications || [],
          auditLogs: parsed.auditLogs || [],
          settings: parsed.settings || SEED_SETTINGS,
        };
      }
    } catch (err) {
      console.warn('Could not read existing db.json, creating new database instance:', err);
    }

    // Default Fresh Seed
    const initialDb: DatabaseSchema = {
      users: [],
      products: SEED_PRODUCTS,
      categories: SEED_CATEGORIES,
      orders: [],
      reviews: [
        {
          id: 'rev-1',
          productId: 'prod-1',
          userName: 'আরিফুল ইসলাম',
          rating: 5,
          commentBn: 'অসাধারণ সরিষার তেল! ঝাঁজ আর ঘ্রাণ একদম আগের দিনের ঘানির তেলের মতো। কোনো ভেজাল নেই।',
          verifiedPurchase: true,
          sentiment: 'positive',
          status: 'approved',
          adminReply: 'ধন্যবাদ আরিফুল ভাই, আপনাদের সন্তুষ্টিই আমাদের প্রধান লক্ষ্য।',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: 'rev-2',
          productId: 'prod-3',
          userName: 'নাজমুন নাহার',
          rating: 5,
          commentBn: 'দানাদার খাঁটি গাওয়া ঘি। গরম ভাতে সামান্য ঘি দিলেই পুরো ঘর ঘ্রাণে ভরে যায়। খুব ভালো প্যাকেজিং।',
          verifiedPurchase: true,
          sentiment: 'positive',
          status: 'approved',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
      ],
      complaints: [
        {
          id: 'comp-1',
          orderNumber: 'MAF-20261010-1002',
          customerName: 'মো. রফিকুল হাসান',
          customerPhone: '01719876543',
          issueType: 'delivery_delay',
          description: 'ডেলিভারি হতে ১ দিন বেশি সময় লেগেছিল। তবে পণ্যের কোয়ালিটি অত্যন্ত চমৎকার।',
          status: 'resolved',
          resolutionNotes: 'কুরিয়ার জ্যামের জন্য বিলম্ব হয়েছিল। গ্রাহককে ফোন করে বিস্তারিত জানানো হয়েছে।',
          refundRequested: false,
          createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        },
      ],
      coupons: SEED_COUPONS,
      notifications: [
        {
          id: 'notif-1',
          type: 'system',
          titleBn: 'মাই এগ্রো ফার্ম সিস্টেমে স্বাগতম',
          titleEn: 'Welcome to MyAgro Farm Platform',
          messageBn: 'কুড়িগ্রাম ও রংপুর সদর থেকে সারা বাংলাদেশে খাঁটি খাদ্যপণ্য ডেলিভারি প্ল্যাটফর্ম সক্রিয় হয়েছে।',
          messageEn: 'Direct farm-to-table delivery portal is live and ready.',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
      auditLogs: [
        {
          id: 'log-1',
          timestamp: new Date().toISOString(),
          adminName: 'ওসমান গনি (System Admin)',
          action: 'সিস্টেম ইনিশিয়ালাইজেশন',
          details: 'ডাটাবেস ও স্টোর ক্যাটালগ সফলভাবে কনফিগার করা হয়েছে।',
        },
      ],
      settings: SEED_SETTINGS,
    };

    // Seed Admin Users
    // 1. Osman Goni (System Admin)
    const adminAuth = hashPassword('AdminAgro2026!');
    initialDb.users.push({
      id: 'user-admin-osman',
      name: 'ওসমান গনি',
      email: 'admin@myagrofarm.com',
      phone: '01712000001',
      role: 'superadmin',
      addresses: [
        {
          id: 'addr-1',
          label: 'অফিস',
          recipientName: 'ওসমান গনি',
          phone: '01712000001',
          district: 'কুড়িগ্রাম',
          thana: 'কুড়িগ্রাম সদর',
          streetAddress: 'প্রধান কার্যালয়, কলেজ মোড়, কুড়িগ্রাম সদর',
          isDefault: true,
        },
      ],
      createdAt: new Date().toISOString(),
      passwordHash: adminAuth.hash,
      salt: adminAuth.salt,
    });

    // 2. Mosammat Marufa Khatun (Founder & CEO)
    const ceoAuth = hashPassword('MarufaCEO2026!');
    initialDb.users.push({
      id: 'user-ceo-marufa',
      name: 'মোসাম্মৎ মারুফা খাতুন',
      email: 'ceo@myagrofarm.com',
      phone: '01712000002',
      role: 'superadmin',
      addresses: [
        {
          id: 'addr-2',
          label: 'অফিস',
          recipientName: 'মোসাম্মৎ মারুফা খাতুন',
          phone: '01712000002',
          district: 'কুড়িগ্রাম',
          thana: 'কুড়িগ্রাম সদর',
          streetAddress: 'হেড অফিস, মাই এগ্রো ফার্ম, কুড়িগ্রাম',
          isDefault: true,
        },
      ],
      createdAt: new Date().toISOString(),
      passwordHash: ceoAuth.hash,
      salt: ceoAuth.salt,
    });

    // 3. Demo Verified Customer
    const customerAuth = hashPassword('Customer123!');
    initialDb.users.push({
      id: 'user-demo-customer',
      name: 'তানভীর আহমেদ',
      email: 'customer@gmail.com',
      phone: '01711223344',
      role: 'customer',
      addresses: [
        {
          id: 'addr-3',
          label: 'বাড়ি',
          recipientName: 'তানভীর আহমেদ',
          phone: '01711223344',
          district: 'রংপুর',
          thana: 'রংপুর সদর',
          streetAddress: 'বাড়ি ১২, রোড ৪, আর কে রোড, রংপুর',
          isDefault: true,
        },
      ],
      createdAt: new Date().toISOString(),
      passwordHash: customerAuth.hash,
      salt: customerAuth.salt,
    });

    this.saveDataAsync(initialDb);
    return initialDb;
  }

  private saveDataAsync(dataToSave: DatabaseSchema) {
    if (this.isSaving) return;
    this.isSaving = true;
    setTimeout(() => {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
      } catch (err) {
        console.error('Failed to persist database to file:', err);
      } finally {
        this.isSaving = false;
      }
    }, 50);
  }

  private persist() {
    this.saveDataAsync(this.data);
  }

  // --- Users ---
  getUsers() {
    return this.data.users;
  }

  getUserById(id: string) {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserByPhone(phone: string) {
    return this.data.users.find((u) => u.phone === phone);
  }

  addUser(user: User, passwordRaw: string) {
    const { hash, salt } = hashPassword(passwordRaw);
    const storedUser = { ...user, passwordHash: hash, salt };
    this.data.users.push(storedUser);
    this.persist();

    // Trigger Notification for Admin
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: 'user',
      titleBn: 'নতুন গ্রাহক নিবন্ধন',
      titleEn: 'New Customer Registered',
      messageBn: `${user.name} (${user.phone}) অ্যাকাউন্ট তৈরি করেছেন।`,
      messageEn: `${user.name} created a new customer account.`,
      link: '/admin/customers',
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.addNotification(notif);

    return user;
  }

  updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.persist();
      return this.data.users[idx];
    }
    return null;
  }

  // --- Products ---
  getProducts() {
    return this.data.products;
  }

  getProductById(id: string) {
    return this.data.products.find((p) => p.id === id);
  }

  addProduct(product: Product, adminName: string) {
    this.data.products.unshift(product);
    this.addAuditLog(adminName, 'নতুন পণ্য যোগ', `${product.nameBn} (${product.nameEn}) যুক্ত করা হয়েছে।`);
    this.persist();
    return product;
  }

  updateProduct(id: string, updates: Partial<Product>, adminName: string) {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.data.products[idx] = { ...this.data.products[idx], ...updates };
      this.addAuditLog(adminName, 'পণ্য আপডেট', `${this.data.products[idx].nameBn} তথ্য আপডেট করা হয়েছে।`);
      this.persist();
      return this.data.products[idx];
    }
    return null;
  }

  deleteProduct(id: string, adminName: string) {
    const product = this.getProductById(id);
    if (product) {
      this.data.products = this.data.products.filter((p) => p.id !== id);
      this.addAuditLog(adminName, 'পণ্য মুছে ফেলা', `${product.nameBn} তালিকা থেকে অপসারণ করা হয়েছে।`);
      this.persist();
      return true;
    }
    return false;
  }

  // --- Categories ---
  getCategories() {
    return this.data.categories;
  }

  addCategory(category: Category, adminName: string) {
    this.data.categories.push(category);
    this.addAuditLog(adminName, 'নতুন ক্যাটাগরি তৈরি', `${category.nameBn} তৈরি করা হয়েছে।`);
    this.persist();
    return category;
  }

  updateCategory(id: string, updates: Partial<Category>, adminName: string) {
    const idx = this.data.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      this.data.categories[idx] = { ...this.data.categories[idx], ...updates };
      this.addAuditLog(adminName, 'ক্যাটাগরি আপডেট', `${this.data.categories[idx].nameBn} পরিমার্জন করা হয়েছে।`);
      this.persist();
      return this.data.categories[idx];
    }
    return null;
  }

  // --- Orders & Stock Transactions ---
  getOrders() {
    return this.data.orders;
  }

  getOrderById(id: string) {
    return this.data.orders.find((o) => o.id === id || o.orderNumber === id);
  }

  getOrdersByUserId(userId: string) {
    return this.data.orders.filter((o) => o.userId === userId);
  }

  getOrderByTracking(orderNumber: string, phone: string) {
    return this.data.orders.find(
      (o) =>
        o.orderNumber.trim().toUpperCase() === orderNumber.trim().toUpperCase() &&
        o.customerPhone.replace(/\D/g, '') === phone.replace(/\D/g, '')
    );
  }

  createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'timeline'>): {
    order?: Order;
    error?: string;
  } {
    // 1. Stock Validation & Decrementation in Atomic Block
    for (const item of orderData.items) {
      const prod = this.getProductById(item.productId);
      if (!prod) {
        return { error: `পণ্য পাওয়া যায়নি: ${item.nameBn}` };
      }
      if (prod.stock < item.quantity) {
        return { error: `দুঃখিত, ${prod.nameBn} এর পর্যাপ্ত স্টক নেই (মজুদ আছে: ${prod.stock})` };
      }
    }

    // Decrement stock safely
    for (const item of orderData.items) {
      const prod = this.getProductById(item.productId);
      if (prod) {
        prod.stock -= item.quantity;
        // Check for low stock alert
        if (prod.stock <= 5) {
          const lowStockNotif: AppNotification = {
            id: `notif-stock-${Date.now()}-${prod.id}`,
            type: 'stock',
            titleBn: 'সতর্কতা: পণ্য স্টক কমে গেছে',
            titleEn: 'Low Stock Warning',
            messageBn: `${prod.nameBn} এর স্টক অবশিষ্ট মাত্র ${prod.stock} টি। দ্রুত রিস্টক করুন।`,
            messageEn: `${prod.nameEn} stock is down to ${prod.stock}. Restock required.`,
            link: '/admin/inventory',
            read: false,
            createdAt: new Date().toISOString(),
          };
          this.addNotification(lowStockNotif);
        }
      }
    }

    // Generate Unique Order Number: MAF-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `MAF-${dateStr}-${randomSuffix}`;
    const orderId = `ord-${Date.now()}-${randomSuffix}`;

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      orderNumber,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          status: 'Pending',
          timestamp: new Date().toISOString(),
          noteBn: 'অর্ডারটি সফলভাবে জমা হয়েছে। আমাদের প্রতিনিধি দ্রুত যোগাযোগ করবেন।',
          noteEn: 'Order placed successfully. Our farm logistics team will process it.',
        },
      ],
    };

    this.data.orders.unshift(newOrder);

    // Track coupon usage if any
    if (orderData.couponCode) {
      const coupon = this.data.coupons.find((c) => c.code.toUpperCase() === orderData.couponCode?.toUpperCase());
      if (coupon) {
        coupon.usedCount += 1;
      }
    }

    this.persist();

    // Broadcast Real-time Notification
    const orderNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: 'order',
      titleBn: 'নতুন অর্ডার এসেছে!',
      titleEn: 'New Order Received',
      messageBn: `অর্ডার নম্বর: ${orderNumber} - মোট ৳${orderData.total} (${orderData.customerName})`,
      messageEn: `Order #${orderNumber} for ৳${orderData.total} from ${orderData.customerName}`,
      link: `/admin/orders?id=${orderId}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.addNotification(orderNotif);

    return { order: newOrder };
  }

  updateOrderStatus(
    orderId: string,
    status: Order['status'],
    adminName: string,
    notes?: { internal?: string; courier?: string; trackingId?: string; timelineNoteBn?: string }
  ) {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    order.status = status;
    order.updatedAt = new Date().toISOString();

    if (notes?.internal !== undefined) order.adminNotes = notes.internal;
    if (notes?.courier !== undefined) order.courierName = notes.courier;
    if (notes?.trackingId !== undefined) order.courierTrackingId = notes.trackingId;

    // Append to timeline
    const defaultNotes: Record<Order['status'], { bn: string; en: string }> = {
      Pending: { bn: 'অর্ডার পেন্ডিং অবস্থায় রয়েছে।', en: 'Order is pending review.' },
      Confirmed: { bn: 'অর্ডার নিশ্চিত করা হয়েছে এবং পণ্য সংগ্রহের জন্য পাঠানো হয়েছে।', en: 'Order confirmed and ready for packaging.' },
      Processing: { bn: 'খামার থেকে খাঁটি পণ্য প্রস্তুত ও প্রক্রিয়াজাত করা হচ্ছে।', en: 'Farm goods are being packed.' },
      Packed: { bn: 'অর্ডারটি সঠিকভাবে প্যাকেজিং সম্পন্ন হয়েছে।', en: 'Packaging completed.' },
      Shipped: { bn: `কুরিয়ারে হস্তান্তর করা হয়েছে${order.courierName ? ` (${order.courierName})` : ''}।`, en: 'Handed over to courier.' },
      'Out for Delivery': { bn: 'ডেলিভারি রাইডার আপনার গন্তব্যে রওনা দিয়েছে।', en: 'Rider is out for delivery.' },
      Delivered: { bn: 'পণ্যটি সফলভাবে গ্রাহকের কাছে পৌঁছে দেওয়া হয়েছে।', en: 'Delivered successfully.' },
      Cancelled: { bn: 'অর্ডারটি বাতিল করা হয়েছে।', en: 'Order has been cancelled.' },
      'Return Requested': { bn: 'গ্রাহকের পক্ষ থেকে রিটার্ন আবেদন জমা হয়েছে।', en: 'Return request submitted.' },
      Refunded: { bn: 'গ্রাহককে সফলভাবে মূল্য রিফান্ড করা হয়েছে।', en: 'Amount refunded to customer.' },
    };

    order.timeline.push({
      status,
      timestamp: new Date().toISOString(),
      noteBn: notes?.timelineNoteBn || defaultNotes[status].bn,
      noteEn: defaultNotes[status].en,
    });

    // If order was cancelled, restock products
    if (status === 'Cancelled') {
      for (const item of order.items) {
        const prod = this.getProductById(item.productId);
        if (prod) {
          prod.stock += item.quantity;
        }
      }
    }

    this.addAuditLog(adminName, `অর্ডার স্ট্যাটাস পরিবর্তন: ${order.orderNumber}`, `স্ট্যাটাস: ${status}`);
    this.persist();
    return order;
  }

  // --- Reviews ---
  getReviews(productId?: string) {
    if (productId) {
      return this.data.reviews.filter((r) => r.productId === productId && r.status === 'approved');
    }
    return this.data.reviews;
  }

  addReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'status' | 'sentiment'>): Review {
    const sentiment: Review['sentiment'] =
      reviewData.rating >= 4 ? 'positive' : reviewData.rating === 3 ? 'neutral' : 'negative';

    const newReview: Review = {
      ...reviewData,
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sentiment,
      status: 'approved', // Auto-approve or moderate
      createdAt: new Date().toISOString(),
    };

    this.data.reviews.unshift(newReview);

    // Update product average rating
    const prodReviews = this.data.reviews.filter((r) => r.productId === reviewData.productId && r.status === 'approved');
    const totalRating = prodReviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = Number((totalRating / prodReviews.length).toFixed(1));
    const prod = this.getProductById(reviewData.productId);
    if (prod) {
      prod.rating = avg;
      prod.reviewCount = prodReviews.length;
    }

    this.persist();

    // Notify Admin of new review
    const notif: AppNotification = {
      id: `notif-rev-${Date.now()}`,
      type: 'review',
      titleBn: 'নতুন পণ্য রিভিউ',
      titleEn: 'New Product Review',
      messageBn: `${reviewData.userName} ${prod?.nameBn || 'পণ্য'}-এ ${reviewData.rating} স্টার রিভিউ দিয়েছেন।`,
      messageEn: `${reviewData.userName} rated ${prod?.nameEn || 'product'} with ${reviewData.rating} stars.`,
      link: '/admin/reviews',
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.addNotification(notif);

    return newReview;
  }

  updateReviewStatus(id: string, status: Review['status'], adminReply?: string) {
    const rev = this.data.reviews.find((r) => r.id === id);
    if (rev) {
      rev.status = status;
      if (adminReply !== undefined) rev.adminReply = adminReply;
      this.persist();
      return rev;
    }
    return null;
  }

  // --- Complaints & Refunds ---
  getComplaints() {
    return this.data.complaints;
  }

  addComplaint(data: Omit<Complaint, 'id' | 'createdAt' | 'status'>): Complaint {
    const complaint: Complaint = {
      ...data,
      id: `comp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'under_review',
      createdAt: new Date().toISOString(),
    };
    this.data.complaints.unshift(complaint);
    this.persist();

    // Real-time alert to admin
    const notif: AppNotification = {
      id: `notif-comp-${Date.now()}`,
      type: 'complaint',
      titleBn: 'নতুন অভিযোগ / রিফান্ড আবেদন',
      titleEn: 'New Customer Complaint',
      messageBn: `অর্ডার ${data.orderNumber} - গ্রাহক: ${data.customerName} (${data.customerPhone})`,
      messageEn: `Order #${data.orderNumber} complaint registered by ${data.customerName}`,
      link: '/admin/complaints',
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.addNotification(notif);

    return complaint;
  }

  updateComplaintStatus(id: string, status: Complaint['status'], resolutionNotes?: string, adminName?: string) {
    const comp = this.data.complaints.find((c) => c.id === id);
    if (comp) {
      comp.status = status;
      if (resolutionNotes) comp.resolutionNotes = resolutionNotes;
      if (adminName) {
        this.addAuditLog(adminName, `অভিযোগ মীমাংসা: ${comp.orderNumber}`, `স্ট্যাটাস: ${status}. নোট: ${resolutionNotes || 'N/A'}`);
      }
      this.persist();
      return comp;
    }
    return null;
  }

  // --- Coupons ---
  getCoupons() {
    return this.data.coupons;
  }

  validateCoupon(code: string, cartTotal: number): { coupon?: Coupon; error?: string } {
    const found = this.data.coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
    if (!found) {
      return { error: 'কুপন কোডটি সঠিক নয়।' };
    }
    if (!found.isActive) {
      return { error: 'এই কুপনটি বর্তমানে সক্রিয় নয়।' };
    }
    if (new Date(found.expiryDate) < new Date()) {
      return { error: 'কুপনটির মেয়াদ শেষ হয়ে গেছে।' };
    }
    if (found.usedCount >= found.usageLimit) {
      return { error: 'কুপনটি ব্যবহারের সর্বোচ্চ সীমা পূর্ণ হয়েছে।' };
    }
    if (cartTotal < found.minOrderValue) {
      return { error: `এই কুপনটি ব্যবহারের জন্য সর্বনিম্ন ৳${found.minOrderValue} টাকার অর্ডার প্রয়োজন।` };
    }
    return { coupon: found };
  }

  addCoupon(coupon: Coupon, adminName: string) {
    this.data.coupons.push(coupon);
    this.addAuditLog(adminName, 'কুপন তৈরি', `কোড: ${coupon.code}, ছাড়: ${coupon.discountValue}${coupon.discountType === 'percentage' ? '%' : ' BDT'}`);
    this.persist();
    return coupon;
  }

  deleteCoupon(id: string, adminName: string) {
    const coupon = this.data.coupons.find((c) => c.id === id);
    if (coupon) {
      this.data.coupons = this.data.coupons.filter((c) => c.id !== id);
      this.addAuditLog(adminName, 'কুপন ডিলিট', `কোড: ${coupon.code}`);
      this.persist();
      return true;
    }
    return false;
  }

  // --- Notifications ---
  getNotifications() {
    return this.data.notifications;
  }

  addNotification(notif: AppNotification) {
    this.data.notifications.unshift(notif);
    // Keep max 100 notifications
    if (this.data.notifications.length > 100) {
      this.data.notifications = this.data.notifications.slice(0, 100);
    }
    this.persist();
    broadcastNotification(notif);
  }

  markNotificationAsRead(id: string) {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.persist();
      return true;
    }
    return false;
  }

  markAllNotificationsAsRead() {
    for (const n of this.data.notifications) {
      n.read = true;
    }
    this.persist();
    return true;
  }

  // --- Audit Logs ---
  getAuditLogs() {
    return this.data.auditLogs;
  }

  addAuditLog(adminName: string, action: string, details: string) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      adminName,
      action,
      details,
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 200);
    }
    this.persist();
  }

  // --- Site Settings ---
  getSettings() {
    return this.data.settings;
  }

  updateSettings(updates: Partial<SiteSettings>, adminName: string) {
    this.data.settings = { ...this.data.settings, ...updates };
    this.addAuditLog(adminName, 'সাইট সেটিংস আপডেট', 'ব্যবসায়িক ও পেমেন্ট তথ্য পরিবর্তন করা হয়েছে।');
    this.persist();
    return this.data.settings;
  }
}

export const db = new Database();
