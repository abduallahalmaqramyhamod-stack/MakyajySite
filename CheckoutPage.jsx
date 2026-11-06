import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiCheckCircle,
  FiShoppingBag,
  FiTruck,
  FiUser,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiAlertCircle,
  FiShield,
} from 'react-icons/fi';
import { useCartStore } from '../../store/cartStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { shippingAPI, ordersAPI } from '../../api';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { formatPrice, currentCurrency, exchangeRate } = useCurrencyStore();

  const [shippingRates, setShippingRates] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    governorate: '',
    area: '',
    address_detail: '',
    notes: '',
  });

  const [selectedShippingFee, setSelectedShippingFee] = useState(0);
  const [estimatedDays, setEstimatedDays] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const subtotal = getSubtotal();

  useEffect(() => {
    // If cart is empty, redirect
    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    // Fetch shipping rates
    shippingAPI
      .getAll()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setShippingRates(res.data);
          // Auto select first governorate
          if (res.data.length > 0) {
            const first = res.data[0];
            setFormData((prev) => ({ ...prev, governorate: first.governorate }));
            setSelectedShippingFee(Number(first.fee) || 0);
            setEstimatedDays(first.estimated_days || '');
          }
        }
      })
      .catch((err) => console.warn('Could not fetch shipping rates:', err));
  }, [items.length, navigate]);

  const handleGovernorateChange = (govName) => {
    const rate = shippingRates.find((r) => r.governorate === govName);
    setFormData((prev) => ({ ...prev, governorate: govName }));
    if (rate) {
      setSelectedShippingFee(Number(rate.fee) || 0);
      setEstimatedDays(rate.estimated_days || '');
    } else {
      setSelectedShippingFee(0);
      setEstimatedDays('');
    }
  };

  const total = subtotal + selectedShippingFee;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Form validation
    if (!formData.customer_name.trim()) {
      setErrorMsg('يرجى إدخال اسم المستلم كاملاً');
      return;
    }

    if (!formData.customer_phone.trim()) {
      setErrorMsg('يرجى إدخال رقم الهاتف للتواصل وتأكيد الطلب');
      return;
    }

    if (!formData.governorate) {
      setErrorMsg('يرجى اختيار المحافظة لتحديد رسوم وموعد التوصيل');
      return;
    }

    if (!formData.area.trim()) {
      setErrorMsg('يرجى تحديد المنطقة أو المديرية');
      return;
    }

    if (!formData.address_detail.trim()) {
      setErrorMsg('يرجى كتابة العنوان التفصيلي (الشارع، المعلم الأقرب)');
      return;
    }

    setLoading(true);

    try {
      // Prepare order payload
      const orderPayload = {
        customer_name: formData.customer_name.trim(),
        customer_phone: formData.customer_phone.trim(),
        customer_email: formData.customer_email.trim() || undefined,
        governorate: formData.governorate,
        area: formData.area.trim(),
        address_detail: formData.address_detail.trim(),
        notes: formData.notes.trim() || undefined,
        payment_method: 'cash_on_delivery',
        currency: currentCurrency,
        exchange_rate: currentCurrency === 'USD' ? exchangeRate : 1,
        items: items.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          product_sku: item.sku,
          variant_info: item.selectedVariant
            ? `${item.selectedVariant.name}: ${item.selectedVariant.value}`
            : null,
          quantity: item.quantity,
          unit_price: item.price,
        })),
      };

      const res = await ordersAPI.create(orderPayload);

      if (res.success && res.data) {
        clearCart();
        const orderNumber = res.data.order_number || res.data.id;
        navigate(`/order-confirmation/${orderNumber}`, { state: { order: res.data } });
      } else {
        setErrorMsg(res.message || 'تعذر تأكيد الطلب. يرجى المحاولة لاحقاً');
      }
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إتمام الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">
          خطوة واحدة تفصلكِ عن استلام طلبكِ
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
          إتمام الطلب وتأكيد البيانات
        </h1>
      </div>

      {errorMsg && (
        <div className="max-w-4xl mx-auto mb-8 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold">
          <FiAlertCircle className="shrink-0 text-rose-600" size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Customer and Delivery Info Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details Box */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <FiUser className="text-rose-600" />
              <span>معلومات المستلم</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  الاسم الكامل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سارة محمد الشرجبي"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  رقم الهاتف (واتساب / اتصال) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="77XXXXXXX"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white text-right transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  البريد الإلكتروني (اختياري)
                </label>
                <input
                  type="email"
                  dir="ltr"
                  placeholder="example@mail.com"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white text-right transition"
                />
              </div>
            </div>
          </div>

          {/* Delivery Address Box */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <FiMapPin className="text-rose-600" />
              <span>عنوان التوصيل</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  المحافظة <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.governorate}
                  onChange={(e) => handleGovernorateChange(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-rose-500 focus:bg-white transition"
                >
                  {shippingRates.map((r) => (
                    <option key={r.id} value={r.governorate}>
                      {r.governorate} ({formatPrice(r.fee)})
                    </option>
                  ))}
                </select>
                {estimatedDays && (
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    المدة التقديرية للشحن: {estimatedDays}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  المديرية / المنطقة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: التربة، الشمايتين، المسبح..."
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  العنوان التفصيلي (الشارع، المعلم الأقرب، المنزل) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الشارع العام، بجوار مستشفى خليفة، منزل رقم 12"
                  value={formData.address_detail}
                  onChange={(e) => setFormData({ ...formData, address_detail: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  ملاحظات إضافية للتوصيل (اختياري)
                </label>
                <textarea
                  rows="2"
                  placeholder="أي تعليمات خاصة للمندوب عند التوصيل..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <FiShield className="text-rose-600" />
              <span>طريقة الدفع</span>
            </h2>

            <div className="border-2 border-rose-600 bg-rose-50/50 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-4 border-rose-600 bg-white" />
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-gray-900">
                    الدفع نقدًا عند الاستلام (COD)
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    افحصي منتجاتك وتأكدي من جودتها ثم ادفعي للمندوب نقدًا
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-rose-600 text-white px-2.5 py-1 rounded-full">
                آمن 100%
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md space-y-4 sticky top-24">
            <h2 className="font-extrabold text-base text-gray-900 pb-3 border-b border-gray-100">
              مراجعة الطلب ({items.reduce((s, i) => s + i.quantity, 0)})
            </h2>

            {/* Items mini list */}
            <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-gray-50 pr-1">
              {items.map((item) => (
                <div key={`${item.id}-${item.selectedVariant?.id || 'base'}`} className="pt-2 flex items-center gap-3 text-xs">
                  <img
                    src={item.image}
                    alt=""
                    className="w-12 h-12 object-cover rounded-xl border border-gray-100 shrink-0"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 line-clamp-1">{item.name}</h4>
                    <span className="text-[11px] text-gray-400">
                      {item.quantity} × {formatPrice(item.price)}
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Cost Breakdown */}
            <div className="pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-bold text-gray-800">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>رسوم التوصيل ({formData.governorate || 'المحافظة'}):</span>
                <span className="font-bold text-gray-800">{formatPrice(selectedShippingFee)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-gray-100 flex justify-between items-baseline">
              <span className="font-black text-sm text-gray-900">المبلغ الإجمالي:</span>
              <span className="font-black text-2xl text-rose-700">{formatPrice(total)}</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-600 via-rose-700 to-pink-700 hover:from-rose-700 hover:to-pink-800 text-white font-black py-4 px-4 rounded-2xl shadow-lg shadow-rose-200 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <span>جاري إرسال طلبكِ...</span>
              ) : (
                <>
                  <FiCheckCircle size={18} />
                  <span>تأكيد الطلب الآن</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
