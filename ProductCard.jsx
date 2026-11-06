import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingBag, FiEye, FiCheck } from 'react-icons/fi';
import { useCartStore } from '../../store/cartStore';
import { useCurrencyStore } from '../../store/currencyStore';

export default function ProductCard({ product }) {
  const addItem = useCartStore((state) => state.addItem);
  const { formatPrice } = useCurrencyStore();

  const primaryImage =
    product.image_path ||
    product.primary_image ||
    product.images?.[0]?.image_path ||
    product.image ||
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80';

  const hasDiscount = product.compare_price && Number(product.compare_price) > Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  const isOutOfStock = product.stock_quantity <= 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addItem(product, 1);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-rose-100/80 shadow-xs hover:shadow-xl hover:border-rose-200 transition-all duration-300 flex flex-col overflow-hidden relative font-sans">
      {/* Badges */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        {hasDiscount && (
          <span className="bg-rose-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
            خصم {discountPercent}%
          </span>
        )}
        {product.is_new === 1 && (
          <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
            جديد
          </span>
        )}
        {product.is_featured === 1 && !hasDiscount && (
          <span className="bg-amber-500 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
            مميز
          </span>
        )}
      </div>

      {/* Image container */}
      <Link
        to={`/products/${product.slug}`}
        className="block relative aspect-square bg-gray-50 overflow-hidden"
      >
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-white text-gray-900 text-xs font-bold px-3 py-1 rounded-full shadow">
              نفذت الكمية
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium mb-1.5">
            <span>{product.brand_name || 'أصلي'}</span>
            <span>{product.category_name}</span>
          </div>

          {/* Product Name */}
          <Link
            to={`/products/${product.slug}`}
            className="block text-sm font-bold text-gray-800 hover:text-rose-600 transition line-clamp-2 leading-snug mb-2"
          >
            {product.name}
          </Link>
        </div>

        <div>
          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-base sm:text-lg font-black text-rose-700">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.compare_price)}
              </span>
            )}
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 shadow-xs'
            }`}
          >
            <FiShoppingBag size={14} />
            <span>{isOutOfStock ? 'غير متوفر' : 'أضيفي للسلة'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
