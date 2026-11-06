import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiTrash2, FiShoppingBag, FiArrowLeft, FiPlus, FiMinus } from 'react-icons/fi';
import { useCartStore } from '../../store/cartStore';
import { useCurrencyStore } from '../../store/currencyStore';

export default function CartDrawer() {
  const navigate = useNavigate();
  const { items, isOpen, closeCart, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const { formatPrice } = useCurrencyStore();

  if (!isOpen) return null;

  const subtotal = getSubtotal();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-10 sm:pl-16">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* 1. Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-pink-50">
            <div className="flex items-center gap-2">
              <FiShoppingBag className="text-rose-600" size={20} />
              <h2 className="text-base font-bold text-gray-800">
                سلة التسوق ({items.reduce((sum, i) => sum + i.quantity, 0)})
              </h2>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-white transition"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* 2. Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-gray-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center text-rose-300">
                  <FiShoppingBag size={40} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">سلتك فارغة حالياً</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    تصفحي تشكيلتنا الراقية من المكياج والعطور وأضيفي ما يعجبك!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCart}
                  className="bg-rose-600 text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-rose-700 transition shadow-sm"
                >
                  تسوقي الآن
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={`${item.id}-${item.selectedVariant?.id || 'base'}`} className="py-4 flex gap-3 group">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-xl border border-gray-100 shrink-0 bg-gray-50"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-1">
                          {item.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id, item.selectedVariant?.id)}
                          className="text-gray-300 hover:text-rose-600 transition p-1"
                          title="حذف من السلة"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                      {item.selectedVariant && (
                        <span className="text-[11px] text-gray-500 mt-0.5 block">
                          الخيار: {item.selectedVariant.name} - {item.selectedVariant.value}
                        </span>
                      )}
                      <div className="text-rose-700 font-bold text-xs sm:text-sm mt-1">
                        {formatPrice(item.price)}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-full bg-gray-50 px-2 py-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.selectedVariant?.id, item.quantity - 1)
                          }
                          className="p-1 text-gray-500 hover:text-rose-600"
                        >
                          <FiMinus size={12} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.selectedVariant?.id, item.quantity + 1)
                          }
                          className="p-1 text-gray-500 hover:text-rose-600"
                        >
                          <FiPlus size={12} />
                        </button>
                      </div>

                      <span className="text-xs font-extrabold text-gray-700">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 3. Footer with Subtotal & Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-gray-100 bg-gray-50/70 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">المجموع الفرعي:</span>
                <span className="text-base font-extrabold text-rose-800">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                * يتم احتساب رسوم التوصيل وفقاً لمحافظتكِ عند إتمام الطلب.
              </p>
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold py-3 rounded-xl transition shadow-md shadow-rose-200 flex items-center justify-center gap-2 text-sm"
                >
                  <span>متابعة إتمام الطلب</span>
                  <FiArrowLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={closeCart}
                  className="w-full bg-white border border-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-xl hover:bg-gray-100 transition"
                >
                  متابعة التسوق
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
