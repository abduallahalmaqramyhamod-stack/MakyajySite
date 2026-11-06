import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiEye,
  FiCheck,
  FiX,
  FiAlertCircle,
} from 'react-icons/fi';
import { productsAPI, categoriesAPI } from '../../api';
import { useCurrencyStore } from '../../store/currencyStore';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const { formatPrice } = useCurrencyStore();

  const loadProducts = async (page = 1) => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll({
        page,
        limit: 20,
        search: search || undefined,
        category: selectedCat || undefined,
      });
      if (res.success) {
        const prods = Array.isArray(res.data) ? res.data : (res.data?.products || []);
        setProducts(prods);
        setPagination(res.pagination || res.data?.pagination || { currentPage: 1, totalPages: 1, totalItems: prods.length });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    categoriesAPI.getAll().then((res) => {
      if (res.success) setCategories(res.data || []);
    });
    loadProducts(1);
  }, [selectedCat]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts(1);
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await productsAPI.toggleActive(id);
      if (res.success) {
        setActionMsg('تم تغيير حالة المنتج بنجاح');
        setTimeout(() => setActionMsg(''), 3000);
        loadProducts(pagination.currentPage);
      }
    } catch (err) {
      alert(err.message || 'فشل التغيير');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف المنتج: "${name}"؟`)) return;
    try {
      const res = await productsAPI.delete(id);
      if (res.success) {
        setActionMsg('تم حذف المنتج بنجاح');
        setTimeout(() => setActionMsg(''), 3000);
        loadProducts(pagination.currentPage);
      }
    } catch (err) {
      alert(err.message || 'فشل الحذف');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">إدارة المنتجات</h2>
          <p className="text-xs text-gray-500 mt-1">
            إضافة وتعديل وحذف المنتجات وضبط الأسعار والمخزون
          </p>
        </div>

        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition"
        >
          <FiPlus size={16} />
          <span>إضافة منتج جديد</span>
        </Link>
      </div>

      {actionMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
          <FiCheck />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <input
            type="text"
            placeholder="ابحث بالاسم، الكود SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pr-10 pl-4 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
          />
          <FiSearch className="absolute right-3.5 top-3 text-gray-400" size={16} />
        </form>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-rose-500"
        >
          <option value="">جميع الأقسام</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">جاري تحميل المنتجات...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 space-y-2">
            <p className="text-base font-bold text-gray-600">لا توجد منتجات مسجلة</p>
            <p>أضف أول منتج إلى متجرك للبدء في استقبال طلبات العملاء.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4 font-bold">المنتج</th>
                  <th className="py-3.5 px-4 font-bold">القسم / الماركة</th>
                  <th className="py-3.5 px-4 font-bold">السعر</th>
                  <th className="py-3.5 px-4 font-bold">المخزون</th>
                  <th className="py-3.5 px-4 font-bold">الحالة</th>
                  <th className="py-3.5 px-4 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            prod.image_path ||
                            prod.primary_image ||
                            prod.image ||
                            'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&q=80'
                          }
                          alt=""
                          className="w-12 h-12 object-cover rounded-xl border border-gray-100 shrink-0 bg-gray-50"
                        />
                        <div>
                          <h4 className="font-bold text-gray-900 line-clamp-1">{prod.name}</h4>
                          <span className="text-[10px] text-gray-400 font-mono">
                            SKU: {prod.sku || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-gray-800 font-semibold">{prod.category_name || '-'}</div>
                      <div className="text-[10px] text-gray-400">{prod.brand_name || '-'}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-black text-rose-700">{formatPrice(prod.price)}</div>
                      {prod.compare_price > prod.price && (
                        <div className="text-[10px] text-gray-400 line-through">
                          {formatPrice(prod.compare_price)}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`font-black text-[11px] px-2.5 py-0.5 rounded-full ${
                          prod.stock_quantity === 0
                            ? 'bg-rose-100 text-rose-800'
                            : prod.stock_quantity <= (prod.low_stock_threshold || 5)
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {prod.stock_quantity}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(prod.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black transition ${
                          prod.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}
                      >
                        {prod.is_active ? 'نشط في المتجر' : 'معطل'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/products/${prod.slug}`}
                          target="_blank"
                          className="p-1.5 text-gray-400 hover:text-gray-700"
                          title="معاينة في المتجر"
                        >
                          <FiEye size={16} />
                        </Link>
                        <Link
                          to={`/admin/products/edit/${prod.id}`}
                          className="p-1.5 text-blue-500 hover:text-blue-700"
                          title="تعديل المنتج"
                        >
                          <FiEdit size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(prod.id, prod.name)}
                          className="p-1.5 text-rose-400 hover:text-rose-600"
                          title="حذف المنتج"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
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
                onClick={() => loadProducts(pageNum)}
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
