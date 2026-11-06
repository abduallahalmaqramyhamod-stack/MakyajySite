import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiShoppingBag, FiArrowLeft, FiPlus, FiMinus, FiShield, FiTruck } from 'react-icons/fi';
import { useCartStore } from '../../store/cartStore';
import { useCurrencyStore } from '../../store/currencyStore';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, getSubtotal } = useCartStore();
  const { formatPrice } = useCurrencyStore();

  const subtotal = getSubtotal();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center font-sans">
        <div className="w-24 h-24 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <FiShoppingBag size={48} />
        </div>
        <h1 className="text-2xl font-black text-gray-800">سلة التسوق فارغة</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-sm mx-auto">
          لم تقومي بإضافة أي منتجات إلى سلتك بعد. تصفحي أقسام المتجر واستمتعي بأقوى العروض.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 mt-6 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm px-8 py-3.5 rounded-full shadow-lg shadow-rose-200 transition"
        >
          <span>تصفحي المنتجات الآن</span>
          <FiArrowLeft />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      <div className="flex items-center justify-between pb-6 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          سلة التسوق ({items.reduce((s, i) => s + i.quantity, 0)})
        </h1>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-rose-600 hover:underline font-bold"
        >
          إفراغ السلة
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-8">
        {/* Items Table */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.id}-${item.selectedVariant?.id || 'base'}`}
              className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center gap-4 group"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-24 h-24 object-cover rounded-2xl border border-gray-100 shrink-0 bg-gray-50"
              />

              <div className="flex-1 text-center sm:text-right space-y-1">
                <Link
                  to={`/products/${item.slug}`}
                  className="font-bold text-sm text-gray-800 hover:text-rose-600 transition"
                >
                  {item.name}
                </Link>
                {item.selectedVariant && (
                  <div className="text-xs text-gray-400">
                    الخيار: {item.selectedVariant.name} - {item.selectedVariant.value}
                  </div>
                )}
                <div className="text-xs font-bold text-rose-700 pt-1">
                  سعر القطعة: {formatPrice(item.price)}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center border border-gray-200 rounded-full px-3 py-1 bg-gray-50">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.selectedVariant?.id, item.quantity - 1)}
                  className="p-1 text-gray-500 hover:text-rose-600"
                >
                  <FiMinus size={13} />
                </button>
                <span className="w-10 text-center text-xs font-black text-gray-800">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.selectedVariant?.id, item.quantity + 1)}
                  className="p-1 text-gray-500 hover:text-rose-600"
                >
                  <FiPlus size={13} />
                </button>
              </div>

              {/* Total Item Price & Remove */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                <span className="text-sm font-black text-gray-900">
                  {formatPrice(item.price * item.quantity)}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id, item.selectedVariant?.id)}
                  className="text-gray-300 hover:text-rose-600 p-1 transition"
                  title="حذف"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Card */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md space-y-4">
            <h2 className="font-extrabold text-base text-gray-900 pb-3 border-b border-gray-100">
              ملخص الطلب
            </h2>

            <div className="space-y-2.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-bold text-gray-800">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>رسوم التوصيل:</span>
                <span className="text-[11px] font-semibold text-rose-600">
                  تُحسب في الخطوة التالية
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
              <span className="font-extrabold text-sm text-gray-900">الإجمالي التقديري:</span>
              <span className="font-black text-xl text-rose-700">{formatPrice(subtotal)}</span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg shadow-rose-200 transition flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <span>متابعة إتمام الطلب</span>
              <FiArrowLeft size={16} />
            </button>
          </div>

          {/* Guarantees */}
          <div className="bg-rose-50/60 p-5 rounded-3xl border border-rose-100 space-y-3 text-xs text-rose-950">
            <div className="flex items-center gap-2">
              <FiTruck className="text-rose-600" size={16} />
              <span>توصيل لجميع المحافظات اليمنية</span>
            </div>
            <div className="flex items-center gap-2">
              <FiShield className="text-rose-600" size={16} />
              <span>الدفع نقداً عند استلام ومعاينة الطلب</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
