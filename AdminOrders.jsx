import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPackage,
  FiSearch,
  FiEye,
  FiDownload,
  FiFilter,
  FiClock,
  FiCheck,
} from 'react-icons/fi';
import { ordersAPI } from '../../api';
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG, formatDate } from '../../utils/formatters';
import { useCurrencyStore } from '../../store/currencyStore';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrencyStore();

  const loadOrders = async (page = 1) => {
    setLoading(true);
    try {
      const res = await ordersAPI.getAll({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      if (res.success && res.data) {
        setOrders(res.data.orders || []);
        setPagination(res.data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadOrders(1);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">إدارة الطلبات</h2>
          <p className="text-xs text-gray-500 mt-1">
            متابعة طلبات العملاء، تحديث حالات التجهيز والشحن، وطباعة الفواتير
          </p>
        </div>

        <a
          href={ordersAPI.exportCSV()}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          <FiDownload size={15} />
          <span>تصدير إلى ملف CSV</span>
        </a>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <input
            type="text"
            placeholder="ابحث برقم الطلب، اسم العميل، أو رقم الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pr-10 pl-4 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
          />
          <FiSearch className="absolute right-3.5 top-3 text-gray-400" size={16} />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-rose-500"
        >
          <option value="">جميع حالات الطلبات</option>
          <option value="new">طلب جديد</option>
          <option value="confirmed">مؤكد</option>
          <option value="processing">قيد التجهيز</option>
          <option value="shipped">خرج للتوصيل</option>
          <option value="delivered">مكتمل ومستلم</option>
          <option value="cancelled">ملغي</option>
        </select>
      </div>

      {/* Orders List Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">جاري تحميل قائمة الطلبات...</div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center text-xs text-gray-400 space-y-2">
            <FiPackage className="mx-auto text-gray-300" size={40} />
            <p className="text-base font-bold text-gray-700">لا توجد طلبات تطابق الفلتر</p>
            <p>ستظهر الطلبات الجديدة هنا فور قيام العملاء بالشراء من المتجر.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4 font-bold">رقم الطلب</th>
                  <th className="py-3.5 px-4 font-bold">العميل والهاتف</th>
                  <th className="py-3.5 px-4 font-bold">العنوان والمحافظة</th>
                  <th className="py-3.5 px-4 font-bold">المبلغ الإجمالي</th>
                  <th className="py-3.5 px-4 font-bold">حالة الطلب</th>
                  <th className="py-3.5 px-4 font-bold">الدفع</th>
                  <th className="py-3.5 px-4 font-bold">التاريخ</th>
                  <th className="py-3.5 px-4 font-bold text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                      {order.order_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-800">{order.customer_name}</div>
                      <div className="text-[11px] text-gray-400 font-mono" dir="ltr">
                        {order.customer_phone}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-gray-600">
                      <span className="font-semibold text-gray-800">{order.governorate}</span> - {order.area}
                    </td>

                    <td className="py-3.5 px-4 font-black text-rose-700">
                      {formatPrice(order.total)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          ORDER_STATUS_CONFIG[order.order_status]?.color || 'bg-gray-100'
                        }`}
                      >
                        {ORDER_STATUS_CONFIG[order.order_status]?.label || order.order_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          PAYMENT_STATUS_CONFIG[order.payment_status]?.color || 'bg-gray-100'
                        }`}
                      >
                        {PAYMENT_STATUS_CONFIG[order.payment_status]?.label || order.payment_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                      {formatDate(order.created_at)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white px-3 py-1.5 rounded-xl font-bold transition text-xs"
                      >
                        <FiEye size={13} />
                        <span>معاينة</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex justify-center items-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => loadOrders(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                  pageNum === pagination.currentPage
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
