/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle, Printer, ArrowRight, Package, MapPin, Phone, Calendar } from 'lucide-react';
import { Order } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onTrackOrder: (orderNumber: string, phone: string) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  onTrackOrder,
}) => {
  const { lang, t } = useLanguage();

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:w-full">
        {/* Header / Celebration banner */}
        <div className="bg-emerald-900 text-white p-6 text-center space-y-2">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-7 h-7 text-emerald-300" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans">
            {t('আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে!', 'Order Placed Successfully!')}
          </h2>
          <p className="text-emerald-200 text-xs sm:text-sm">
            {t(
              'ধন্যবাদ! কুড়িগ্রামের খামার থেকে তাজা পণ্য সংগ্রহের কাজ শুরু হয়েছে।',
              'Thank you! Your farm fresh food will be prepared and delivered shortly.'
            )}
          </p>
        </div>

        {/* Invoice & Order Summary Details */}
        <div className="p-6 space-y-6">
          {/* Key Identifiers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs">
            <div>
              <span className="text-stone-400 block">{t('অর্ডার নম্বর', 'Order Number')}</span>
              <span className="font-bold text-stone-900 font-mono">{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-stone-400 block">{t('তারিখ', 'Order Date')}</span>
              <span className="font-medium text-stone-800">
                {new Date(order.createdAt).toLocaleDateString('bn-BD')}
              </span>
            </div>
            <div>
              <span className="text-stone-400 block">{t('পেমেন্ট পদ্ধতি', 'Payment')}</span>
              <span className="font-bold text-emerald-800 uppercase">{order.paymentMethod}</span>
            </div>
            <div>
              <span className="text-stone-400 block">{t('স্ট্যাটাস', 'Status')}</span>
              <span className="font-bold text-stone-900">{order.status}</span>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="p-4 rounded-xl border border-stone-200 space-y-2 text-xs">
            <h4 className="font-bold text-stone-900 uppercase tracking-wider">
              {t('ডেলিভারি ঠিকানা ও গ্রাহক', 'Delivery & Customer Details')}
            </h4>
            <div className="text-stone-700 space-y-1">
              <div>
                <strong>{order.customerName}</strong> ({order.customerPhone})
              </div>
              <div className="flex items-start gap-1 text-stone-600">
                <MapPin className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                <span>
                  {order.deliveryAddress.streetAddress}, {order.deliveryAddress.thana},{' '}
                  {order.deliveryAddress.district}
                </span>
              </div>
              {order.customerNotes && (
                <div className="text-stone-500 italic text-[11px]">
                  {t('নোট:', 'Note:')} {order.customerNotes}
                </div>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100 text-stone-700 border-b border-stone-200 font-semibold">
                <tr>
                  <th className="p-3">{t('পণ্য', 'Product')}</th>
                  <th className="p-3 text-center">{t('পরিমাণ', 'Qty')}</th>
                  <th className="p-3 text-right">{t('মূল্য', 'Price')}</th>
                  <th className="p-3 text-right">{t('মোট', 'Subtotal')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-medium text-stone-900">
                      {lang === 'bn' ? item.nameBn : item.nameEn}
                      <span className="text-stone-400 text-[11px] block">{item.packageSize}</span>
                    </td>
                    <td className="p-3 text-center tabular-nums text-stone-700">{item.quantity}</td>
                    <td className="p-3 text-right tabular-nums text-stone-700">৳{item.price}</td>
                    <td className="p-3 text-right tabular-nums font-bold text-stone-900">
                      ৳{item.subtotal}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-stone-50 text-xs border-t border-stone-200">
                <tr>
                  <td colSpan={3} className="p-2.5 text-right font-medium text-stone-600">
                    {t('উপমোট:', 'Subtotal:')}
                  </td>
                  <td className="p-2.5 text-right font-bold text-stone-900 tabular-nums">
                    ৳{order.subtotal}
                  </td>
                </tr>
                {order.discount > 0 && (
                  <tr>
                    <td colSpan={3} className="p-2 text-right font-medium text-emerald-700">
                      {t('কুপন ডিসকাউন্ট:', 'Discount:')}
                    </td>
                    <td className="p-2 text-right font-bold text-emerald-700 tabular-nums">
                      -৳{order.discount}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3} className="p-2 text-right font-medium text-stone-600">
                    {t('ডেলিভারি চার্জ:', 'Delivery Charge:')}
                  </td>
                  <td className="p-2 text-right font-bold text-stone-900 tabular-nums">
                    {order.deliveryCharge === 0 ? t('ফ্রি', 'FREE') : `৳${order.deliveryCharge}`}
                  </td>
                </tr>
                <tr className="border-t border-stone-200 text-sm font-bold text-stone-900 bg-white">
                  <td colSpan={3} className="p-3 text-right text-emerald-950">
                    {t('সর্বমোট প্রদেয়:', 'Total Paid / Payable:')}
                  </td>
                  <td className="p-3 text-right text-emerald-950 tabular-nums text-base">
                    ৳{order.total}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t('ইনভয়েস প্রিন্ট করুন', 'Print Invoice')}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onTrackOrder(order.orderNumber, order.customerPhone);
                }}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>{t('অর্ডার ট্র্যাক করুন', 'Track Order')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                {t('বন্ধ করুন', 'Close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
