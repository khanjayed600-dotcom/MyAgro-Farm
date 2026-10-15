/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  Star,
  ShieldAlert,
  Tag,
  Settings,
  FileText,
  Bell,
  LogOut,
  Volume2,
  VolumeX,
  Plus,
  Edit,
  Trash2,
  Check,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Printer,
  ChevronRight,
  TrendingUp,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import {
  Order,
  Product,
  Category,
  Review,
  Complaint,
  Coupon,
  AppNotification,
  AuditLog,
  SiteSettings,
  OrderStatus,
} from '../../types.ts';
import {
  subscribeToSharedOrders,
  updatePersistentOrderStatus,
} from '../../firebase/orderService.ts';
import { isFirebaseConfigured } from '../../firebase/firebase.ts';
import { FirebaseSetupModal } from '../FirebaseSetupModal.tsx';

interface AdminDashboardProps {
  onBackToStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToStore }) => {
  const { adminUser, adminToken, logoutAdmin } = useAuth();
  const { lang, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'orders'
    | 'products'
    | 'inventory'
    | 'complaints'
    | 'reviews'
    | 'coupons'
    | 'customers'
    | 'audit'
    | 'settings'
  >('overview');

  // Stats
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // Module data
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Real-time Notification Center & Sound Alert
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isFirebaseSetupOpen, setIsFirebaseSetupOpen] = useState(false);

  // Form states for Product Add/Edit
  const [formNameBn, setFormNameBn] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formCategory, setFormCategory] = useState('mustard-oil');
  const [formPrice, setFormPrice] = useState(300);
  const [formDiscountPrice, setFormDiscountPrice] = useState<number | undefined>(undefined);
  const [formStock, setFormStock] = useState(50);
  const [formSizes, setFormSizes] = useState('500ml, 1 Litre');
  const [formOrigin, setFormOrigin] = useState('কুড়িগ্রাম সদর, রংপুর');
  const [formCert, setFormCert] = useState('ল্যাব টেস্টে নিরাপদ ও খাঁটি');
  const [formDescBn, setFormDescBn] = useState('');

  // Audio synthesizer chime for alerts (no external audio file dependencies!)
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio playback not permitted by browser gesture:', e);
    }
  };

  // Fetch Stats and Initial Data
  useEffect(() => {
    if (adminToken) {
      loadStats();
      loadOrders();
      loadProducts();
      loadCategories();
      loadComplaints();
      loadReviews();
      loadCoupons();
      loadCustomers();
      loadAuditLogs();
      loadSettings();
      loadNotifications();
      initRealtimeStream();
    }
  }, [adminToken]);

  // Real-time Shared Firestore Order Listener (cross-device order updates)
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const unsubscribe = subscribeToSharedOrders(
      (cloudOrders) => {
        if (cloudOrders && cloudOrders.length > 0) {
          setOrders(cloudOrders);
          setRecentOrders(cloudOrders.slice(0, 8));
          setStats((prev: any) => {
            const totalSales = cloudOrders
              .filter((o) => o.status !== 'Cancelled')
              .reduce((sum, o) => sum + (o.total || 0), 0);
            const pendingOrders = cloudOrders.filter((o) => o.status === 'Pending').length;
            const deliveredOrders = cloudOrders.filter((o) => o.status === 'Delivered').length;
            return {
              ...(prev || {}),
              totalOrders: cloudOrders.length,
              totalSales,
              pendingOrders,
              deliveredOrders,
            };
          });
        }
      },
      (err) => {
        console.warn('Real-time Firestore orders listener notification:', err);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Connect Server-Sent Events (SSE)
  const initRealtimeStream = () => {
    if (!adminToken) return;
    const eventSource = new EventSource(`/api/admin/notifications/stream?token=${encodeURIComponent(adminToken)}`);

    eventSource.onopen = () => {
      setIsLiveConnected(true);
    };

    eventSource.onmessage = (e) => {
      try {
        const notif = JSON.parse(e.data);
        if (notif.type !== 'connected') {
          setNotifications((prev) => [notif, ...prev]);
          playAlertSound();
          // Reload relevant data
          loadStats();
          loadOrders();
          loadComplaints();
        }
      } catch (err) {
        console.error(err);
      }
    };

    eventSource.onerror = () => {
      setIsLiveConnected(false);
    };

    return () => {
      eventSource.close();
    };
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadCategories = async () => {
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

  const loadComplaints = async () => {
    try {
      const res = await fetch('/api/admin/complaints', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Order Status Update (Persistent in Firestore and dual-synced with API)
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    courierName?: string,
    trackingId?: string
  ) => {
    try {
      // 1. Persist directly to central Firestore cloud database
      await updatePersistentOrderStatus(orderId, newStatus, adminUser?.name || 'Admin', {
        courierName,
        courierTrackingId: trackingId,
      });

      // 2. Optimistic local update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: newStatus,
                courierName: courierName !== undefined ? courierName : o.courierName,
                courierTrackingId: trackingId !== undefined ? trackingId : o.courierTrackingId,
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );

      // 3. Dual sync to backend API if running with session token
      if (adminToken && !adminToken.startsWith('fb-')) {
        await fetch(`/api/admin/orders/${orderId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            status: newStatus,
            courierName,
            trackingId,
          }),
        }).catch(() => {});
      }

      loadStats();
      loadAuditLogs();
      setSelectedOrderForEdit(null);
    } catch (e) {
      console.error('Error updating order status:', e);
    }
  };

  // Product Save/Create/Update
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const pkgSizes = formSizes.split(',').map((s) => s.trim()).filter(Boolean);

    const productPayload = {
      nameBn: formNameBn,
      nameEn: formNameEn,
      slug: formNameEn.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      categorySlug: formCategory,
      price: Number(formPrice),
      discountPrice: formDiscountPrice ? Number(formDiscountPrice) : undefined,
      stock: Number(formStock),
      packageSizes: pkgSizes.length ? pkgSizes : ['1 একক'],
      farmOriginBn: formOrigin,
      farmOriginEn: 'Kurigram Farmland',
      certificationsBn: formCert,
      descriptionBn: formDescBn,
      descriptionEn: formDescBn,
      deliveryEligibility: 'all_bd',
      unit: 'কেজি/লিটার',
      images: editingProduct?.images?.length ? editingProduct.images : ['/src/assets/images/product_mustard_oil_1792012102350.jpg'],
      sku: editingProduct?.sku || `MAF-GEN-${Date.now().toString().slice(-4)}`,
      featured: true,
      bestSeller: false,
      isOrganicCertified: false,
      isLabTested: true,
    };

    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(productPayload),
      });

      if (res.ok) {
        loadProducts();
        loadAuditLogs();
        setProductModalOpen(false);
        setEditingProduct(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই পণ্যটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        loadProducts();
        loadAuditLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Stock Quick Adjust
  const handleAdjustStock = async (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ stock: newStock }),
      });
      loadProducts();
      loadAuditLogs();
    } catch (e) {
      console.error(e);
    }
  };

  // Complaint Resolve
  const handleResolveComplaint = async (complaintId: string, status: Complaint['status'], notes: string) => {
    try {
      await fetch(`/api/admin/complaints/${complaintId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status, resolutionNotes: notes }),
      });
      loadComplaints();
      loadAuditLogs();
    } catch (e) {
      console.error(e);
    }
  };

  // Review Status
  const handleUpdateReview = async (reviewId: string, status: Review['status'], adminReply?: string) => {
    try {
      await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status, adminReply }),
      });
      loadReviews();
    } catch (e) {
      console.error(e);
    }
  };

  // Save Settings
  const handleSaveSettings = async (newSettings: Partial<SiteSettings>) => {
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(newSettings),
      });
      loadSettings();
      alert('সেটিংস সফলভাবে সংরক্ষিত হয়েছে।');
    } catch (e) {
      console.error(e);
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const filteredOrders = orders.filter((o) => {
    const matchStatus = selectedOrderStatus === 'all' || o.status === selectedOrderStatus;
    const matchSearch =
      !orderSearchQuery ||
      o.orderNumber.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      o.customerPhone.includes(orderSearchQuery);
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
      {/* Admin Top Navigation */}
      <header className="bg-stone-900 text-white sticky top-0 z-40 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-base sm:text-lg font-bold tracking-tight text-white">
              MyAgro Farm Admin
            </span>
            <span className="text-xs bg-stone-800 text-emerald-400 px-2 py-0.5 rounded font-mono hidden sm:inline">
              v1.0-Secure
            </span>
            {isLiveConnected && (
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live SSE
              </span>
            )}

            {/* Cloud Firestore Status Badge / Setup */}
            <button
              onClick={() => setIsFirebaseSetupOpen(true)}
              className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                isFirebaseConfigured()
                  ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                  : 'bg-amber-950/90 border border-amber-700 text-amber-300 hover:bg-amber-900 animate-pulse'
              }`}
              title="Firebase ক্লাউড ডাটাবেস সেটিংস"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isFirebaseConfigured() ? 'Firestore Live' : 'Connect Firebase'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Sound Chime Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playAlertSound();
              }}
              className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
              title={soundEnabled ? 'সাউন্ড অ্যালার্ট চালু' : 'সাউন্ড অ্যালার্ট বন্ধ'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
                className="relative p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {isNotifMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 z-50 text-stone-800 text-xs">
                  <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between font-bold">
                    <span>{t('লাইভ নোটিফিকেশন', 'Live Notifications')}</span>
                    <button
                      onClick={async () => {
                        await fetch('/api/admin/notifications/read-all', {
                          method: 'PUT',
                          headers: { Authorization: `Bearer ${adminToken}` },
                        });
                        loadNotifications();
                      }}
                      className="text-[11px] text-emerald-800 hover:underline cursor-pointer"
                    >
                      {t('সব পঠিত করুন', 'Mark all read')}
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-stone-400">কোনো নোটিফিকেশন নেই</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 hover:bg-stone-50 cursor-pointer space-y-0.5 ${
                            !n.read ? 'bg-emerald-50/60 font-medium' : ''
                          }`}
                        >
                          <div className="text-[11px] font-bold text-stone-900">{n.titleBn}</div>
                          <p className="text-[11px] text-stone-600 leading-tight">{n.messageBn}</p>
                          <span className="text-[10px] text-stone-400 font-mono block">
                            {new Date(n.createdAt).toLocaleTimeString('bn-BD')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin identity badge */}
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-white leading-tight">
                {adminUser?.name || 'ওসমান গনি'}
              </span>
              <span className="text-[10px] text-stone-400">
                {adminUser?.email === 'ceo@myagrofarm.com' ? 'প্রতিষ্ঠাতা ও সিইও' : 'সিস্টেম অ্যাডমিনিস্ট্রেটর'}
              </span>
            </div>

            {/* Back to Storefront */}
            <button
              onClick={onBackToStore}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {t('গ্রাহক স্টোরফ্রন্ট', 'View Store')}
            </button>

            {/* Logout */}
            <button
              onClick={() => {
                logoutAdmin();
                onBackToStore();
              }}
              className="p-1.5 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="লগআউট"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-60 shrink-0 space-y-1 bg-white p-3 rounded-2xl border border-stone-200 self-start text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'overview' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{t('ড্যাশবোর্ড ওভারভিউ', 'Dashboard Overview')}</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'orders' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4" />
              <span>{t('অর্ডারসমূহ', 'Orders')}</span>
            </div>
            {stats?.pendingOrders > 0 && (
              <span className="bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums">
                {stats.pendingOrders}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'products' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{t('পণ্য তালিকা ও যুক্ত', 'Products')}</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'inventory' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4" />
              <span>{t('স্টক ও ইনভেন্টরি', 'Stock & Inventory')}</span>
            </div>
            {stats?.lowStockCount > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums">
                {stats.lowStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('complaints')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'complaints' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4" />
              <span>{t('অভিযোগ ও রিফান্ড', 'Complaints & Refunds')}</span>
            </div>
            {stats?.pendingComplaints > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums">
                {stats.pendingComplaints}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'reviews' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>{t('রিভিউ মডারেশন', 'Review Moderation')}</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'coupons' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>{t('কুপন ও ছাড়', 'Coupons & Promos')}</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'customers' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('গ্রাহক তালিকা', 'Customers')}</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'audit' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('অডিট লগ ও নিরাপত্তা', 'Audit Logs')}</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'settings' ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t('স্টোর ও পেমেন্ট সেটিংস', 'Store Settings')}</span>
          </button>
        </aside>

        {/* Content View */}
        <main className="flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-xs font-semibold text-stone-500">{t('মোট বিক্রি', 'Total Revenue')}</span>
                  <div className="text-2xl font-bold text-stone-900 tabular-nums">
                    ৳{stats?.totalSales?.toLocaleString() || 0}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>আজকের বিক্রি: ৳{stats?.todaySales || 0}</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-xs font-semibold text-stone-500">{t('মোট অর্ডার', 'Total Orders')}</span>
                  <div className="text-2xl font-bold text-stone-900 tabular-nums">
                    {stats?.totalOrders || 0}
                  </div>
                  <div className="text-[11px] text-amber-700 font-medium">
                    পেন্ডিং অর্ডার: {stats?.pendingOrders || 0} টি
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-xs font-semibold text-stone-500">{t('মোট খাদ্যপণ্য', 'Total Products')}</span>
                  <div className="text-2xl font-bold text-stone-900 tabular-nums">
                    {stats?.totalProducts || 0}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    লো-স্টক পণ্য: <span className="text-rose-600 font-bold">{stats?.lowStockCount || 0}</span> টি
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-xs font-semibold text-stone-500">{t('নিবন্ধিত ক্রেতা', 'Registered Users')}</span>
                  <div className="text-2xl font-bold text-stone-900 tabular-nums">
                    {stats?.totalCustomers || 0}
                  </div>
                  <div className="text-[11px] text-emerald-800 font-medium">সক্রিয় ক্রেতা পরিবার</div>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">
                      {t('সাম্প্রতিক অর্ডারসমূহ', 'Recent Incoming Orders')}
                    </h3>
                    <p className="text-xs text-stone-500">সর্বশেষ ৮টি অর্ডারের সারসংক্ষেপ</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-emerald-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t('সকল অর্ডার দেখুন', 'View All Orders')}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                      <tr>
                        <th className="p-2.5">অর্ডার নম্বর</th>
                        <th className="p-2.5">গ্রাহক ও মোবাইল</th>
                        <th className="p-2.5">মোট মূল্য</th>
                        <th className="p-2.5">পেমেন্ট</th>
                        <th className="p-2.5">বর্তমান অবস্থা</th>
                        <th className="p-2.5 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {recentOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-stone-50/70">
                          <td className="p-2.5 font-bold font-mono text-stone-900">{ord.orderNumber}</td>
                          <td className="p-2.5">
                            <span className="font-medium text-stone-900 block">{ord.customerName}</span>
                            <span className="text-stone-400 font-mono text-[11px]">{ord.customerPhone}</span>
                          </td>
                          <td className="p-2.5 font-bold text-stone-900 tabular-nums">৳{ord.total}</td>
                          <td className="p-2.5 uppercase font-medium text-stone-700">{ord.paymentMethod}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                                ord.status === 'Delivered'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : ord.status === 'Cancelled'
                                  ? 'bg-rose-100 text-rose-900'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => {
                                setSelectedOrderForEdit(ord);
                                setActiveTab('orders');
                              }}
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded font-semibold text-stone-800 transition-colors cursor-pointer"
                            >
                              সম্পাদনা
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">
                      {t('অর্ডার ব্যবস্থাপনা', 'Order Management')}
                    </h3>
                    <p className="text-xs text-stone-500">
                      স্ট্যাটাস আপডেট, কুরিয়ার ট্র্যাকিং নম্বর নির্ধারণ ও ইনভয়েস প্রিন্ট
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="অর্ডার নম্বর বা ফোন..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-700"
                    />

                    <select
                      value={selectedOrderStatus}
                      onChange={(e) => setSelectedOrderStatus(e.target.value)}
                      className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 focus:outline-none"
                    >
                      <option value="all">সকল স্ট্যাটাস</option>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Packed">Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 text-stone-700 font-semibold border-b border-stone-200">
                      <tr>
                        <th className="p-3">অর্ডার নম্বর</th>
                        <th className="p-3">তারিখ ও সময়</th>
                        <th className="p-3">ক্রেতা ও ঠিকানা</th>
                        <th className="p-3">পণ্যসমূহ</th>
                        <th className="p-3">মোট (৳)</th>
                        <th className="p-3">বর্তমান অবস্থা</th>
                        <th className="p-3 text-right">স্ট্যাটাস পরিবর্তন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-stone-50/60">
                          <td className="p-3 font-bold font-mono text-stone-900">{ord.orderNumber}</td>
                          <td className="p-3 text-stone-500">
                            {new Date(ord.createdAt).toLocaleDateString('bn-BD')}
                          </td>
                          <td className="p-3">
                            <strong className="text-stone-900 block">{ord.customerName}</strong>
                            <span className="text-stone-500 font-mono text-[11px] block">{ord.customerPhone}</span>
                            <span className="text-stone-400 text-[10px] block truncate max-w-xs">
                              {ord.deliveryAddress.streetAddress}, {ord.deliveryAddress.thana}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-stone-800">{ord.items.length} টি আইটেম</span>
                            <span className="text-[10px] text-stone-400 block">
                              {ord.items.map((i) => i.nameBn).slice(0, 2).join(', ')}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-stone-900 tabular-nums">৳{ord.total}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                                ord.status === 'Delivered'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : ord.status === 'Cancelled'
                                  ? 'bg-rose-100 text-rose-900'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedOrderForEdit(ord)}
                              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                            >
                              আপডেট
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Status Modal */}
              {selectedOrderForEdit && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg space-y-4">
                    <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm">
                          অর্ডার আপডেট: {selectedOrderForEdit.orderNumber}
                        </h4>
                        <span className="text-xs text-stone-500">
                          {selectedOrderForEdit.customerName} ({selectedOrderForEdit.customerPhone})
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedOrderForEdit(null)}
                        className="p-1 text-stone-400 hover:text-stone-700"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="font-semibold block mb-1">নতুন স্ট্যাটাস নির্বাচন করুন:</label>
                        <select
                          id="new-status-select"
                          defaultValue={selectedOrderForEdit.status}
                          className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg"
                        >
                          <option value="Pending">Pending (অপেক্ষমান)</option>
                          <option value="Confirmed">Confirmed (নিশ্চিত)</option>
                          <option value="Processing">Processing (খামারে প্রস্তুত হচ্ছে)</option>
                          <option value="Packed">Packed (প্যাকেজিং সম্পন্ন)</option>
                          <option value="Shipped">Shipped (কুরিয়ারে হস্তান্তর)</option>
                          <option value="Out for Delivery">Out for Delivery (ডেলিভারিতে বের হয়েছে)</option>
                          <option value="Delivered">Delivered (পৌঁছে গেছে)</option>
                          <option value="Cancelled">Cancelled (বাতিল)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-semibold block mb-1">কুরিয়ার কোম্পানি:</label>
                          <input
                            type="text"
                            id="courier-name-input"
                            defaultValue={selectedOrderForEdit.courierName || 'সুন্দরবন / স্টেডফাস্ট'}
                            className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="font-semibold block mb-1">ট্র্যাকিং কোড:</label>
                          <input
                            type="text"
                            id="courier-tracking-input"
                            defaultValue={selectedOrderForEdit.courierTrackingId || ''}
                            placeholder="TRK-98234"
                            className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForEdit(null)}
                          className="px-4 py-2 bg-stone-200 rounded-lg font-semibold text-stone-700"
                        >
                          বাতিল
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const status = (document.getElementById('new-status-select') as HTMLSelectElement).value;
                            const courier = (document.getElementById('courier-name-input') as HTMLInputElement).value;
                            const tracking = (document.getElementById('courier-tracking-input') as HTMLInputElement).value;
                            handleUpdateOrderStatus(selectedOrderForEdit.id, status as any, courier, tracking);
                          }}
                          className="px-4 py-2 bg-emerald-800 text-white rounded-lg font-semibold hover:bg-emerald-900"
                        >
                          সংরক্ষণ করুন
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">
                      {t('পণ্য তালিকা ও নতুন পণ্য যুক্ত', 'Product Catalog & Add')}
                    </h3>
                    <p className="text-xs text-stone-500">
                      সকল ১৩টি খামার ক্যাটাগরির পণ্য সম্পাদনা ও নতুন আইটেম যুক্ত করার ব্যবস্থা
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setFormNameBn('');
                      setFormNameEn('');
                      setFormPrice(300);
                      setFormStock(40);
                      setFormDescBn('');
                      setProductModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('নতুন পণ্য যোগ করুন', 'Add Product')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between space-y-3 text-xs"
                    >
                      <div className="flex gap-3">
                        <img src={p.images[0]} alt={p.nameBn} className="w-16 h-16 rounded-lg object-cover bg-stone-200" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-stone-900 truncate">{p.nameBn}</h4>
                          <span className="text-[11px] text-stone-500 block">{p.categorySlug}</span>
                          <span className="font-bold text-stone-900 tabular-nums block mt-1">
                            ৳{p.discountPrice || p.price}{' '}
                            {p.discountPrice && (
                              <span className="line-through text-stone-400 font-normal">৳{p.price}</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-600 border-t border-stone-200 pt-2">
                        <span>মজুদ: <strong className="text-stone-900">{p.stock}</strong> টি</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setFormNameBn(p.nameBn);
                              setFormNameEn(p.nameEn);
                              setFormCategory(p.categorySlug);
                              setFormPrice(p.price);
                              setFormDiscountPrice(p.discountPrice);
                              setFormStock(p.stock);
                              setFormSizes(p.packageSizes.join(', '));
                              setFormOrigin(p.farmOriginBn);
                              setFormCert(p.certificationsBn || '');
                              setFormDescBn(p.descriptionBn);
                              setProductModalOpen(true);
                            }}
                            className="p-1 hover:text-emerald-800 cursor-pointer"
                            title="সম্পাদনা"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1 hover:text-rose-600 cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add/Edit Product Modal */}
              {productModalOpen && (
                <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 text-xs">
                    <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                      <h4 className="font-bold text-stone-900 text-sm">
                        {editingProduct ? 'পণ্য সম্পাদনা করুন' : 'নতুন পণ্য যুক্ত করুন'}
                      </h4>
                      <button
                        onClick={() => setProductModalOpen(false)}
                        className="text-stone-400 hover:text-stone-700"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleSaveProduct} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold block mb-1">পণ্যের নাম (বাংলা) *</label>
                          <input
                            type="text"
                            required
                            value={formNameBn}
                            onChange={(e) => setFormNameBn(e.target.value)}
                            className="w-full p-2 bg-stone-50 border border-stone-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="font-semibold block mb-1">Product Name (English)</label>
                          <input
                            type="text"
                            value={formNameEn}
                            onChange={(e) => setFormNameEn(e.target.value)}
                            className="w-full p-2 bg-stone-50 border border-stone-300 rounded"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold block mb-1">ক্যাটাগরি</label>
                          <select
                            value={formCategory}
                            onChange={(e) => setFormCategory(e.target.value)}
                            className="w-full p-2 bg-stone-50 border border-stone-300 rounded"
                          >
                            {categories.map((c) => (
                              <option key={c.slug} value={c.slug}>
                                {c.nameBn}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="font-semibold block mb-1">মজুদ পরিমাণ (Stock)</label>
                          <input
                            type="number"
                            required
                            value={formStock}
                            onChange={(e) => setFormStock(Number(e.target.value))}
                            className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold block mb-1">রেগুলার মূল্য (BDT) *</label>
                          <input
                            type="number"
                            required
                            value={formPrice}
                            onChange={(e) => setFormPrice(Number(e.target.value))}
                            className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-mono"
                          />
                        </div>
                        <div>
                          <label className="font-semibold block mb-1">ছাড় মূল্য (ঐচ্ছিক)</label>
                          <input
                            type="number"
                            value={formDiscountPrice || ''}
                            onChange={(e) =>
                              setFormDiscountPrice(e.target.value ? Number(e.target.value) : undefined)
                            }
                            className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-semibold block mb-1">প্যাকেজ সাইজসমূহ (কমা দিয়ে লিখুন)</label>
                        <input
                          type="text"
                          value={formSizes}
                          onChange={(e) => setFormSizes(e.target.value)}
                          placeholder="500ml, 1 Litre, 2 Litre"
                          className="w-full p-2 bg-stone-50 border border-stone-300 rounded"
                        />
                      </div>

                      <div>
                        <label className="font-semibold block mb-1">খামার বা উৎসের নাম (Origin)</label>
                        <input
                          type="text"
                          value={formOrigin}
                          onChange={(e) => setFormOrigin(e.target.value)}
                          className="w-full p-2 bg-stone-50 border border-stone-300 rounded"
                        />
                      </div>

                      <div>
                        <label className="font-semibold block mb-1">ল্যাব টেস্ট / বিশুদ্ধতা তথ্য</label>
                        <input
                          type="text"
                          value={formCert}
                          onChange={(e) => setFormCert(e.target.value)}
                          className="w-full p-2 bg-stone-50 border border-stone-300 rounded"
                        />
                      </div>

                      <div>
                        <label className="font-semibold block mb-1">বিবরণ</label>
                        <textarea
                          rows={2}
                          value={formDescBn}
                          onChange={(e) => setFormDescBn(e.target.value)}
                          className="w-full p-2 bg-stone-50 border border-stone-300 rounded"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                        <button
                          type="button"
                          onClick={() => setProductModalOpen(false)}
                          className="px-4 py-2 bg-stone-200 rounded font-semibold text-stone-700"
                        >
                          বাতিল
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-800 text-white rounded font-semibold hover:bg-emerald-900"
                        >
                          সংরক্ষণ করুন
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INVENTORY & LOW STOCK */}
          {activeTab === 'inventory' && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4">
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  {t('স্টক ও ইনভেন্টরি ম্যানেজমেন্ট', 'Inventory & Quick Stock Adjust')}
                </h3>
                <p className="text-xs text-stone-500">
                  সরাসরি স্টক আপডেট করুন এবং কম স্টকের সতর্কবার্তা পর্যবেক্ষণ করুন
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 text-stone-700 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="p-3">পণ্য</th>
                      <th className="p-3">ক্যাটাগরি</th>
                      <th className="p-3">বর্তমান স্টক</th>
                      <th className="p-3">স্টক অবস্থা</th>
                      <th className="p-3 text-right">কুইক স্টক অ্যাডজাস্ট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td className="p-3 font-semibold text-stone-900">{p.nameBn}</td>
                        <td className="p-3 text-stone-500">{p.categorySlug}</td>
                        <td className="p-3 font-bold text-stone-900 tabular-nums text-sm">{p.stock}</td>
                        <td className="p-3">
                          {p.stock <= 5 ? (
                            <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold text-[10px]">
                              সতর্কতা: লো-স্টক
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium text-[10px]">
                              পর্যাপ্ত
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          <button
                            onClick={() => handleAdjustStock(p, 10)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded font-bold cursor-pointer"
                          >
                            +১০
                          </button>
                          <button
                            onClick={() => handleAdjustStock(p, 25)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded font-bold cursor-pointer"
                          >
                            +২৫
                          </button>
                          <button
                            onClick={() => handleAdjustStock(p, -5)}
                            className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded font-semibold cursor-pointer"
                          >
                            -৫
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: COMPLAINTS & REFUNDS */}
          {activeTab === 'complaints' && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4">
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  {t('গ্রাহক অভিযোগ ও রিফান্ড ম্যানেজমেন্ট', 'Customer Complaints & Refunds')}
                </h3>
                <p className="text-xs text-stone-500">
                  গ্রাহকদের জমা দেওয়া অভিযোগ, পণ্য পরিবর্তনের আবেদন ও রিফান্ড নিষ্পত্তি
                </p>
              </div>

              <div className="space-y-3">
                {complaints.length === 0 ? (
                  <p className="text-xs text-stone-400 py-6 text-center">কোনো অভিযোগ জমা নেই।</p>
                ) : (
                  complaints.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-stone-200 pb-2">
                        <div>
                          <strong className="text-stone-900 font-mono">{c.orderNumber}</strong> ·{' '}
                          <span>{c.customerName}</span> ({c.customerPhone})
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            c.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-900'
                              : c.status === 'rejected'
                              ? 'bg-stone-200 text-stone-700'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      <div className="text-stone-700">
                        <strong className="text-stone-900">সমস্যা:</strong> {c.description}
                      </div>

                      {c.refundRequested && (
                        <div className="text-emerald-800 font-semibold text-[11px]">
                          রিফান্ড আবেদন করা হয়েছে: {c.refundAmount ? `৳${c.refundAmount}` : 'হ্যাঁ'}
                        </div>
                      )}

                      {c.resolutionNotes && (
                        <div className="bg-white p-2.5 rounded border border-stone-200 text-stone-600">
                          <strong>সমাধান নোট:</strong> {c.resolutionNotes}
                        </div>
                      )}

                      {c.status === 'under_review' && (
                        <div className="pt-2 flex gap-2">
                          <button
                            onClick={() => {
                              const note = prompt('সমাধানের বিবরণ বা নোট লিখুন:');
                              if (note) handleResolveComplaint(c.id, 'resolved', note);
                            }}
                            className="px-3 py-1 bg-emerald-800 text-white rounded font-semibold cursor-pointer"
                          >
                            মীমাংসা করুন (Resolved)
                          </button>
                          <button
                            onClick={() => {
                              const note = prompt('বাতিলের কারণ লিখুন:');
                              if (note) handleResolveComplaint(c.id, 'rejected', note);
                            }}
                            className="px-3 py-1 bg-stone-200 text-stone-700 rounded font-semibold cursor-pointer"
                          >
                            বাতিল করুন (Reject)
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4">
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  {t('পণ্য রিভিউ মডারেশন', 'Review Moderation & Replies')}
                </h3>
                <p className="text-xs text-stone-500">
                  গ্রাহকদের জমা দেওয়া রিভিউ অনুমোদন করুন এবং খামার থেকে অফিসিয়াল উত্তর দিন
                </p>
              </div>

              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <div>
                        <strong className="text-stone-900">{r.userName}</strong>
                        <span className="text-stone-400 text-[11px] ml-2">পণ্য ID: {r.productId}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-amber-600">★ {r.rating}</span>
                        <span className="text-stone-300">·</span>
                        <span className="uppercase text-[10px] font-bold text-stone-600">{r.status}</span>
                      </div>
                    </div>

                    <p className="text-stone-700">{r.commentBn}</p>

                    {r.adminReply && (
                      <div className="bg-emerald-50 p-2 rounded text-emerald-950 text-[11px]">
                        <strong>অ্যাডমিন উত্তর:</strong> {r.adminReply}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1 border-t border-stone-200">
                      <button
                        onClick={() => {
                          const reply = prompt('অফিসিয়াল উত্তর লিখুন:');
                          if (reply) handleUpdateReview(r.id, 'approved', reply);
                        }}
                        className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded font-semibold cursor-pointer"
                      >
                        উত্তর দিন
                      </button>

                      {r.status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateReview(r.id, 'approved')}
                          className="px-2.5 py-1 bg-emerald-800 text-white rounded font-semibold cursor-pointer"
                        >
                          অনুমোদন (Approve)
                        </button>
                      )}

                      {r.status !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateReview(r.id, 'rejected')}
                          className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded font-semibold cursor-pointer"
                        >
                          বাতিল (Reject)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: COUPONS */}
          {activeTab === 'coupons' && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">কুপন ও প্রচারমূলক কোড</h3>
                  <p className="text-xs text-stone-500">ডিসকাউন্ট কুপন তৈরি ও ব্যবহারের নিরীক্ষা</p>
                </div>
                <button
                  onClick={() => {
                    const code = prompt('কুপন কোড (যেমন: FRESH20):');
                    const val = prompt('ছাড়ের পরিমাণ (টাকা বা %):');
                    if (code && val) {
                      fetch('/api/admin/coupons', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${adminToken}`,
                        },
                        body: JSON.stringify({
                          code: code.toUpperCase(),
                          discountType: 'percentage',
                          discountValue: Number(val),
                          minOrderValue: 500,
                          maxDiscount: 200,
                          expiryDate: '2026-12-31',
                          usageLimit: 200,
                        }),
                      }).then(() => loadCoupons());
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-800 text-white font-semibold text-xs rounded-lg cursor-pointer"
                >
                  + নতুন কুপন
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {coupons.map((cp) => (
                  <div key={cp.id} className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <strong className="font-mono text-sm text-emerald-950 font-bold">{cp.code}</strong>
                      <span className="text-emerald-700 font-bold">
                        {cp.discountValue}
                        {cp.discountType === 'percentage' ? '%' : ' BDT'}
                      </span>
                    </div>
                    <div className="text-stone-500 text-[11px]">
                      সর্বনিম্ন অর্ডার: ৳{cp.minOrderValue}
                    </div>
                    <div className="text-stone-500 text-[11px]">
                      ব্যবহার হয়েছে: {cp.usedCount} / {cp.usageLimit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4">
              <div>
                <h3 className="font-bold text-stone-900 text-base">নিবন্ধিত ক্রেতা তালিকা</h3>
                <p className="text-xs text-stone-500">গ্রাহকদের ফোন নম্বর ও মোট অর্ডারের বিবরণ</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 text-stone-700 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="p-3">গ্রাহক নাম</th>
                      <th className="p-3">মোবাইল</th>
                      <th className="p-3">ইমেইল</th>
                      <th className="p-3">অর্ডার সংখ্যা</th>
                      <th className="p-3">মোট খরচ (৳)</th>
                      <th className="p-3">নিবন্ধন তারিখ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {customers.map((c) => (
                      <tr key={c.id}>
                        <td className="p-3 font-semibold text-stone-900">{c.name}</td>
                        <td className="p-3 font-mono">{c.phone}</td>
                        <td className="p-3 text-stone-500">{c.email}</td>
                        <td className="p-3 tabular-nums font-bold">{c.ordersCount || 0}</td>
                        <td className="p-3 font-bold tabular-nums">৳{c.totalSpent || 0}</td>
                        <td className="p-3 text-stone-400">
                          {new Date(c.createdAt).toLocaleDateString('bn-BD')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4">
              <div>
                <h3 className="font-bold text-stone-900 text-base">নিরাপত্তা ও অডিট লগ ট্রেইল</h3>
                <p className="text-xs text-stone-500">
                  সকল প্রশাসনিক পরিবর্তন, স্ট্যাটাস আপডেট ও সিস্টেম অ্যাকশন ট্র্যাক করা হয়
                </p>
              </div>

              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-wrap justify-between items-center text-xs"
                  >
                    <div>
                      <strong className="text-stone-900">{log.action}</strong>
                      <span className="text-stone-500 ml-2">{log.details}</span>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      <span>{log.adminName}</span> ·{' '}
                      <span className="font-mono">{new Date(log.timestamp).toLocaleString('bn-BD')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: SETTINGS */}
          {activeTab === 'settings' && settings && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-6 text-xs">
              <div>
                <h3 className="font-bold text-stone-900 text-base">স্টোর ও ব্যবসায়িক সেটিংস</h3>
                <p className="text-stone-500">ডেলিভারি চার্জ, নেতৃত্ব তথ্য এবং পেমেন্ট গেটওয়ে সেটিংস</p>
              </div>

              {/* Delivery Rates */}
              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 uppercase">ডেলিভারি ফি সেটিংস</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-600 mb-1">কুড়িগ্রাম সদর (BDT):</label>
                    <input
                      type="number"
                      defaultValue={settings.deliveryFees.kurigramSadar}
                      id="fee-kurigram"
                      className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1">রংপুর বিভাগ (BDT):</label>
                    <input
                      type="number"
                      defaultValue={settings.deliveryFees.rangpurDivision}
                      id="fee-rangpur"
                      className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1">সারা বাংলাদেশ (BDT):</label>
                    <input
                      type="number"
                      defaultValue={settings.deliveryFees.nationwide}
                      id="fee-nationwide"
                      className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Free delivery threshold */}
              <div className="space-y-2">
                <label className="block text-stone-600 font-semibold">ফ্রি ডেলিভারি থ্রেশহোল্ড (BDT):</label>
                <input
                  type="number"
                  defaultValue={settings.freeDeliveryThreshold}
                  id="free-threshold"
                  className="w-48 p-2 bg-stone-50 border border-stone-300 rounded font-mono"
                />
              </div>

              {/* Payment Gateway Toggles */}
              <div className="space-y-3 border-t border-stone-200 pt-4">
                <h4 className="font-bold text-stone-900 uppercase">পেমেন্ট গেটওয়ে সেটিংস (Test / Live)</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={settings.paymentGateways.bkashActive}
                      id="bkash-active"
                      className="accent-emerald-800"
                    />
                    <span>বিকাশ মার্চেন্ট গেটওয়ে সক্রিয়</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={settings.paymentGateways.nagadActive}
                      id="nagad-active"
                      className="accent-emerald-800"
                    />
                    <span>নগদ পেমেন্ট সক্রিয়</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={settings.paymentGateways.isTestMode}
                      id="test-mode"
                      className="accent-emerald-800"
                    />
                    <span>সিমুলেটেড টেস্ট মোড সক্রিয় (Credentials ছাড়াই নিরাপদ যাচাইকরণ)</span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const kurigramFee = Number((document.getElementById('fee-kurigram') as HTMLInputElement).value);
                    const rangpurFee = Number((document.getElementById('fee-rangpur') as HTMLInputElement).value);
                    const nationwideFee = Number((document.getElementById('fee-nationwide') as HTMLInputElement).value);
                    const freeThresh = Number((document.getElementById('free-threshold') as HTMLInputElement).value);
                    const bkash = (document.getElementById('bkash-active') as HTMLInputElement).checked;
                    const nagad = (document.getElementById('nagad-active') as HTMLInputElement).checked;
                    const testMode = (document.getElementById('test-mode') as HTMLInputElement).checked;

                    handleSaveSettings({
                      freeDeliveryThreshold: freeThresh,
                      deliveryFees: {
                        kurigramSadar: kurigramFee,
                        rangpurDivision: rangpurFee,
                        nationwide: nationwideFee,
                      },
                      paymentGateways: {
                        ...settings.paymentGateways,
                        bkashActive: bkash,
                        nagadActive: nagad,
                        isTestMode: testMode,
                      },
                    });
                  }}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg cursor-pointer"
                >
                  সেটিংস সংরক্ষণ করুন
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Firebase Setup & Netlify Deployment Modal */}
      <FirebaseSetupModal
        isOpen={isFirebaseSetupOpen}
        onClose={() => setIsFirebaseSetupOpen(false)}
      />
    </div>
  );
};
