/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string;
}

export const ComplaintModal: React.FC<ComplaintModalProps> = ({
  isOpen,
  onClose,
  initialOrderNumber = '',
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [issueType, setIssueType] = useState<'quality' | 'delivery_delay' | 'damaged' | 'wrong_item' | 'other'>('quality');
  const [description, setDescription] = useState('');
  const [refundRequested, setRefundRequested] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialOrderNumber) {
      setOrderNumber(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!orderNumber.trim() || !customerName.trim() || !customerPhone.trim() || !description.trim()) {
      setError(t('সকল আবশ্যক তথ্য পূরণ করুন।', 'Please fill in all required fields.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          issueType,
          description: description.trim(),
          refundRequested,
          refundAmount: refundRequested && refundAmount ? Number(refundAmount) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'অভিযোগ জমা দেওয়া সম্ভব হয়নি।');
      } else {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2500);
      }
    } catch (err: any) {
      setError(err.message || 'সার্ভার সমস্যা।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-700" />
            <h2 className="font-bold text-stone-900 text-sm sm:text-base">
              {t('পণ্য অভিযোগ ও রিটার্ন/রিফান্ড আবেদন', 'Product Issue & Return Request')}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {success ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-stone-900 text-base">
                {t('আপনার আবেদন সফলভাবে জমা হয়েছে!', 'Complaint Submitted Successfully!')}
              </h3>
              <p className="text-xs text-stone-600">
                {t(
                  'আমাদের কাস্টমার রিলেশনস দল ২৪ ঘণ্টার মধ্যে আপনার সাথে ফোনে যোগাযোগ করবে।',
                  'Our customer support team will contact you within 24 hours.'
                )}
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  {t('অর্ডার নম্বর *', 'Order Number *')}
                </label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="MAF-20261014-XXXX"
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-mono focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-700 block mb-1">
                    {t('আপনার নাম *', 'Your Name *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:border-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-700 block mb-1">
                    {t('মোবাইল নম্বর *', 'Phone Number *')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-mono focus:border-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  {t('সমস্যার ধরন *', 'Issue Type *')}
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as any)}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:border-emerald-700 focus:outline-none"
                >
                  <option value="quality">{t('পণ্যের গুণমান বা স্বাদ সম্পর্কিত', 'Quality or taste concern')}</option>
                  <option value="damaged">{t('প্যাকেজিং বা পণ্য ক্ষতিগ্রস্থ (Damaged)', 'Damaged packaging/goods')}</option>
                  <option value="delivery_delay">{t('ডেলিভারি বিলম্ব (Delivery delay)', 'Delivery delay')}</option>
                  <option value="wrong_item">{t('ভুল পণ্য পাঠানো হয়েছে (Wrong Item)', 'Wrong item delivered')}</option>
                  <option value="other">{t('অন্যান্য কারণ', 'Other reason')}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">
                  {t('সমস্যার বিস্তারিত বিবরণ *', 'Detailed Description *')}
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('কী সমস্যা হয়েছে বিস্তারিত লিখুন...', 'Explain the issue in detail...')}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                  <input
                    type="checkbox"
                    checked={refundRequested}
                    onChange={(e) => setRefundRequested(e.target.checked)}
                    className="accent-emerald-800"
                  />
                  <span>{t('টাকা রিফান্ড বা পণ্য পরিবর্তন চাই', 'Request Refund or Replacement')}</span>
                </label>

                {refundRequested && (
                  <div>
                    <label className="text-[11px] text-stone-500 block mb-1">
                      {t('দাবীকৃত রিফান্ড পরিমাণ (টাকা):', 'Claimed Refund Amount (BDT):')}
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="যেমন: 500"
                      className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2 font-mono focus:border-emerald-700 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? t('জমা হচ্ছে...', 'Submitting...') : t('অভিযোগ জমা দিন', 'Submit Complaint')}</span>
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
