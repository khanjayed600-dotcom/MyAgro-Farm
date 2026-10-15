/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  nameBn: string;
  nameEn: string;
  slug: string;
  categorySlug: string;
  descriptionBn: string;
  descriptionEn: string;
  price: number;
  discountPrice?: number;
  discountPercent?: number;
  packageSizes: string[];
  selectedSize?: string;
  stock: number;
  unit: string; // e.g., 'লিটার', 'কেজি', 'গ্রাম', 'পিস'
  images: string[];
  farmOriginBn: string;
  farmOriginEn: string;
  harvestDate?: string;
  bestBefore?: string;
  certificationsBn?: string;
  certificationsEn?: string;
  deliveryEligibility: 'all_bd' | 'kurigram_rangpur_only' | 'kurigram_only';
  rating: number;
  reviewCount: number;
  featured: boolean;
  bestSeller: boolean;
  isOrganicCertified: boolean;
  isLabTested: boolean;
  sku: string;
  createdAt: string;
}

export interface Category {
  id: string;
  slug: string;
  nameBn: string;
  nameEn: string;
  descriptionBn: string;
  descriptionEn: string;
  iconName: string;
  image?: string;
  itemCount: number;
}

export interface UserAddress {
  id: string;
  label: string; // 'বাড়ি', 'অফিস', 'অন্যান্য'
  recipientName: string;
  phone: string;
  district: string;
  thana: string;
  streetAddress: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin' | 'superadmin';
  addresses: UserAddress[];
  createdAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  packageSize: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderItem {
  productId: string;
  nameBn: string;
  nameEn: string;
  image: string;
  packageSize: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Return Requested'
  | 'Refunded';

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  noteBn: string;
  noteEn: string;
}

export interface Order {
  id: string;
  orderNumber: string; // MAF-20261014-XXXX
  userId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  deliveryAddress: {
    district: string;
    thana: string;
    streetAddress: string;
  };
  deliveryZone: 'kurigram_sadar' | 'rangpur_division' | 'nationwide';
  deliveryCharge: number;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  total: number;
  paymentMethod: 'cod' | 'bkash' | 'nagad' | 'bank';
  paymentStatus: 'pending' | 'verified' | 'failed' | 'refunded';
  paymentTrxId?: string;
  bankSlipRef?: string;
  status: OrderStatus;
  timeline: OrderTimelineEvent[];
  courierName?: string;
  courierTrackingId?: string;
  adminNotes?: string;
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
  rating: number; // 1-5
  commentBn: string;
  verifiedPurchase: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  status: 'approved' | 'pending' | 'rejected';
  adminReply?: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  issueType: 'quality' | 'delivery_delay' | 'damaged' | 'wrong_item' | 'other';
  description: string;
  status: 'under_review' | 'resolved' | 'rejected';
  resolutionNotes?: string;
  refundRequested: boolean;
  refundAmount?: number;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export interface AppNotification {
  id: string;
  type: 'order' | 'user' | 'review' | 'stock' | 'complaint' | 'system';
  titleBn: string;
  titleEn: string;
  messageBn: string;
  messageEn: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  details: string;
}

export interface SiteSettings {
  brandNameBn: string;
  brandNameEn: string;
  taglineBn: string;
  taglineEn: string;
  founderName: string;
  founderTitle: string;
  systemAdminName: string;
  headOfficeAddress: string;
  contactPhone: string;
  contactEmail: string;
  emergencyHotline: string;
  freeDeliveryThreshold: number;
  deliveryFees: {
    kurigramSadar: number;
    rangpurDivision: number;
    nationwide: number;
  };
  paymentGateways: {
    bkashActive: boolean;
    bkashMerchantNumber: string;
    nagadActive: boolean;
    nagadMerchantNumber: string;
    bankActive: boolean;
    bankAccountName: string;
    bankAccountNumber: string;
    bankName: string;
    bankBranch: string;
    isTestMode: boolean;
  };
}
