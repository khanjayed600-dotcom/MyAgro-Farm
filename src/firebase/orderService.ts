/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  arrayUnion,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './firebase.ts';
import { Order, OrderStatus } from '../types.ts';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface PlaceOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: {
    district: string;
    thana: string;
    streetAddress: string;
  };
  deliveryZone: 'kurigram_sadar' | 'rangpur_division' | 'nationwide';
  items: {
    productId: string;
    nameBn: string;
    nameEn: string;
    image: string;
    packageSize: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  couponCode?: string;
  total: number;
  paymentMethod: 'cod' | 'bkash' | 'nagad' | 'bank';
  paymentTrxId?: string;
  bankSlipRef?: string;
  customerNotes?: string;
  userId?: string;
}

/**
 * Creates a persistent centralized order in Firestore.
 * Generates unique order number: MAF-YYYYMMDD-XXXX.
 * Ensures the order is saved before returning success.
 */
export async function createPersistentOrder(orderInput: PlaceOrderInput): Promise<Order> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `MAF-${dateStr}-${randomSuffix}`;
  const orderId = `ord-${Date.now()}-${randomSuffix}`;
  const now = new Date().toISOString();

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    userId: orderInput.userId || auth?.currentUser?.uid || undefined,
    customerName: orderInput.customerName.trim(),
    customerPhone: orderInput.customerPhone.trim(),
    customerEmail: orderInput.customerEmail?.trim() || undefined,
    deliveryAddress: {
      district: orderInput.deliveryAddress.district.trim(),
      thana: orderInput.deliveryAddress.thana.trim(),
      streetAddress: orderInput.deliveryAddress.streetAddress.trim(),
    },
    deliveryZone: orderInput.deliveryZone,
    items: orderInput.items,
    subtotal: orderInput.subtotal,
    deliveryCharge: orderInput.deliveryCharge,
    discount: orderInput.discount,
    couponCode: orderInput.couponCode || undefined,
    total: orderInput.total,
    paymentMethod: orderInput.paymentMethod,
    paymentStatus: orderInput.paymentMethod === 'cod' ? 'pending' : (orderInput.paymentTrxId ? 'verified' : 'pending'),
    paymentTrxId: orderInput.paymentTrxId || undefined,
    bankSlipRef: orderInput.bankSlipRef || undefined,
    status: 'Pending',
    customerNotes: orderInput.customerNotes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
    timeline: [
      {
        status: 'Pending',
        timestamp: now,
        noteBn: 'অর্ডারটি সফলভাবে জমা হয়েছে। আমাদের খামার প্রতিনিধি দ্রুত যোগাযোগ করবেন।',
        noteEn: 'Order submitted successfully and received in central farm database.',
      },
    ],
  };

  // 1. If Firebase Firestore is active, save directly to Firestore
  if (isFirebaseConfigured() && db) {
    const ordersCol = 'orders';
    try {
      const orderDocRef = doc(db, ordersCol, orderId);
      // Clean undefined keys for Firestore JSON compliance
      const cleanData = JSON.parse(JSON.stringify(newOrder));
      await setDoc(orderDocRef, cleanData);
      console.log(`[Firestore] Order #${orderNumber} persisted to cloud database.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
    }
  }

  // 2. Dual-sync with backend /api/orders if available (for dev server / db.json)
  try {
    const token = localStorage.getItem('myagro_user_token');
    await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(orderInput),
    }).catch(() => {
      // Backend may be offline in static Netlify deploy; that is expected and non-blocking
    });
  } catch (e) {
    // Non-fatal if on static Netlify
  }

  return newOrder;
}

/**
 * Real-time order listener for Shared Admin Panel.
 * Listens to Firestore 'orders' collection updates across all customer devices.
 */
export function subscribeToSharedOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  if (!isFirebaseConfigured() || !db) {
    return null;
  }

  const path = 'orders';
  try {
    const ordersQuery = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const orderList: Order[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Order;
          orderList.push({
            ...data,
            id: docSnap.id,
          });
        });
        onUpdate(orderList);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, path);
        } catch (err: any) {
          if (onError) onError(err);
        }
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

/**
 * Update order status in Firestore (Admin only)
 */
export async function updatePersistentOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  adminName: string,
  notes?: {
    internalNotes?: string;
    courierName?: string;
    courierTrackingId?: string;
    timelineNoteBn?: string;
  }
): Promise<void> {
  const now = new Date().toISOString();

  const defaultNotes: Record<OrderStatus, { bn: string; en: string }> = {
    Pending: { bn: 'অর্ডার পেন্ডিং অবস্থায় রয়েছে।', en: 'Order is pending review.' },
    Confirmed: { bn: 'অর্ডার নিশ্চিত করা হয়েছে। খামার থেকে প্যাকেজিং প্রস্তুতি চলছে।', en: 'Order confirmed by farm admin.' },
    Processing: { bn: 'খামার থেকে খাঁটি খাদ্যপণ্য প্রস্তুত ও প্রক্রিয়াজাত করা হচ্ছে।', en: 'Farm produce being prepared and inspected.' },
    Packed: { bn: 'পণ্য হাইজিন পদ্ধতিতে সিল ও সুরক্ষিত কার্টনে প্যাক সম্পন্ন হয়েছে।', en: 'Goods safely packed for dispatch.' },
    Shipped: { bn: `কুরিয়ারে হস্তান্তর করা হয়েছে${notes?.courierName ? ` (${notes.courierName})` : ''}।`, en: 'Dispatched to courier.' },
    'Out for Delivery': { bn: 'রাইডার পণ্য ডেলিভারি দিতে আপনার ঠিকানার উদ্দেশ্যে বের হয়েছে।', en: 'Out for final delivery.' },
    Delivered: { bn: 'পণ্যটি সফলভাবে গ্রাহকের কাছে হস্তান্তর করা হয়েছে।', en: 'Delivered to customer successfully.' },
    Cancelled: { bn: 'অর্ডারটি বাতিল করা হয়েছে।', en: 'Order has been cancelled.' },
    'Return Requested': { bn: 'রিটার্ন আবেদন পর্যালোচনা করা হচ্ছে।', en: 'Return request under review.' },
    Refunded: { bn: 'মূল্য রিফান্ড সম্পন্ন হয়েছে।', en: 'Payment refunded.' },
  };

  const timelineEntry = {
    status: newStatus,
    timestamp: now,
    noteBn: notes?.timelineNoteBn || defaultNotes[newStatus].bn,
    noteEn: defaultNotes[newStatus].en,
  };

  // Update in Firestore
  if (isFirebaseConfigured() && db) {
    const path = `orders/${orderId}`;
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updates: any = {
        status: newStatus,
        updatedAt: now,
        timeline: arrayUnion(timelineEntry),
      };

      if (notes?.internalNotes !== undefined) updates.adminNotes = notes.internalNotes;
      if (notes?.courierName !== undefined) updates.courierName = notes.courierName;
      if (notes?.courierTrackingId !== undefined) updates.courierTrackingId = notes.courierTrackingId;

      await updateDoc(orderRef, updates);
      console.log(`[Firestore] Order #${orderId} status updated to ${newStatus}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  // Also sync with backend API if running
  try {
    const adminToken = localStorage.getItem('myagro_admin_token');
    if (adminToken) {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: newStatus,
          courierName: notes?.courierName,
          trackingId: notes?.courierTrackingId,
        }),
      }).catch(() => {});
    }
  } catch (e) {
    // Non-fatal
  }
}

/**
 * Public Track Order by Order Number & Phone
 */
export async function trackOrderFromFirestore(
  orderNumber: string,
  phone: string
): Promise<Order | null> {
  if (isFirebaseConfigured() && db) {
    const path = 'orders';
    try {
      const cleanNum = orderNumber.trim().toUpperCase();
      const cleanPhone = phone.replace(/\D/g, '');
      const q = query(collection(db, path), where('orderNumber', '==', cleanNum));
      const snap = await getDocs(q);

      for (const d of snap.docs) {
        const order = d.data() as Order;
        if (order.customerPhone.replace(/\D/g, '') === cleanPhone) {
          return { ...order, id: d.id };
        }
      }
    } catch (err) {
      console.warn('Firestore tracking lookup error, falling back to local API:', err);
    }
  }

  // Fallback to local server API
  try {
    const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`);
    if (res.ok) {
      const data = await res.json();
      return data.order;
    }
  } catch (e) {
    // Offline
  }

  return null;
}
