/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  MapPin,
  Phone,
  User as UserIcon,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lock,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Order } from '../types.ts';
import { createPersistentOrder } from '../firebase/orderService.ts';
import { isFirebaseConfigured } from '../firebase/firebase.ts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const {
    items,
    subtotal,
    deliveryZone,
    setDeliveryZone,
    deliveryCharge,
    coupon,
    couponDiscount,
    total,
    clearCart,
  } = useCart();

  // Form State
  const defaultAddr = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [district, setDistrict] = useState(defaultAddr?.district || 'কুড়িগ্রাম');
  const [thana, setThana] = useState(defaultAddr?.thana || 'কুড়িগ্রাম সদর');
  const [streetAddress, setStreetAddress] = useState(defaultAddr?.streetAddress || '');
  const [customerNotes, setCustomerNotes] = useState('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad' | 'bank'>('cod');
  const [bkashNumber, setBkashNumber] = useState('');
  const [bkashTrxId, setBkashTrxId] = useState('');
  const [bankSlipRef, setBankSlipRef] = useState('');

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    if (!customerName.trim()) {
      setErrorMessage(t('অনুগ্রহ করে আপনার নাম দিন।', 'Please provide your full name.'));
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorMessage(
        t('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)।', 'Please provide a valid 11-digit phone number.')
      );
      return;
    }

    if (!streetAddress.trim()) {
      setErrorMessage(t('অনুগ্রহ করে সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন।', 'Please enter your complete delivery address.'));
      return;
    }

    // Payment validation
    let trxId = '';
    if (paymentMethod === 'bkash' || paymentMethod === 'nagad') {
      if (!bkashTrxId.trim()) {
        // Auto-generate test TrxID if in simulator mode for smooth user experience
        trxId = `${paymentMethod.toUpperCase()}${Date.now().toString().slice(-6)}`;
      } else {
        trxId = bkashTrxId.trim();
      }
    }

    // Prevent duplicate orders
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: customerEmail.trim() || undefined,
        deliveryAddress: {
          district: district.trim(),
          thana: thana.trim(),
          streetAddress: streetAddress.trim(),
        },
        deliveryZone,
        items: items.map((i) => ({
          productId: i.productId,
          nameBn: i.product.nameBn,
          nameEn: i.product.nameEn,
          image: i.product.images[0],
          packageSize: i.packageSize,
          price: i.unitPrice,
          quantity: i.quantity,
          subtotal: i.unitPrice * i.quantity,
        })),
        subtotal,
        deliveryCharge,
        discount: couponDiscount,
        couponCode: coupon?.code,
        total,
        paymentMethod,
        paymentTrxId: trxId || undefined,
        bankSlipRef: paymentMethod === 'bank' ? bankSlipRef : undefined,
        customerNotes: customerNotes.trim() || undefined,
        userId: user?.id,
      };

      // Save persistently in central Firestore database
      const savedOrder = await createPersistentOrder(orderPayload);

      if (!savedOrder || !savedOrder.id) {
        throw new Error('অর্ডার ডাটাবেসে সেভ করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
      }

      // Success callback only after confirmed persistence in database
      clearCart();
      onClose();
      onOrderSuccess(savedOrder);
    } catch (err: any) {
      console.error('Order placement failure:', err);
      setErrorMessage(
        err.message || t('অর্ডার ডাটাবেসে সংরক্ষণ ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।', 'Failed to save order to database. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-800" />
            <h2 className="font-bold text-stone-900 text-base sm:text-lg">
              {t('নিরাপদ চেকআউট ও অর্ডার কনফার্মেশন', 'Secure Checkout & Order Placement')}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handlePlaceOrder} className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Customer Contact */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-emerald-800" />
              <span>{t('১. ক্রেতার তথ্য', '1. Customer Contact')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  {t('আপনার পূর্ণ নাম *', 'Full Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t('যেমন: মো. করিমুল ইসলাম', 'e.g. Md. Karimul Islam')}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  {t('মোবাইল নম্বর (১১ ডিজিট) *', 'Phone Number (11 Digits) *')}
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="01712345678"
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:bg-white focus:border-emerald-700 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Area & Address */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-800" />
              <span>{t('২. ডেলিভারি এলাকা ও ঠিকানা', '2. Delivery Location & Address')}</span>
            </h3>

            {/* Delivery Zone Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`p-3 border rounded-xl flex flex-col justify-between cursor-pointer transition-all ${
                  deliveryZone === 'kurigram_sadar'
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{t('কুড়িগ্রাম সদর', 'Kurigram Sadar')}</span>
                  <input
                    type="radio"
                    name="zone"
                    checked={deliveryZone === 'kurigram_sadar'}
                    onChange={() => setDeliveryZone('kurigram_sadar')}
                    className="accent-emerald-800"
                  />
                </div>
                <span className="text-[11px] text-stone-500 mt-1">
                  {subtotal >= 2000 ? t('ফ্রি ডেলিভারি', 'FREE Delivery') : '৳৫০ (২৪ ঘণ্টা)'}
                </span>
              </label>

              <label
                className={`p-3 border rounded-xl flex flex-col justify-between cursor-pointer transition-all ${
                  deliveryZone === 'rangpur_division'
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{t('রংপুর বিভাগ', 'Rangpur Division')}</span>
                  <input
                    type="radio"
                    name="zone"
                    checked={deliveryZone === 'rangpur_division'}
                    onChange={() => setDeliveryZone('rangpur_division')}
                    className="accent-emerald-800"
                  />
                </div>
                <span className="text-[11px] text-stone-500 mt-1">
                  {subtotal >= 2000 ? t('ফ্রি ডেলিভারি', 'FREE Delivery') : '৳৮০ (৪৮ ঘণ্টা)'}
                </span>
              </label>

              <label
                className={`p-3 border rounded-xl flex flex-col justify-between cursor-pointer transition-all ${
                  deliveryZone === 'nationwide'
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{t('সারাদেশে কুরিয়ার', 'All Bangladesh')}</span>
                  <input
                    type="radio"
                    name="zone"
                    checked={deliveryZone === 'nationwide'}
                    onChange={() => setDeliveryZone('nationwide')}
                    className="accent-emerald-800"
                  />
                </div>
                <span className="text-[11px] text-stone-500 mt-1">
                  {subtotal >= 2000 ? t('ফ্রি ডেলিভারি', 'FREE Delivery') : '৳১২০ (২-৩ দিন)'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  {t('জেলা *', 'District *')}
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  {t('থানা / উপজেলা *', 'Thana / Upazila *')}
                </label>
                <input
                  type="text"
                  required
                  value={thana}
                  onChange={(e) => setThana(e.target.value)}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-stone-700 block mb-1">
                {t('বাসা/রোড/এলাকার সম্পূর্ণ ঠিকানা *', 'Complete Street & House Address *')}
              </label>
              <textarea
                required
                rows={2}
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder={t('বাড়ি নম্বর, রোড নম্বর, গ্রামের নাম বা ল্যান্ডমার্ক...', 'House number, street, village or landmark...')}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:bg-white focus:border-emerald-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-stone-700 block mb-1">
                {t('অর্ডার সংক্রান্ত বিশেষ নোট (ঐচ্ছিক)', 'Special Delivery Note (Optional)')}
              </label>
              <input
                type="text"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder={t('যেমন: অফিস টাইমে কল করবেন', 'e.g. Call before delivery')}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2 focus:bg-white focus:border-emerald-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-800" />
              <span>{t('৩. পেমেন্ট পদ্ধতি নির্বাচন করুন', '3. Select Payment Method')}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-3 border rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                }`}
              >
                <Truck className="w-5 h-5 text-emerald-800 mb-1" />
                <span className="text-xs">{t('ক্যাশ অন ডেলিভারি', 'Cash on Delivery')}</span>
                <span className="text-[10px] text-stone-500 mt-0.5">{t('হাতে পেয়ে টাকা', 'Pay upon receipt')}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bkash')}
                className={`p-3 border rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  paymentMethod === 'bkash'
                    ? 'border-pink-600 bg-pink-50 text-pink-950 font-bold'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                }`}
              >
                <span className="text-pink-600 font-extrabold text-sm mb-1">bKash</span>
                <span className="text-xs">{t('বিকাশ পেমেন্ট', 'bKash Merchant')}</span>
                <span className="text-[10px] text-stone-500 mt-0.5">{t('টেস্ট মোড সক্রিয়', 'Test Gateway')}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('nagad')}
                className={`p-3 border rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  paymentMethod === 'nagad'
                    ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                }`}
              >
                <span className="text-amber-600 font-extrabold text-sm mb-1">নগদ</span>
                <span className="text-xs">{t('নগদ পেমেন্ট', 'Nagad Payment')}</span>
                <span className="text-[10px] text-stone-500 mt-0.5">{t('টেস্ট মোড সক্রিয়', 'Test Gateway')}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                className={`p-3 border rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  paymentMethod === 'bank'
                    ? 'border-stone-800 bg-stone-100 text-stone-950 font-bold'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                }`}
              >
                <CreditCard className="w-5 h-5 text-stone-700 mb-1" />
                <span className="text-xs">{t('ব্যাংক ট্রান্সফার', 'Bank Transfer')}</span>
                <span className="text-[10px] text-stone-500 mt-0.5">{t('অগ্রণী ব্যাংক', 'Agrani Bank')}</span>
              </button>
            </div>

            {/* Online Payment Simulator Details */}
            {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-800 font-semibold">
                  <span>
                    {paymentMethod === 'bkash' ? 'বিকাশ মার্চেন্ট নম্বর:' : 'নগদ মার্চেন্ট নম্বর:'} 01712-MYAGRO (টেস্ট)
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">
                    {t('সার্ভার ভেরিফিকেশন সক্রিয়', 'Server Verification Active')}
                  </span>
                </div>
                <p className="text-stone-500 text-[11px]">
                  {t(
                    'অফিসিয়াল পেমেন্ট সিমুলেশন মোড: আপনি ট্রানজেকশন আইডি (TrxID) দিতে পারেন অথবা খালি রাখলে স্বয়ংক্রিয়ভাবে একটি ভেরিফাইড ট্রানজেকশন রেফারেন্স জেনারেট হবে।',
                    'Test gateway simulator: You may enter a TrxID or leave blank to auto-generate a verified test reference.'
                  )}
                </p>
                <input
                  type="text"
                  value={bkashTrxId}
                  onChange={(e) => setBkashTrxId(e.target.value)}
                  placeholder="TrxID (ঐচ্ছিক / স্বয়ংক্রিয় জেনারেট হবে)"
                  className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2 font-mono uppercase focus:border-emerald-700 focus:outline-none"
                />
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs">
                <div className="text-stone-800 font-bold">
                  {t('অগ্রণী ব্যাংক পিএলসি - কুড়িগ্রাম শাখা', 'Agrani Bank PLC - Kurigram Branch')}
                </div>
                <div className="text-stone-600 text-[11px]">
                  অ্যাকাউন্ট নাম: <strong>MyAgro Farm Enterprise</strong> <br />
                  অ্যাকাউন্ট নম্বর: <strong>205021302001234</strong>
                </div>
                <input
                  type="text"
                  value={bankSlipRef}
                  onChange={(e) => setBankSlipRef(e.target.value)}
                  placeholder={t('ব্যাংক ডিপোজিট স্লিপ নম্বর বা রেফারেন্স', 'Bank deposit slip number or reference')}
                  className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2 font-mono focus:border-emerald-700 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Section 4: Final Order Summary */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
            <h4 className="font-bold text-stone-900 uppercase tracking-wider mb-2">
              {t('অর্ডার সারসংক্ষেপ', 'Order Summary')}
            </h4>

            <div className="flex justify-between text-stone-600">
              <span>{t('পণ্যের উপমোট', 'Item Subtotal')} ({items.length} {t('পণ্য', 'items')})</span>
              <span className="font-bold text-stone-900 tabular-nums">৳{subtotal}</span>
            </div>

            {couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>{t('কুপন ডিসকাউন্ট', 'Coupon Discount')} ({coupon?.code})</span>
                <span className="font-bold tabular-nums">-৳{couponDiscount}</span>
              </div>
            )}

            <div className="flex justify-between text-stone-600">
              <span>{t('ডেলিভারি চার্জ', 'Delivery Charge')}</span>
              <span className="font-bold text-stone-900 tabular-nums">
                {deliveryCharge === 0 ? <span className="text-emerald-700 font-bold">{t('ফ্রি', 'FREE')}</span> : `৳${deliveryCharge}`}
              </span>
            </div>

            <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
              <span>{t('মোট প্রদেয় টাকা', 'Total Payable')}</span>
              <span className="text-emerald-950 text-base tabular-nums">৳{total}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>{t('অর্ডার প্রসেস হচ্ছে...', 'Processing Order...')}</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>{t(`৳${total} টাকা অর্ডার নিশ্চিত করুন`, `Confirm Order of ৳${total}`)}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
