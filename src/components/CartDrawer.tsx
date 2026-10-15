/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Trash2, ArrowRight, Tag, ShoppingBag, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useCart } from '../context/CartContext.tsx';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
}) => {
  const { lang, t } = useLanguage();
  const {
    items,
    updateQuantity,
    removeFromCart,
    subtotal,
    deliveryCharge,
    freeDeliveryThreshold,
    coupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    total,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplying(true);
    setCouponError('');
    setCouponSuccess('');

    const res = await applyCoupon(couponInput.trim());
    setIsApplying(false);
    if (res.success) {
      setCouponSuccess(res.message || 'কুপন সফলভাবে যুক্ত হয়েছে!');
      setCouponInput('');
    } else {
      setCouponError(res.error || 'কুপন কার্যকর করা যায়নি।');
    }
  };

  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-800" />
            <h2 className="font-bold text-stone-900 text-base">
              {t('আপনার শপিং ব্যাগ', 'Your Shopping Bag')}
            </h2>
            <span className="text-xs font-semibold text-stone-500 tabular-nums">
              ({items.length} {t('পণ্য', 'items')})
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Bar */}
        <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 text-xs">
          {remainingForFreeDelivery > 0 ? (
            <p className="text-emerald-900">
              {t('আর মাত্র', 'Add')} <strong className="tabular-nums">৳{remainingForFreeDelivery}</strong>{' '}
              {t('টাকার পণ্য কিনলে সম্পূর্ণ ফ্রি ডেলিভারি!', 'more to get FREE Delivery!')}
            </p>
          ) : (
            <p className="text-emerald-900 font-bold flex items-center gap-1">
              🎉 {t('অভিনন্দন! আপনি ফ্রি ডেলিভারি পাচ্ছেন।', 'Congratulations! You unlocked FREE Delivery.')}
            </p>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <ShoppingBag className="w-12 h-12 text-stone-300" />
              <p className="text-stone-600 text-sm font-medium">
                {t('আপনার কার্ট বর্তমানে খালি আছে', 'Your shopping cart is empty')}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-lg hover:bg-emerald-900 transition-colors cursor-pointer"
              >
                {t('পণ্য কেনাকাটা শুরু করুন', 'Start Shopping')}
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}-${item.packageSize}`}
                className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200"
              >
                <img
                  src={item.product.images[0]}
                  alt={item.product.nameBn}
                  className="w-16 h-16 object-cover rounded-lg bg-stone-200 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-stone-900 truncate">
                    {lang === 'bn' ? item.product.nameBn : item.product.nameEn}
                  </h4>
                  <div className="text-[11px] text-stone-500 font-medium">
                    {item.packageSize} · ৳{item.unitPrice}
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-stone-300 rounded bg-white">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.packageSize, item.quantity - 1)
                        }
                        className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-100"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold text-stone-900 tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.packageSize, item.quantity + 1)
                        }
                        className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-100"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-bold text-stone-900 tabular-nums">
                      ৳{item.unitPrice * item.quantity}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.productId, item.packageSize)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer with Calculations */}
        {items.length > 0 && (
          <div className="p-4 border-t border-stone-200 bg-white space-y-3">
            {/* Coupon Code Input */}
            {coupon ? (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{coupon.code}</span>
                  <span className="font-normal text-emerald-700">(-৳{couponDiscount})</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-stone-500 hover:text-rose-600 font-medium text-xs cursor-pointer"
                >
                  {t('বাতিল', 'Remove')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('কুপন কোড (যেমন: AGRO10)', 'Coupon code (e.g. AGRO10)')}
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 text-xs bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 uppercase focus:bg-white focus:border-emerald-700 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isApplying || !couponInput.trim()}
                  className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isApplying ? '...' : t('প্রয়োগ', 'Apply')}
                </button>
              </form>
            )}

            {couponError && <p className="text-[11px] text-rose-600">{couponError}</p>}
            {couponSuccess && <p className="text-[11px] text-emerald-700 font-medium">{couponSuccess}</p>}

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-stone-600 border-t border-stone-100 pt-2">
              <div className="flex justify-between">
                <span>{t('উপমোট (Subtotal)', 'Subtotal')}</span>
                <span className="font-bold text-stone-900 tabular-nums">৳{subtotal}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>{t('কুপন ছাড় (Discount)', 'Coupon Discount')}</span>
                  <span className="font-bold tabular-nums">-৳{couponDiscount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>{t('আনুমানিক ডেলিভারি চার্জ', 'Estimated Delivery')}</span>
                <span className="font-bold text-stone-900 tabular-nums">
                  {deliveryCharge === 0 ? (
                    <span className="text-emerald-700 uppercase font-bold">{t('ফ্রি', 'FREE')}</span>
                  ) : (
                    `৳${deliveryCharge}`
                  )}
                </span>
              </div>

              <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
                <span>{t('সর্বমোট (Total)', 'Total Payable')}</span>
                <span className="text-emerald-950 text-base tabular-nums">৳{total}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{t('অর্ডার সম্পন্ন করুন (চেকআউট)', 'Proceed to Checkout')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
