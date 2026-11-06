import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiTag, FiAward, FiStar } from 'react-icons/fi';
import HeroBanner from '../../components/store/HeroBanner';
import ProductCard from '../../components/store/ProductCard';
import { productsAPI, categoriesAPI, brandsAPI } from '../../api';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [onSaleProducts, setOnSaleProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        const [featuredRes, newRes, saleRes, catRes, brandRes] = await Promise.all([
          productsAPI.getAll({ featured: 1, limit: 8 }),
          productsAPI.getAll({ is_new: 1, limit: 8 }),
          productsAPI.getAll({ on_sale: 1, limit: 4 }),
          categoriesAPI.getAll({ include_count: 1 }),
          brandsAPI.getAll(),
        ]);

        const extractProducts = (res) => {
          if (!res || !res.success) return [];
          if (Array.isArray(res.data)) return res.data;
          return res.data?.products || [];
        };

        setFeaturedProducts(extractProducts(featuredRes));
        setNewArrivals(extractProducts(newRes));
        setOnSaleProducts(extractProducts(saleRes));
        if (catRes.success) setCategories(Array.isArray(catRes.data) ? catRes.data : []);
        if (brandRes.success) setBrands(Array.isArray(brandRes.data) ? brandRes.data : []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  return (
    <div className="space-y-14 pb-16 font-sans">
      {/* 1. Hero Banner */}
      <HeroBanner />

      {/* 2. Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">
            تصفحي حسب القسم
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
            أقسام الجمال والعناية
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            كل ما تحتاجينه لإبراز سحركِ وجمالكِ في مكان واحد
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group bg-white rounded-2xl p-4 border border-rose-100/70 hover:border-rose-400 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center transform hover:-translate-y-1"
            >
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center text-2xl transition-all duration-300 shadow-inner mb-3">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span>✨</span>
                )}
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-gray-800 group-hover:text-rose-600 transition">
                {cat.name}
              </h3>
              {cat.product_count !== undefined && (
                <span className="text-[11px] text-gray-400 mt-0.5">
                  {cat.product_count} منتج
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
              <FiStar />
              <span>مختاراتنا لكِ</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              المنتجات الأكثر مبيعاً وتميزاً
            </h2>
          </div>
          <Link
            to="/products?featured=1"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 transition group"
          >
            <span>عرض كل المميز</span>
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Promotional Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-rose-900 via-rose-800 to-pink-900 text-white overflow-hidden p-8 sm:p-12 relative shadow-xl">
          <div className="max-w-xl relative z-10 space-y-4">
            <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-pink-200">
              عرض خاص ومحدود
            </span>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              تألقي ببشرة مشرقة وعطور تدوم طويلاً
            </h2>
            <p className="text-pink-100 text-xs sm:text-sm leading-relaxed">
              احصلي على أفضل مستحضرات العناية المصنوعة من خلاصات طبيعية تناسب جميع أنواع البشرة، مع خدمة التوصيل السريع لجميع المحافظات والدفع عند الاستلام.
            </p>
            <div className="pt-2">
              <Link
                to="/products?on_sale=1"
                className="inline-flex items-center gap-2 bg-white text-rose-900 font-extrabold text-xs sm:text-sm px-6 py-3 rounded-full hover:bg-pink-100 transition shadow-lg"
              >
                <span>تسوقي العروض الآن</span>
                <FiArrowLeft size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
              <FiStar />
              <span>جديد متجرنا</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              وصل حديثاً
            </h2>
          </div>
          <Link
            to="/products?is_new=1"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 transition group"
          >
            <span>عرض كل الجديد</span>
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 6. Brands Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">
            ماركات عالمية موثوقة
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
            أشهر العلامات التجارية
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              to={`/products?brand=${brand.id}`}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-rose-300 text-center shadow-xs hover:shadow-md transition flex flex-col items-center justify-center gap-2 group"
            >
              <span className="text-lg font-black text-gray-700 group-hover:text-rose-700 transition">
                {brand.name}
              </span>
              <span className="text-[11px] text-gray-400 font-sans">
                {brand.name_en || brand.name}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
