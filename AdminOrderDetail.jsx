import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiPrinter,
  FiUser,
  FiMapPin,
  FiPhone,
  FiCalendar,
  FiCheck,
  FiPackage,
  FiDollarSign,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { ordersAPI } from '../../api';
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG, formatDate } from '../../utils/formatters';
import { useCurrencyStore } from '../../store/currencyStore';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const { formatPrice } = useCurrencyStore();

  const loadOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getById(id);
      if (res.success && res.data) {
        setOrder(res.data.order);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetail();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const res = await ordersAPI.updateStatus(id, { status: newStatus });
      if (res.success) {
        setFeedbackMsg('تم تحديث حالة الطلب بنجاح');
        loadOrderDetail();
        setTimeout(() => setFeedbackMsg(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'فشل التحديث');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePaymentChange = async (newPayment) => {
    setStatusUpdating(true);
    try {
      const res = await ordersAPI.updatePayment(id, { payment_status: newPayment });
      if (res.success) {
        setFeedbackMsg('تم تحديث حالة الدفع بنجاح');
        loadOrderDetail();
        setTimeout(() => setFeedbackMsg(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'فشل التحديث');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-gray-400">جاري تحميل تفاصيل الطلب...</div>;
  }

  if (!order) {
    return (
      <div className="p-12 text-center text-xs text-gray-500">
        <p className="text-base font-bold">الطلب غير موجود</p>
        <Link to="/admin/orders" className="text-rose-600 hover:underline mt-2 inline-block">
          العودة للطلبات
        </Link>
      </div>
    );
  }

  const cleanPhone = order.customer_phone?.replace(/[^0-9]/g, '');

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      {/* Top action bar (hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            <FiArrowRight size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <span>طلب رقم:</span>
              <span className="font-mono text-rose-700">{order.order_number}</span>
            </h2>
            <span className="text-xs text-gray-400">
              تاريخ التسجيل: {formatDate(order.created_at)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <FiPrinter size={15} />
            <span>طباعة الفاتورة</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="no-print bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
          <FiCheck />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Status Controls Box (hidden on print) */}
      <div className="no-print bg-white p-5 rounded-3xl border border-gray-100 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            تحديث حالة مسار الطلب:
          </label>
          <select
            value={order.order_status}
            disabled={statusUpdating}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-rose-500"
          >
            <option value="new">طلب جديد (New)</option>
            <option value="confirmed">تم التأكيد (Confirmed)</option>
            <option value="processing">قيد التجهيز والتغليف (Processing)</option>
            <option value="shipped">خرج للتوصيل مع المندوب (Shipped)</option>
            <option value="delivered">مكتمل ومستلم (Delivered)</option>
            <option value="cancelled">ملغي (Cancelled)</option>
            <option value="returned">مرتجع (Returned)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            تحديث حالة الدفع:
          </label>
          <select
            value={order.payment_status}
            disabled={statusUpdating}
            onChange={(e) => handlePaymentChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-rose-500"
          >
            <option value="pending">قيد الانتظار (عند الاستلام)</option>
            <option value="paid">تم التحصيل والدفع بنجاح</option>
            <option value="failed">فشل التحصيل</option>
            <option value="refunded">مسترجع</option>
          </select>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-sm space-y-8">
        {/* Invoice Header */}
        <div className="flex justify-between items-start pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold">
                💄
              </div>
              <h1 className="text-xl font-extrabold text-gray-900">مكياجي – منبع الجمال</h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              اليمن – تعز – التربة – المركز التجاري الأمين
            </p>
            <p className="text-xs text-gray-500" dir="ltr">+967 771 496 283</p>
          </div>

          <div className="text-left">
            <span className="text-xs font-bold text-gray-400 block">فاتورة طلب مبيعات</span>
            <span className="font-mono font-black text-lg text-rose-800 block">
              {order.order_number}
            </span>
            <span className="text-xs text-gray-400 block mt-1">
              {formatDate(order.created_at)}
            </span>
          </div>
        </div>

        {/* Customer Information Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-gray-700">
          <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
            <h4 className="font-extrabold text-gray-900 flex items-center gap-2 text-xs">
              <FiUser className="text-rose-600" />
              <span>بيانات العميل المستلم</span>
            </h4>
            <p className="font-bold text-sm text-gray-800">{order.customer_name}</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-600" dir="ltr">{order.customer_phone}</span>
              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone.startsWith('967') ? cleanPhone : '967' + cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="no-print inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full hover:bg-emerald-100"
                >
                  <FaWhatsapp />
                  <span>واتساب</span>
                </a>
              )}
            </div>
            {order.customer_email && <p className="text-gray-500">{order.customer_email}</p>}
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
            <h4 className="font-extrabold text-gray-900 flex items-center gap-2 text-xs">
              <FiMapPin className="text-rose-600" />
              <span>عنوان وطريقة التوصيل</span>
            </h4>
            <p className="font-bold text-gray-800">{order.governorate} - {order.area}</p>
            <p className="text-gray-600">{order.address_detail}</p>
            {order.notes && (
              <p className="text-amber-700 bg-amber-50 p-2 rounded-xl text-[11px] font-medium">
                ملاحظة العميل: {order.notes}
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 font-bold">#</th>
                <th className="py-3 px-4 font-bold">المنتج / الصنف</th>
                <th className="py-3 px-4 font-bold">الخيار</th>
                <th className="py-3 px-4 font-bold text-center">الكمية</th>
                <th className="py-3 px-4 font-bold">سعر الوحدة</th>
                <th className="py-3 px-4 font-bold">المجموع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items &&
                order.items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-gray-800">{item.product_name}</td>
                    <td className="py-3 px-4 text-gray-500">{item.variant_info || '-'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-center">{item.quantity}</td>
                    <td className="py-3 px-4">{formatPrice(item.unit_price)}</td>
                    <td className="py-3 px-4 font-black text-gray-900">
                      {formatPrice(item.total_price)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>المجموع الفرعي:</span>
              <span className="font-bold text-gray-800">{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>الخصم:</span>
                <span className="font-bold">-{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>رسوم التوصيل ({order.governorate}):</span>
              <span className="font-bold text-gray-800">{formatPrice(order.shipping_fee)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-rose-800 pt-2 border-t border-gray-200">
              <span>المبلغ الإجمالي للدفع:</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            <div className="text-[11px] text-gray-400 text-left pt-1">
              طريقة الدفع: الدفع نقدًا عند الاستلام
            </div>
          </div>
        </div>

        {/* Invoice Footer note */}
        <div className="pt-8 border-t border-gray-100 text-center text-xs text-gray-400 space-y-1">
          <p className="font-bold text-gray-600">شكراً لتسوقكِ من متجر مكياجي – منبع الجمال</p>
          <p>لأي استفسار يرجى التواصل هاتفياً أو عبر واتساب: 771496283</p>
        </div>
      </div>
    </div>
  );
}
