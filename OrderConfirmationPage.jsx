import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { FiCheckCircle, FiPackage, FiPhone, FiArrowLeft, FiClock, FiMapPin } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { ordersAPI } from '../../api';
import { useCurrencyStore } from '../../store/currencyStore';

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);
  const { formatPrice } = useCurrencyStore();

  useEffect(() => {
    if (!order && orderNumber) {
      setLoading(true);
      ordersAPI
        .track(orderNumber)
        .then((res) => {
          if (res.success && res.data) {
            setOrder(res.data.order);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [order, orderNumber]);

  const sendWhatsAppConfirmation = () => {
    if (!order) return;
    const msg = `مرحباً، أود متابعة طلبي رقم: ${order.order_number || orderNumber} في متجر مكياجي – منبع الجمال، باسم: ${order.customer_name}.`;
    window.open(`https://wa.me/967771496283?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 font-sans">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-rose-100 shadow-xl text-center space-y-6">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <FiCheckCircle size={48} />
        </div>

        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
            تم استلام طلبكِ بنجاح!
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            شكراً لتسوقكِ من متجر مكياجي
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            سيقوم فريق خدمة العملاء بالتواصل معكِ هاتفياً أو عبر واتساب لتأكيد موعد التوصيل.
          </p>
        </div>

        {/* Order Number Box */}
        <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-4 max-w-sm mx-auto space-y-1">
          <span className="text-xs text-gray-500 font-semibold">رقم الطلب الفريد:</span>
          <div className="text-lg font-black font-mono text-rose-800 tracking-wider">
            {order?.order_number || orderNumber}
          </div>
        </div>

        {/* Details preview */}
        {order && (
          <div className="text-right border-t border-gray-100 pt-6 space-y-3 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>اسم العميل:</span>
              <span className="font-bold text-gray-800">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span>العنوان:</span>
              <span className="font-bold text-gray-800">
                {order.governorate} - {order.area}
              </span>
            </div>
            <div className="flex justify-between">
              <span>طريقة الدفع:</span>
              <span className="font-bold text-emerald-700">الدفع نقداً عند الاستلام</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-2 border-t border-gray-100 text-gray-900">
              <span>المبلغ الإجمالي:</span>
              <span className="text-rose-700">{formatPrice(order.total)}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={sendWhatsAppConfirmation}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full flex items-center justify-center gap-2 transition shadow-md shadow-emerald-200"
          >
            <FaWhatsapp size={18} />
            <span>تأكيد ومتابعة عبر واتساب</span>
          </button>

          <Link
            to={`/order-tracking?num=${order?.order_number || orderNumber}`}
            className="w-full sm:w-auto bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 font-bold text-xs sm:text-sm px-6 py-3 rounded-full flex items-center justify-center gap-2 transition"
          >
            <FiClock size={16} />
            <span>تتبع مسار الطلب</span>
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold text-xs sm:text-sm px-6 py-3 rounded-full transition"
          >
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
