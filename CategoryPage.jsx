import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../../components/store/ProductCard';
import { categoriesAPI } from '../../api';

export default function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategoryProducts() {
      setLoading(true);
      try {
        const res = await categoriesAPI.getBySlug(slug);
        if (res.success && res.data) {
          setCategory(res.data.category);
          setSubcategories(res.data.subcategories || []);
          setProducts(res.data.products || []);
          setPagination(res.data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
        }
      } catch (err) {
        console.error('Failed to load category products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategoryProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 font-sans">
        <div className="h-40 bg-gray-100 rounded-3xl animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center font-sans">
        <h2 className="text-2xl font-bold text-gray-800">التصنيف غير موجود</h2>
        <Link
          to="/products"
          className="inline-block mt-4 bg-rose-600 text-white text-xs font-bold px-6 py-2.5 rounded-full"
        >
          تصفح جميع المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans space-y-8">
      {/* Category Header Banner */}
      <div className="bg-gradient-to-r from-rose-900 to-pink-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-lg">
        <div className="max-w-xl relative z-10 space-y-2">
          <span className="text-xs font-bold text-pink-300">أقسام المتجر</span>
          <h1 className="text-3xl sm:text-4xl font-black">{category.name}</h1>
          {category.description && (
            <p className="text-sm text-pink-100 mt-2 leading-relaxed">
              {category.description}
            </p>
          )}
          <div className="pt-2 text-xs text-pink-200">
            يتوفر {pagination.totalItems} منتج في هذا القسم
          </div>
        </div>
      </div>

      {/* Subcategories pills if any */}
      {subcategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {subcategories.map((sub) => (
            <Link
              key={sub.id}
              to={`/category/${sub.slug}`}
              className="bg-white border border-rose-200 text-gray-700 hover:border-rose-600 hover:text-rose-600 text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap shadow-xs transition"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 space-y-4">
          <div className="text-4xl">💄</div>
          <h3 className="text-lg font-bold text-gray-800">لا توجد منتجات حالياً في هذا القسم</h3>
          <p className="text-xs text-gray-500">سيتم إضافة منتجات جديدة قريباً لهذا التصنيف.</p>
          <Link
            to="/products"
            className="inline-block bg-rose-600 text-white text-xs font-bold px-6 py-2.5 rounded-full"
          >
            تصفح باقي الأقسام
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
