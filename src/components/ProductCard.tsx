/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Heart, ShoppingBag, Star, Check } from 'lucide-react';
import { Product } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetails }) => {
  const { lang, t } = useLanguage();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedSize, setSelectedSize] = useState<string>(product.packageSizes[0] || 'একক');
  const [isAdded, setIsAdded] = useState(false);

  const isLiked = isInWishlist(product.id);
  const displayPrice = product.discountPrice || product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    addToCart(product, selectedSize, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <article
      onClick={() => onOpenDetails(product)}
      className="group bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col hover:border-emerald-700/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
    >
      {/* Image Area */}
      <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
        <img
          src={product.images[0]}
          alt={lang === 'bn' ? product.nameBn : product.nameEn}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            // Elegant fallback container if network fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {/* Fallback pattern underneath if image fails */}
        <div className="absolute inset-0 bg-stone-100 flex items-center justify-center -z-10 text-stone-400 text-xs">
          {product.nameBn}
        </div>

        {/* Top Badges: Discount or Best Seller */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {product.discountPercent && product.discountPercent > 0 && (
            <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs tabular-nums">
              {product.discountPercent}% {t('ছাড়', 'OFF')}
            </span>
          )}
          {product.bestSeller && (
            <span className="bg-emerald-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs">
              {t('জনপ্রিয়', 'Best Seller')}
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={handleToggleLike}
          aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-stone-700 hover:text-rose-600 hover:bg-white transition-colors shadow-xs cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${
              isLiked ? 'text-rose-600 fill-rose-600' : ''
            }`}
          />
        </button>

        {/* Stock Out Overlay if 0 */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">
            {t('স্টক আউট', 'Out of Stock')}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        {/* Unboxed Metadata with · separator */}
        <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium">
          <span className="truncate max-w-[140px]">{lang === 'bn' ? product.farmOriginBn : product.farmOriginEn}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-0.5 text-amber-700">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span className="tabular-nums font-semibold">{product.rating}</span>
            <span className="text-stone-400">({product.reviewCount})</span>
          </span>
        </div>

        {/* Product Title */}
        <div>
          <h3 className="font-semibold text-stone-900 text-sm sm:text-base line-clamp-1 group-hover:text-emerald-900 transition-colors">
            {lang === 'bn' ? product.nameBn : product.nameEn}
          </h3>
          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
            {lang === 'bn' ? product.descriptionBn : product.descriptionEn}
          </p>
        </div>

        {/* Package Sizes */}
        {product.packageSizes.length > 1 && (
          <div
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {product.packageSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`px-2 py-0.5 text-[11px] font-medium rounded border transition-colors cursor-pointer ${
                  selectedSize === size
                    ? 'border-emerald-800 bg-emerald-50 text-emerald-900 font-semibold'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}

        {/* Price & Add to Cart Action */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-bold text-stone-900 tabular-nums">
              ৳{displayPrice}
            </span>
            {product.discountPrice && (
              <span className="text-xs text-stone-400 line-through tabular-nums">
                ৳{product.price}
              </span>
            )}
          </div>

          {/* Quick Add Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              product.stock <= 0
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : isAdded
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-900 hover:bg-emerald-950 text-white active:scale-95'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t('যোগ হয়েছে', 'Added')}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t('কার্ট', 'Add')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
