import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiDollarSign,
  FiShoppingBag,
  FiPackage,
  FiUsers,
  FiAlertTriangle,
  FiArrowLeft,
  FiEye,
  FiPlus,
} from 'react-icons/fi';
import { dashboardAPI } from '../../api';
import { ORDER_STATUS_CONFIG, formatDate } from '../../utils/formatters';
import { useCurrencyStore } from '../../store/currencyStore';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrencyStore();

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await dashboardAPI.getStats();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-white rounded-3xl animate-pulse border border-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentOrders = data?.recent_orders || [];
  const lowStock = data?.low_stock_products || [];

  return (
    <div className="space-y-8 font-sans">
      {/* Header & Quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">نظرة عامة على المتجر</h2>
          <p className="text-xs text-gray-500 mt-1">
            إحصائيات المبيعات، الطلبات، المخزون، ونشاط المتجر المباشر
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <FiPlus size={16} />
            <span>إضافة منتج جديد</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sales */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400">إجمالي المبيعات</span>
            <div className="text-2xl font-black text-gray-900 mt-1">
              {formatPrice(stats.total_sales || 0)}
            </div>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
              من {stats.total_orders || 0} طلب
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FiDollarSign size={24} />
          </div>
        </div>

        {/* New Orders */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400">الطلبات الجديدة</span>
            <div className="text-2xl font-black text-rose-700 mt-1">
              {stats.new_orders || 0}
            </div>
            <span className="text-[11px] text-rose-500 font-bold mt-1 block">
              بحاجة للتأكيد والشحن
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <FiPackage size={24} />
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400">المنتجات النشطة</span>
            <div className="text-2xl font-black text-gray-900 mt-1">
              {stats.total_products || 0}
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              {stats.low_stock_count || 0} منخفض المخزون
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FiShoppingBag size={24} />
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400">إجمالي العملاء</span>
            <div className="text-2xl font-black text-gray-900 mt-1">
              {stats.total_customers || 0}
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              قاعدة عملاء متنامية
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FiUsers size={24} />
          </div>
        </div>
      </div>

      {/* Two columns: Recent Orders & Low Stock alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-extrabold text-base text-gray-900">أحدث الطلبات</h3>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
            >
              <span>عرض كل الطلبات</span>
              <FiArrowLeft size={13} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-center py-8 text-xs text-gray-400">لا توجد طلبات بعد</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="pb-3 font-semibold">رقم الطلب</th>
                    <th className="pb-3 font-semibold">العميل</th>
                    <th className="pb-3 font-semibold">المبلغ</th>
                    <th className="pb-3 font-semibold">الحالة</th>
                    <th className="pb-3 font-semibold">التاريخ</th>
                    <th className="pb-3 font-semibold">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 font-mono font-bold text-gray-800">
                        {ord.order_number}
                      </td>
                      <td className="py-3 font-semibold text-gray-800">{ord.customer_name}</td>
                      <td className="py-3 font-extrabold text-rose-700">
                        {formatPrice(ord.total)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            ORDER_STATUS_CONFIG[ord.order_status]?.color || 'bg-gray-100'
                          }`}
                        >
                          {ORDER_STATUS_CONFIG[ord.order_status]?.label || ord.order_status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 text-[11px]">
                        {formatDate(ord.created_at)}
                      </td>
                      <td className="py-3">
                        <Link
                          to={`/admin/orders/${ord.id}`}
                          className="p-1.5 text-gray-400 hover:text-rose-600 inline-block"
                          title="عرض التفاصيل"
                        >
                          <FiEye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Alerts (1 col) */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
              <FiAlertTriangle className="text-amber-500" />
              <span>تنبيهات المخزون</span>
            </h3>
            <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full">
              {lowStock.length}
            </span>
          </div>

          {lowStock.length === 0 ? (
            <p className="text-center py-8 text-xs text-gray-400">
              جميع المنتجات متوفرة بكميات كافية 👍
            </p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <h4 className="font-bold text-gray-800 line-clamp-1">{prod.name}</h4>
                    <span className="text-[11px] text-gray-500">{formatPrice(prod.price)}</span>
                  </div>
                  <div className="text-left">
                    <span
                      className={`font-black text-xs px-2.5 py-1 rounded-full ${
                        prod.stock_quantity === 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {prod.stock_quantity === 0 ? 'نفذت' : `متبقي ${prod.stock_quantity}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
