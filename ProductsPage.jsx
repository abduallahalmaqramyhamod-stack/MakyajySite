import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiX, FiSearch, FiSliders } from 'react-icons/fi';
import ProductCard from '../../components/store/ProductCard';
import { productsAPI, categoriesAPI, brandsAPI } from '../../api';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filters state from URL params
  const categoryParam = searchParams.get('category') || '';
  const brandParam = searchParams.get('brand') || '';
  const searchParam = searchParams.get('search') || '';
  const onSaleParam = searchParams.get('on_sale') || '';
  const featuredParam = searchParams.get('featured') || '';
  const isNewParam = searchParams.get('is_new') || '';
  const sortParam = searchParams.get('sort') || 'created_at';
  const orderParam = searchParams.get('order') || 'desc';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    // Load categories and brands for sidebar
    categoriesAPI.getAll({ include_count: 1 }).then((res) => {
      if (res.success) setCategories(res.data || []);
    });
    brandsAPI.getAll().then((res) => {
      if (res.success) setBrands(res.data || []);
    });
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const query = {
          page: pageParam,
          limit: 12,
          category: categoryParam || undefined,
          brand: brandParam || undefined,
          search: searchParam || undefined,
          on_sale: onSaleParam || undefined,
          featured: featuredParam || undefined,
          is_new: isNewParam || undefined,
          sort: sortParam,
          order: orderParam,
        };
        const res = await productsAPI.getAll(query);
        if (res.success) {
          const prods = Array.isArray(res.data) ? res.data : (res.data?.products || []);
          setProducts(prods);
          setPagination(res.pagination || res.data?.pagination || { currentPage: 1, totalPages: 1, totalItems: prods.length });
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [categoryParam, brandParam, searchParam, onSaleParam, featuredParam, isNewParam, sortParam, orderParam, pageParam]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1'); // reset page on filter change
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {searchParam
              ? `نتائج البحث عن: "${searchParam}"`
              : onSaleParam
              ? 'العروض والخصومات'
              : 'جميع مستحضرات التجميل والعطور'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            عرض {pagination.totalItems} منتج
          </p>
        </div>

        {/* Sort & Mobile filter button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-xl text-xs font-bold"
          >
            <FiSliders size={14} />
            <span>الفلترة والترتيب</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 whitespace-nowrap">الترتيب حسب:</span>
            <select
              value={`${sortParam}-${orderParam}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                const next = new URLSearchParams(searchParams);
                next.set('sort', sort);
                next.set('order', order);
                setSearchParams(next);
              }}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-rose-500"
            >
              <option value="created_at-desc">الأحدث إضافة</option>
              <option value="price-asc">السعر: من الأقل للأعلى</option>
              <option value="price-desc">السعر: من الأعلى للأقل</option>
              <option value="views-desc">الأكثر مشاهدة</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden md:block space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                <FiFilter className="text-rose-600" />
                <span>تصفية النتائج</span>
              </h3>
              {(categoryParam || brandParam || onSaleParam || searchParam) && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[11px] text-rose-600 hover:underline font-bold"
                >
                  إعادة ضبط
                </button>
              )}
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 mb-2.5">الأقسام</h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => updateParam('category', '')}
                  className={`w-full text-right text-xs py-1.5 px-2.5 rounded-lg transition flex justify-between ${
                    !categoryParam ? 'bg-rose-50 text-rose-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>جميع الأقسام</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => updateParam('category', String(cat.id))}
                    className={`w-full text-right text-xs py-1.5 px-2.5 rounded-lg transition flex justify-between ${
                      categoryParam === String(cat.id)
                        ? 'bg-rose-50 text-rose-700 font-bold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat.product_count !== undefined && (
                      <span className="text-gray-400 text-[10px]">({cat.product_count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-700 mb-2.5">الماركات</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => updateParam('brand', '')}
                  className={`w-full text-right text-xs py-1.5 px-2.5 rounded-lg transition ${
                    !brandParam ? 'bg-rose-50 text-rose-700 font-bold' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  جميع الماركات
                </button>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => updateParam('brand', String(b.id))}
                    className={`w-full text-right text-xs py-1.5 px-2.5 rounded-lg transition ${
                      brandParam === String(b.id)
                        ? 'bg-rose-50 text-rose-700 font-bold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Special toggles */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={onSaleParam === '1'}
                  onChange={(e) => updateParam('on_sale', e.target.checked ? '1' : '')}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>عروض وخصومات فقط</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={isNewParam === '1'}
                  onChange={(e) => updateParam('is_new', e.target.checked ? '1' : '')}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>وصل حديثاً</span>
              </label>
            </div>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 space-y-4">
              <div className="text-4xl">🔍</div>
              <h3 className="font-bold text-gray-800 text-lg">لم نعثر على منتجات مطابقة</h3>
              <p className="text-xs text-gray-500">
                جربي تعديل خيارات الفلترة أو البحث بكلمات مختلفة.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="bg-rose-600 text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-rose-700 transition"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-10">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => updateParam('page', String(pageNum))}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                        pageNum === pageParam
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-rose-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
