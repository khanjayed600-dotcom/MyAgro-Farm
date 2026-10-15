/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Coupon } from '../types.ts';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, packageSize?: string, quantity?: number) => void;
  updateQuantity: (productId: string, packageSize: string, quantity: number) => void;
  removeFromCart: (productId: string, packageSize: string) => void;
  clearCart: () => void;
  subtotal: number;
  deliveryZone: 'kurigram_sadar' | 'rangpur_division' | 'nationwide';
  setDeliveryZone: (zone: 'kurigram_sadar' | 'rangpur_division' | 'nationwide') => void;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  coupon: Coupon | null;
  couponDiscount: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  removeCoupon: () => void;
  total: number;
  totalItemsCount: number;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FREE_DELIVERY_THRESHOLD = 2000;
const DELIVERY_RATES = {
  kurigram_sadar: 50,
  rangpur_division: 80,
  nationwide: 120,
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('myagro_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deliveryZone, setDeliveryZone] = useState<'kurigram_sadar' | 'rangpur_division' | 'nationwide'>('kurigram_sadar');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('myagro_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, packageSize?: string, quantity: number = 1) => {
    const size = packageSize || product.packageSizes[0] || '১ একক';
    const unitPrice = product.discountPrice || product.price;

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && item.packageSize === size
      );

      if (existingIndex > -1) {
        const next = [...prev];
        const newQty = next[existingIndex].quantity + quantity;
        if (newQty > product.stock) {
          alert(`দুঃখিত, ${product.nameBn} এর সর্বোচ্চ ${product.stock} টি মজুদ রয়েছে।`);
          return prev;
        }
        next[existingIndex].quantity = newQty;
        return next;
      } else {
        if (quantity > product.stock) {
          alert(`দুঃখিত, ${product.nameBn} এর সর্বোচ্চ ${product.stock} টি মজুদ রয়েছে।`);
          return prev;
        }
        return [...prev, { productId: product.id, product, packageSize: size, quantity, unitPrice }];
      }
    });

    setIsCartDrawerOpen(true);
  };

  const updateQuantity = (productId: string, packageSize: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, packageSize);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId && item.packageSize === packageSize) {
          if (quantity > item.product.stock) {
            alert(`মজুদ অনুযায়ী সর্বোচ্চ ${item.product.stock} টি যোগ করতে পারবেন।`);
            return { ...item, quantity: item.product.stock };
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string, packageSize: string) => {
    setItems((prev) =>
      prev.filter((item) => !(item.productId === productId && item.packageSize === packageSize))
    );
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
    setCouponDiscount(0);
  };

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // Delivery Charge calculation
  const deliveryCharge = subtotal >= FREE_DELIVERY_THRESHOLD || items.length === 0 ? 0 : DELIVERY_RATES[deliveryZone];

  const applyCoupon = async (code: string) => {
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartTotal: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'কুপন প্রযোজ্য নয়।' };
      }
      setCoupon(data.coupon);
      setCouponDiscount(data.discount);
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'সার্ভার সমস্যা।' };
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponDiscount(0);
  };

  const total = Math.max(0, subtotal - couponDiscount + deliveryCharge);
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        deliveryZone,
        setDeliveryZone,
        deliveryCharge,
        freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
        coupon,
        couponDiscount,
        applyCoupon,
        removeCoupon,
        total,
        totalItemsCount,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
