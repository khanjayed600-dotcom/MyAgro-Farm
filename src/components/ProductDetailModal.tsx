/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  ShieldCheck,
  Truck,
  Heart,
  ShoppingBag,
  Check,
  AlertCircle,
  MapPin,
  Calendar,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { Product, Review } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenComplaint: (orderNo?: string) => void;
  onSelectProduct: (p: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenComplaint,
  onSelectProduct,
}) => {
  const { lang, t } = useLanguage();
  const { addToCart, setIsCartDrawerOpen } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Reviews & Related
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.packageSizes[0] || '১ একক');
      setQuantity(1);
      fetchDetails(product.id);
    }
  }, [product]);

  const fetchDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setRelated(data.related || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!product) return null;

  const isLiked = isInWishlist(product.id);
  const displayPrice = product.discountPrice || product.price;

  const handleAddToCart = (openDrawer = true) => {
    if (product.stock <= 0) return;
    addToCart(product, selectedSize, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
    if (openDrawer) {
      onClose();
      setIsCartDrawerOpen(true);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComment.trim()) return;

    setReviewSubmitting(true);
    try {
      const token = localStorage.getItem('myagro_user_token');
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          productId: product.id,
          userName: newReviewName,
          rating: newReviewRating,
          commentBn: newReviewComment,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReviews([data.review, ...reviews]);
        setNewReviewComment('');
        setReviewSuccess(true);
        setTimeout(() => setReviewSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Review submit failed:', err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
            <span className="uppercase tracking-wider">SKU: {product.sku}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-800">{product.categorySlug}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Gallery Left */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                <img
                  src={product.images[0]}
                  alt={product.nameBn}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {product.discountPercent && product.discountPercent > 0 && (
                  <span className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded shadow-xs tabular-nums">
                    {product.discountPercent}% {t('ছাড়', 'OFF')}
                  </span>
                )}
              </div>

              {/* Trust Callouts */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2 text-xs text-stone-600">
                <div className="flex items-center gap-2 font-medium text-stone-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{product.certificationsBn || 'ল্যাব টেস্ট ও বিশুদ্ধতা যাচাইকৃত'}</span>
                </div>
                <div className="flex items-center gap-2 font-medium text-stone-800">
                  <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    {product.deliveryEligibility === 'all_bd'
                      ? t('সারা বাংলাদেশে হোম ডেলিভারি প্রযোজ্য', 'Nationwide delivery available')
                      : t('কুড়িগ্রাম ও রংপুর বিভাগের জন্য প্রযোজ্য', 'Kurigram & Rangpur regions only')}
                  </span>
                </div>
              </div>
            </div>

            {/* Contiguous Purchase Module Right */}
            <div className="space-y-5">
              {/* Origin and Rating */}
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  {lang === 'bn' ? product.farmOriginBn : product.farmOriginEn}
                </span>

                <div className="flex items-center gap-1 text-amber-600 font-semibold">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="tabular-nums">{product.rating}</span>
                  <span className="text-stone-400">({reviews.length} {t('রিভিউ', 'reviews')})</span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
                  {lang === 'bn' ? product.nameBn : product.nameEn}
                </h2>
                <p className="text-stone-600 text-sm mt-2 leading-relaxed">
                  {lang === 'bn' ? product.descriptionBn : product.descriptionEn}
                </p>
              </div>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 py-2 border-y border-stone-100">
                <span className="text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums">
                  ৳{displayPrice}
                </span>
                {product.discountPrice && (
                  <span className="text-base text-stone-400 line-through tabular-nums">
                    ৳{product.price}
                  </span>
                )}
                <span className="text-xs text-emerald-700 font-medium">
                  ({t('ভ্যাট অন্তর্ভুক্ত', 'VAT included')})
                </span>
              </div>

              {/* Package Size Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-700 block">
                  {t('প্যাকেজ সাইজ নির্বাচন করুন:', 'Select Package Size:')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.packageSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        selectedSize === size
                          ? 'border-emerald-800 bg-emerald-800 text-white shadow-xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Harvest / Freshness Info */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl text-xs text-stone-600 border border-stone-200">
                <div>
                  <span className="text-stone-400 block">{t('সংগ্রহের সময়', 'Harvest / Batch')}:</span>
                  <span className="font-semibold text-stone-800">{product.harvestDate || 'তাজা সংগ্রহ'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">{t('মেয়াদকাল', 'Best Before')}:</span>
                  <span className="font-semibold text-stone-800">{product.bestBefore || 'প্যাকেজিং থেকে ৬ মাস'}</span>
                </div>
              </div>

              {/* Stock Indicator */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-stone-600">
                  {t('মজুদ অবস্থা:', 'Stock Status:')}{' '}
                  {product.stock > 0 ? (
                    <span className="text-emerald-700 font-bold">
                      {t(`মজুদ আছে (${product.stock} টি)`, `In Stock (${product.stock})`)}
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold">{t('স্টক শেষ', 'Out of Stock')}</span>
                  )}
                </span>
              </div>

              {/* Quantity Stepper & Buy Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-2 text-stone-600 hover:bg-stone-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 text-sm font-semibold text-stone-900 tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="px-3 py-2 text-stone-600 hover:bg-stone-100 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleAddToCart(true)}
                    disabled={product.stock <= 0}
                    className="flex-1 py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{t('কার্টে যোগ করুন', 'Add to Cart')}</span>
                  </button>

                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="p-3 border border-stone-300 hover:border-rose-400 rounded-lg text-stone-700 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Wishlist"
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'text-rose-600 fill-rose-600' : ''}`} />
                  </button>
                </div>

                {/* Complaint / Issue Action */}
                <div className="pt-2 text-center">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenComplaint();
                    }}
                    className="text-xs text-stone-500 hover:text-emerald-800 underline transition-colors cursor-pointer"
                  >
                    {t('পণ্য সংক্রান্ত অভিযোগ বা পরিবর্তন আবেদন করতে চান?', 'Report an issue or request a return?')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="pt-8 border-t border-stone-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  {t('ক্রেতাদের মতামত ও রিভিউ', 'Customer Reviews')}
                </h3>
                <p className="text-xs text-stone-500">
                  {t('সত্যিকারের ক্রেতাদের অভিজ্ঞতা ও মূল্যায়ন', 'Verified purchaser reviews & ratings')}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-stone-800 font-bold">
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                <span className="text-lg tabular-nums">{product.rating}</span>
                <span className="text-xs text-stone-500 font-normal">/ 5.0</span>
              </div>
            </div>

            {/* Write a Review Box */}
            <form onSubmit={handleSubmitReview} className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                {t('আপনার রিভিউ লিখুন', 'Write a Review')}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder={t('আপনার নাম', 'Your Name')}
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  className="text-xs bg-white border border-stone-300 rounded-lg p-2.5 focus:border-emerald-700 focus:outline-none"
                />

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-stone-600">{t('রেটিং:', 'Rating:')}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewReviewRating(star)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            newReviewRating >= star ? 'fill-amber-500 text-amber-500' : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <textarea
                required
                rows={2}
                placeholder={t('পণ্যের গুণমান ও আপনার অভিজ্ঞতা শেয়ার করুন...', 'Share your honest feedback...')}
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e.target.value)}
                className="w-full text-xs bg-white border border-stone-300 rounded-lg p-2.5 focus:border-emerald-700 focus:outline-none"
              />

              <div className="flex items-center justify-between">
                {reviewSuccess ? (
                  <span className="text-xs text-emerald-700 font-semibold">
                    {t('আপনার রিভিউ সফলভাবে যুক্ত হয়েছে!', 'Review submitted successfully!')}
                  </span>
                ) : (
                  <span className="text-[11px] text-stone-500">
                    {t('সকল রিভিউ মডারেশন শেষে প্রদর্শিত হবে।', 'Reviews are moderated for authentic content.')}
                  </span>
                )}

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {reviewSubmitting ? t('জমা হচ্ছে...', 'Submitting...') : t('রিভিউ জমা দিন', 'Submit Review')}
                </button>
              </div>
            </form>

            {/* Reviews List */}
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-4">
                  {t('এখনও কোনো রিভিউ দেওয়া হয়নি। প্রথম রিভিউটি আপনি দিন!', 'No reviews yet. Be the first to review!')}
                </p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl border border-stone-100 bg-white space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{rev.userName}</span>
                        {rev.verifiedPurchase && (
                          <span className="text-[10px] text-emerald-800 font-medium">
                            ✓ {t('যাচাইকৃত ক্রেতা', 'Verified Buyer')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-stone-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">{rev.commentBn}</p>
                    {rev.adminReply && (
                      <div className="bg-emerald-50 border-l-2 border-emerald-700 p-2.5 rounded text-[11px] text-emerald-950 mt-2">
                        <span className="font-bold block text-emerald-900">
                          {t('মাই এগ্রো ফার্ম উত্তর:', 'MyAgro Farm Response:')}
                        </span>
                        {rev.adminReply}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Related Products */}
          {related.length > 0 && (
            <div className="pt-8 border-t border-stone-200 space-y-4">
              <h3 className="text-base font-bold text-stone-900">
                {t('একই ক্যাটাগরির অন্যান্য পণ্য', 'Related Farm Products')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {related.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectProduct(item)}
                    className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl cursor-pointer transition-colors space-y-2"
                  >
                    <img
                      src={item.images[0]}
                      alt={item.nameBn}
                      className="w-full aspect-square object-cover rounded-lg bg-stone-200"
                    />
                    <h5 className="text-xs font-semibold text-stone-800 line-clamp-1">{item.nameBn}</h5>
                    <div className="text-xs font-bold text-stone-900 tabular-nums">
                      ৳{item.discountPrice || item.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
