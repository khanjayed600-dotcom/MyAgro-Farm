/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  CheckCircle,
  Clock,
  Package,
  Truck,
  MapPin,
  AlertCircle,
  HelpCircle,
  Send,
} from 'lucide-react';
import { Order, OrderStatus } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { trackOrderFromFirestore } from '../firebase/orderService.ts';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string;
  initialPhone?: string;
  onOpenComplaint: (orderNo: string) => void;
}

const STEPS: { status: OrderStatus; labelBn: string; labelEn: string }[] = [
  { status: 'Pending', labelBn: 'অর্ডার জমা', labelEn: 'Placed' },
  { status: 'Confirmed', labelBn: 'কনফার্ম', labelEn: 'Confirmed' },
  { status: 'Processing', labelBn: 'খামারে প্রসেসিং', labelEn: 'Processing' },
  { status: 'Packed', labelBn: 'প্যাকিং সম্পন্ন', labelEn: 'Packed' },
  { status: 'Shipped', labelBn: 'কুরিয়ারে হস্তান্তর', labelEn: 'Shipped' },
  { status: 'Out for Delivery', labelBn: 'ডেলিভারিতে বের হয়েছে', labelEn: 'Out for Delivery' },
  { status: 'Delivered', labelBn: 'ডেলিভারি সম্পন্ন', labelEn: 'Delivered' },
];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  initialOrderNumber = '',
  initialPhone = '',
  onOpenComplaint,
}) => {
  const { lang, t } = useLanguage();

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState(initialPhone);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialOrderNumber && initialPhone) {
      setOrderNumber(initialOrderNumber);
      setPhone(initialPhone);
      handleTrack(initialOrderNumber, initialPhone);
    }
  }, [initialOrderNumber, initialPhone]);

  if (!isOpen) return null;

  const handleTrack = async (orderNoToTrack?: string, phoneToTrack?: string) => {
    const oNo = orderNoToTrack || orderNumber;
    const ph = phoneToTrack || phone;

    if (!oNo.trim() || !ph.trim()) {
      setError(t('অর্ডার নম্বর এবং মোবাইল নম্বর দিন।', 'Enter order number and phone.'));
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      // 1. Try finding in cloud Firestore first
      const firestoreOrder = await trackOrderFromFirestore(oNo.trim(), ph.trim());
      if (firestoreOrder) {
        setOrder(firestoreOrder);
        setIsLoading(false);
        return;
      }

      // 2. Fallback to API
      const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(oNo.trim())}&phone=${encodeURIComponent(ph.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'অর্ডার পাওয়া যায়নি। নম্বর দুটি যাচাই করুন।');
        setOrder(null);
      } else {
        setOrder(data.order);
      }
    } catch (err: any) {
      setError(err.message || 'সার্ভার সমস্যা।');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    const idx = STEPS.findIndex((s) => s.status === status);
    return idx === -1 ? 0 : idx;
  };

  const currentStepIdx = order ? getStepIndex(order.status) : 0;
  const isCancelled = order?.status === 'Cancelled';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-800" />
            <h2 className="font-bold text-stone-900 text-base sm:text-lg">
              {t('অর্ডার ট্র্যাকিং ও ডেলিভারি স্ট্যাটাস', 'Live Order & Delivery Tracking')}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Tracking Input Search */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  {t('অর্ডার নম্বর *', 'Order Number *')}
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="যেমন: MAF-20261014-1234"
                  className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2.5 font-mono uppercase focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  {t('অর্ডারে ব্যবহৃত মোবাইল নম্বর *', 'Customer Phone Number *')}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01712345678"
                  className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2.5 font-mono focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => handleTrack()}
              disabled={isLoading}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>{isLoading ? t('খোঁজা হচ্ছে...', 'Searching...') : t('স্ট্যাটাস দেখুন', 'Track Order')}</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Active Order Details */}
          {order && (
            <div className="space-y-6">
              {/* Order Status Badge & Meta */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-stone-400 block">{t('অর্ডার নং', 'Order No.')}</span>
                  <span className="font-bold text-stone-900 font-mono text-sm">{order.orderNumber}</span>
                </div>

                <div>
                  <span className="text-stone-400 block">{t('বর্তমান অবস্থা', 'Status')}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-xs inline-block ${
                      isCancelled
                        ? 'bg-rose-100 text-rose-800'
                        : order.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {order.courierName && (
                  <div>
                    <span className="text-stone-400 block">{t('কুরিয়ার ও ট্র্যাকিং', 'Courier & Code')}</span>
                    <span className="font-semibold text-stone-800">
                      {order.courierName} {order.courierTrackingId ? `(${order.courierTrackingId})` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Visual Horizontal Timeline */}
              {!isCancelled ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    {t('ডেলিভারি অগ্রগতি', 'Delivery Progress')}
                  </h4>

                  <div className="relative flex items-center justify-between py-4">
                    {/* Background line */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-stone-200 -translate-y-1/2 -z-10" />
                    {/* Active line */}
                    <div
                      className="absolute top-1/2 left-0 h-1 bg-emerald-700 -translate-y-1/2 -z-10 transition-all duration-500"
                      style={{ width: `${(currentStepIdx / (STEPS.length - 1)) * 100}%` }}
                    />

                    {STEPS.map((step, idx) => {
                      const isCompleted = idx <= currentStepIdx;
                      return (
                        <div key={step.status} className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isCompleted
                                ? 'bg-emerald-800 text-white shadow-xs ring-4 ring-emerald-50'
                                : 'bg-white border-2 border-stone-300 text-stone-400'
                            }`}
                          >
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <span
                            className={`text-[10px] sm:text-xs mt-1.5 text-center font-medium max-w-[65px] sm:max-w-[80px] leading-tight ${
                              isCompleted ? 'text-stone-900 font-semibold' : 'text-stone-400'
                            }`}
                          >
                            {lang === 'bn' ? step.labelBn : step.labelEn}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                  <strong>{t('অর্ডারটি বাতিল করা হয়েছে।', 'This order has been cancelled.')}</strong>
                  <p>{t('বিস্তারিত জানতে আমাদের সাপোর্ট সেন্টারে যোগাযোগ করুন।', 'Contact customer support for assistance.')}</p>
                </div>
              )}

              {/* Detailed Timeline Events */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  {t('টাইমলাইন বিবরণ', 'Timeline Updates')}
                </h4>
                <div className="space-y-2 border-l-2 border-stone-200 pl-4 ml-2">
                  {order.timeline.map((evt, i) => (
                    <div key={i} className="relative space-y-0.5 text-xs">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-700" />
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{evt.status}</span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {new Date(evt.timestamp).toLocaleString('bn-BD')}
                        </span>
                      </div>
                      <p className="text-stone-600 text-xs">
                        {lang === 'bn' ? evt.noteBn : evt.noteEn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="p-4 border border-stone-200 rounded-xl space-y-2 text-xs">
                <h4 className="font-bold text-stone-900 uppercase tracking-wider">
                  {t('পণ্যসমূহ', 'Order Items')} ({order.items.length})
                </h4>
                <div className="divide-y divide-stone-100">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={it.image} alt={it.nameBn} className="w-8 h-8 rounded object-cover" />
                        <div>
                          <span className="font-medium text-stone-900 block">{it.nameBn}</span>
                          <span className="text-stone-400 text-[10px]">
                            {it.packageSize} × {it.quantity}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-stone-900 tabular-nums">৳{it.subtotal}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Need Help / Issue Button */}
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div>
                  <h5 className="font-bold text-emerald-950">
                    {t('পণ্য বা ডেলিভারি নিয়ে কোনো সমস্যা?', 'Have an issue with this order?')}
                  </h5>
                  <p className="text-emerald-800 text-[11px]">
                    {t('সহজ রিটার্ন বা রিপ্লেসমেন্ট আবেদন করুন।', 'Submit a complaint or request replacement.')}
                  </p>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenComplaint(order.orderNumber);
                  }}
                  className="px-3 py-1.5 bg-emerald-900 text-white rounded-lg font-semibold hover:bg-emerald-950 transition-colors cursor-pointer shrink-0"
                >
                  {t('অভিযোগ জানান', 'Submit Issue')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
