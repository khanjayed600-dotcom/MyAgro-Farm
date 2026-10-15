/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Package,
  MapPin,
  LogOut,
  Clock,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Order, UserAddress } from '../types.ts';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder: (orderNo: string, phone: string) => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  onTrackOrder,
}) => {
  const { lang, t } = useLanguage();
  const { user, token, logout, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Address edit state
  const [newStreet, setNewStreet] = useState('');
  const [newThana, setNewThana] = useState('কুড়িগ্রাম সদর');
  const [newDistrict, setNewDistrict] = useState('কুড়িগ্রাম');
  const [addingAddress, setAddingAddress] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      fetchOrders();
    }
  }, [isOpen, token]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  if (!isOpen || !user) return null;

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet.trim()) return;

    const newAddr: UserAddress = {
      id: `addr-${Date.now()}`,
      label: 'বাড়ি',
      recipientName: user.name,
      phone: user.phone,
      district: newDistrict,
      thana: newThana,
      streetAddress: newStreet.trim(),
      isDefault: user.addresses.length === 0,
    };

    await updateProfile({
      addresses: [...(user.addresses || []), newAddr],
    });

    setNewStreet('');
    setAddingAddress(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-sm sm:text-base">{user.name}</h2>
              <p className="text-xs text-stone-500 font-mono">{user.phone}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 text-xs font-semibold bg-stone-50">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 text-center border-b-2 cursor-pointer transition-colors ${
              activeTab === 'orders'
                ? 'border-emerald-800 text-emerald-950 bg-white font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            {t('আমার অর্ডারসমূহ', 'My Orders')} ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`flex-1 py-3 text-center border-b-2 cursor-pointer transition-colors ${
              activeTab === 'addresses'
                ? 'border-emerald-800 text-emerald-950 bg-white font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            {t('ডেলিভারি ঠিকানা', 'Saved Addresses')}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-center border-b-2 cursor-pointer transition-colors ${
              activeTab === 'profile'
                ? 'border-emerald-800 text-emerald-950 bg-white font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            {t('অ্যাকাউন্ট সেটিংস', 'Account Settings')}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {loadingOrders ? (
                <p className="text-xs text-stone-500 text-center py-8">{t('অর্ডার লোড হচ্ছে...', 'Loading orders...')}</p>
              ) : orders.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Package className="w-10 h-10 text-stone-300 mx-auto" />
                  <p className="text-stone-600 text-xs font-medium">
                    {t('আপনার কোনো পূর্ববর্তী অর্ডার নেই।', 'You have no past orders yet.')}
                  </p>
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
                      <div>
                        <span className="text-stone-400 block text-[10px]">{t('অর্ডার নম্বর', 'Order #')}</span>
                        <span className="font-bold text-stone-900 font-mono">{ord.orderNumber}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">{t('তারিখ', 'Date')}</span>
                        <span>{new Date(ord.createdAt).toLocaleDateString('bn-BD')}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">{t('মোট টাকা', 'Total')}</span>
                        <span className="font-bold text-stone-900 tabular-nums">৳{ord.total}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[10px]">{t('স্ট্যাটাস', 'Status')}</span>
                        <span className="font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[11px]">
                          {ord.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-stone-600 text-[11px]">
                          <span>
                            {it.nameBn} ({it.packageSize}) × {it.quantity}
                          </span>
                          <span className="tabular-nums font-medium">৳{it.subtotal}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          onClose();
                          onTrackOrder(ord.orderNumber, ord.customerPhone);
                        }}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>{t('ট্র্যাক করুন', 'Track Order')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  {t('সংরক্ষিত ডেলিভারি ঠিকানা', 'Saved Addresses')}
                </h3>
                <button
                  onClick={() => setAddingAddress(!addingAddress)}
                  className="px-2.5 py-1 text-xs bg-emerald-50 text-emerald-800 font-semibold rounded-lg hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('নতুন ঠিকানা', 'Add Address')}</span>
                </button>
              </div>

              {addingAddress && (
                <form onSubmit={handleAddAddress} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={t('জেলা', 'District')}
                      value={newDistrict}
                      onChange={(e) => setNewDistrict(e.target.value)}
                      className="p-2 bg-white border border-stone-300 rounded"
                    />
                    <input
                      type="text"
                      placeholder={t('থানা', 'Thana')}
                      value={newThana}
                      onChange={(e) => setNewThana(e.target.value)}
                      className="p-2 bg-white border border-stone-300 rounded"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={t('রোড/বাড়ি/মহল্লা বিস্তারিত ঠিকানা', 'Detailed street address')}
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-300 rounded"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setAddingAddress(false)}
                      className="px-3 py-1 bg-stone-200 rounded text-stone-700"
                    >
                      {t('বাতিল', 'Cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-emerald-800 text-white rounded font-semibold"
                    >
                      {t('সংরক্ষণ করুন', 'Save')}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {user.addresses?.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-1 flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-stone-900">
                        <MapPin className="w-3.5 h-3.5 text-emerald-800" />
                        <span>{addr.label}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-normal">
                            {t('ডিফল্ট', 'Default')}
                          </span>
                        )}
                      </div>
                      <p className="text-stone-600 mt-0.5">
                        {addr.streetAddress}, {addr.thana}, {addr.district}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span className="text-stone-500">{t('গ্রাহকের নাম', 'Customer Name')}</span>
                  <span className="font-bold text-stone-900">{user.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span className="text-stone-500">{t('মোবাইল নম্বর', 'Phone Number')}</span>
                  <span className="font-bold text-stone-900 font-mono">{user.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span className="text-stone-500">{t('ইমেইল', 'Email')}</span>
                  <span className="font-medium text-stone-900">{user.email}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-stone-500">{t('অ্যাকাউন্ট তৈরি', 'Member Since')}</span>
                  <span className="text-stone-700">
                    {new Date(user.createdAt).toLocaleDateString('bn-BD')}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('লগআউট করুন', 'Log Out')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
