/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { Product } from '../types.ts';

interface WishlistModalProps {
  products: Product[];
  onOpenProductDetails: (product: Product) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  products,
  onOpenProductDetails,
}) => {
  const { lang, t } = useLanguage();
  const { wishlistIds, toggleWishlist, clearWishlist, isWishlistOpen, setIsWishlistOpen } =
    useWishlist();
  const { addToCart } = useCart();

  if (!isWishlistOpen) return null;

  const wishedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
            <h2 className="font-bold text-stone-900 text-base">
              {t('পছন্দের তালিকা (উইশলিস্ট)', 'My Wishlist')}
            </h2>
            <span className="text-xs font-semibold text-stone-500 tabular-nums">
              ({wishedProducts.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {wishedProducts.length > 0 && (
              <button
                onClick={clearWishlist}
                className="text-xs text-rose-600 hover:underline mr-2 cursor-pointer"
              >
                {t('সব মুছুন', 'Clear All')}
              </button>
            )}
            <button
              onClick={() => setIsWishlistOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Product List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {wishedProducts.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Heart className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-stone-600 text-xs font-medium">
                {t('আপনার পছন্দের তালিকা খালি রয়েছে।', 'Your wishlist is currently empty.')}
              </p>
            </div>
          ) : (
            wishedProducts.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div
                  onClick={() => {
                    setIsWishlistOpen(false);
                    onOpenProductDetails(p);
                  }}
                  className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                >
                  <img
                    src={p.images[0]}
                    alt={p.nameBn}
                    className="w-14 h-14 object-cover rounded-lg bg-stone-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-stone-900 truncate">
                      {lang === 'bn' ? p.nameBn : p.nameEn}
                    </h4>
                    <span className="text-stone-500 text-[11px] block">{p.farmOriginBn}</span>
                    <span className="font-bold text-stone-900 tabular-nums text-xs mt-0.5 block">
                      ৳{p.discountPrice || p.price}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      addToCart(p, p.packageSizes[0]);
                      toggleWishlist(p.id);
                    }}
                    disabled={p.stock <= 0}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{t('কার্টে নিন', 'To Cart')}</span>
                  </button>

                  <button
                    onClick={() => toggleWishlist(p.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
