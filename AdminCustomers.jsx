import React, { useState, useEffect } from 'react';
import { FiUsers, FiSearch, FiPhone, FiMapPin, FiShoppingBag } from 'react-icons/fi';
import { customersAPI } from '../../api';
import { formatDate } from '../../utils/formatters';
import { useCurrencyStore } from '../../store/currencyStore';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrencyStore();

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await customersAPI.getAll({ search: search || undefined });
      if (res.success && res.data) {
        setCustomers(res.data.customers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCustomers();
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">سجل العملاء</h2>
          <p className="text-xs text-gray-500 mt-1">
            بيانات العملاء الذين قاموا بالطلب من المتجر وإجمالي مشترياتهم
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <input
            type="text"
            placeholder="ابحث باسم العميل أو رقم هاتفه..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pr-10 pl-4 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
          />
          <FiSearch className="absolute right-3.5 top-3 text-gray-400" size={16} />
        </form>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">جاري التحميل...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 space-y-2">
            <FiUsers className="mx-auto text-gray-300" size={36} />
            <p className="text-base font-bold text-gray-700">لا يوجد عملاء مسجلين بعد</p>
            <p>يتم إضافة العملاء تلقائياً بمجرد إتمام أي طلب.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4 font-bold">اسم العميل</th>
                  <th className="py-3.5 px-4 font-bold">رقم الهاتف</th>
                  <th className="py-3.5 px-4 font-bold">المحافظة / العنوان</th>
                  <th className="py-3.5 px-4 font-bold text-center">عدد الطلبات</th>
                  <th className="py-3.5 px-4 font-bold">إجمالي المشتريات</th>
                  <th className="py-3.5 px-4 font-bold">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{c.name}</td>
                    <td className="py-3.5 px-4 font-mono text-gray-600" dir="ltr">
                      {c.phone}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {c.governorate ? `${c.governorate} - ${c.area || ''}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-center">
                      <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full">
                        {c.total_orders || 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-rose-700">
                      {formatPrice(c.total_spent || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                      {formatDate(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
