import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiPackage, FiCheck, FiTruck, FiClock, FiAlertCircle } from 'react-icons/fi';
import { ordersAPI } from '../../api';
import { ORDER_STATUS_CONFIG, formatDate } from '../../utils/formatters';
import { useCurrencyStore } from '../../store/currencyStore';

const STATUS_STEPS = [
  { key: 'new', label: 'تم استلام الطلب', icon: FiPackage },
  { key: 'confirmed', label: 'تم التأكيد', icon: FiCheck },
  { key: 'processing', label: 'قيد التجهيز والتغليف', icon: FiClock },
  { key: 'shipped', label: 'خرج للتوصيل مع المندوب', icon: FiTruck },
  { key: 'delivered', label: 'تم الاستلام بنجاح', icon: FiCheck },
];

export default function OrderTrackingPage() {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('num') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { formatPrice } = useCurrencyStore();

  const handleTrack = async (numToSearch) => {
    const num = numToSearch || orderNumber;
    if (!num.trim()) {
      setErrorMsg('يرجى كتابة رقم الطلب');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setOrder(null);

    try {
      const res = await ordersAPI.track(num.trim());
      if (res.success && res.data) {
        setOrder(res.data.order);
      } else {
        setErrorMsg('لم يتم العثور على طلب بهذا الرقم. يرجى التحقق من الرقم والمحاولة مجدداً.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'تعذر العثور على الطلب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialNum = searchParams.get('num');
    if (initialNum) {
      setOrderNumber(initialNum);
      handleTrack(initialNum);
    }
  }, [searchParams]);

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    const s = order.order_status;
    if (s === 'cancelled' || s === 'returned') return -1;
    return STATUS_STEPS.findIndex((step) => step.key === s);
  };

  const currentStep = getCurrentStepIndex();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-xl mx-auto">
        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">
          خدمة التتبع المباشر
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
          تتبعي حالة ومسار طلبكِ
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          أدخلي رقم الطلب الذي استلمتِه لمشاهدة خطوة التجهيز والتوصيل الحالية
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="مثال: MKP-20261104-1234"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pr-10 pl-4 text-xs sm:text-sm font-mono text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
            />
            <FiSearch className="absolute right-3.5 top-3.5 text-gray-400" size={18} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm px-8 py-3 rounded-2xl transition shadow-md shadow-rose-200 disabled:opacity-50"
          >
            {loading ? 'جاري البحث...' : 'تتبع الطلب'}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 bg-rose-50 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
            <FiAlertCircle className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Order Tracking Result View */}
      {order && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-md space-y-8 animate-fadeIn">
          {/* Top Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
            <div>
              <span className="text-xs text-gray-400 font-semibold">رقم الطلب:</span>
              <h2 className="text-xl font-black font-mono text-gray-900">
                {order.order_number}
              </h2>
              <span className="text-xs text-gray-500">
                تاريخ الطلب: {formatDate(order.created_at)}
              </span>
            </div>

            <div className="text-left sm:text-right">
              <span
                className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-black border ${
                  ORDER_STATUS_CONFIG[order.order_status]?.color || 'bg-gray-100 text-gray-800'
                }`}
              >
                {ORDER_STATUS_CONFIG[order.order_status]?.label || order.order_status}
              </span>
            </div>
          </div>

          {/* Timeline progress steps */}
          {order.order_status !== 'cancelled' ? (
            <div className="py-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {STATUS_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = currentStep >= idx;
                  const isCurrent = currentStep === idx;

                  return (
                    <div
                      key={step.key}
                      className={`flex flex-col items-center text-center p-3 rounded-2xl border transition ${
                        isCurrent
                          ? 'border-rose-600 bg-rose-50/70 shadow-xs'
                          : isDone
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-gray-100 bg-gray-50/50 opacity-50'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-xs ${
                          isDone ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <span className="text-xs font-black text-gray-800 leading-tight">
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-center text-rose-800 text-xs font-bold">
              هذا الطلب ملغي. إذا كان لديك أي استفسار، يرجى التواصل مع خدمة العملاء.
            </div>
          )}

          {/* Customer & Destination Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 text-xs text-gray-600">
            <div className="space-y-1">
              <span className="text-gray-400 font-semibold">المستلم:</span>
              <p className="font-bold text-gray-800 text-sm">{order.customer_name}</p>
              <p>{order.governorate} - {order.area}</p>
            </div>
            <div className="space-y-1 sm:text-left">
              <span className="text-gray-400 font-semibold">المبلغ الإجمالي للدفع عند الاستلام:</span>
              <p className="font-black text-rose-700 text-lg">{formatPrice(order.total)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
