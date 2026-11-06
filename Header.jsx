import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiShoppingBag,
  FiSearch,
  FiMenu,
  FiX,
  FiPhone,
  FiMapPin,
  FiPackage,
  FiHeart,
  FiUser,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useCartStore } from '../../store/cartStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { categoriesAPI } from '../../api';

export default function Header() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const totalItems = useCartStore((state) => state.getTotalItemsCount());
  const openCart = useCartStore((state) => state.openCart);
  const { currentCurrency, setCurrency, fetchCurrencies } = useCurrencyStore();

  useEffect(() => {
    fetchCurrencies();
    categoriesAPI
      .getAll()
      .then((res) => {
        if (res.success) setCategories(res.data || []);
      })
      .catch((err) => console.warn('Categories load error:', err));

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="w-full z-40 bg-white font-sans shadow-sm transition-all duration-300">
      {/* 1. Top Ribbon */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-pink-900 text-pink-100 text-xs py-2 px-4 border-b border-rose-950/20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Address & Store contact */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 hover:text-white transition">
              <FiMapPin className="text-pink-300" />
              <span>اليمن – تعز – التربة – المركز التجاري الأمين</span>
            </span>
            <a
              href="tel:+967771496283"
              className="hidden sm:flex items-center gap-1.5 hover:text-white transition"
            >
              <FiPhone className="text-pink-300" />
              <span dir="ltr">771496283</span>
            </a>
          </div>

          {/* Right actions: Currency selector & Track order */}
          <div className="flex items-center gap-4">
            <Link
              to="/order-tracking"
              className="flex items-center gap-1 hover:text-white transition"
            >
              <FiPackage className="text-pink-300" />
              <span>تتبع طلبك</span>
            </Link>

            {/* Currency toggle */}
            <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full border border-white/20 text-xs">
              <span className="text-pink-200 text-[11px]">العملة:</span>
              <button
                type="button"
                onClick={() => setCurrency('YER')}
                className={`px-1.5 py-0.5 rounded transition ${
                  currentCurrency === 'YER'
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'text-pink-200 hover:text-white'
                }`}
              >
                ريال (YER)
              </button>
              <span className="text-pink-300">|</span>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-1.5 py-0.5 rounded transition ${
                  currentCurrency === 'USD'
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'text-pink-200 hover:text-white'
                }`}
              >
                دولار ($)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Navbar */}
      <div
        className={`px-4 lg:px-8 py-3.5 transition-all duration-300 ${
          isScrolled ? 'sticky top-0 bg-white/95 backdrop-blur-md shadow-md z-50' : 'bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:text-rose-700 hover:bg-rose-50 transition"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-700 via-rose-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-rose-200 font-extrabold text-xl group-hover:scale-105 transition-transform">
              💄
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl lg:text-2xl tracking-tight text-gray-900 group-hover:text-rose-700 transition">
                مكياجي
              </span>
              <span className="text-[11px] font-semibold tracking-wider text-rose-600 -mt-1">
                منبع الجمال
              </span>
            </div>
          </Link>

          {/* Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xl mx-6 relative items-center"
          >
            <input
              type="text"
              placeholder="ابحثي عن عطر، أحمر شفاه، سيروم نضارة، ماركة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-rose-50/50 border border-rose-200/80 rounded-full py-2.5 pr-11 pl-24 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200/50 transition-all shadow-inner"
            />
            <FiSearch className="absolute right-4 text-rose-400 pointer-events-none" size={18} />
            <button
              type="submit"
              className="absolute left-1.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white text-xs font-bold px-4 py-1.5 rounded-full hover:from-rose-700 hover:to-rose-800 transition shadow-sm"
            >
              بحث
            </button>
          </form>

          {/* User Icons / Cart */}
          <div className="flex items-center gap-3">
            {/* Admin Quick Link */}
            <Link
              to="/admin/login"
              className="hidden sm:flex items-center gap-1.5 text-xs text-gray-600 hover:text-rose-700 border border-gray-200 rounded-full px-3 py-1.5 hover:border-rose-300 transition"
              title="لوحة تحكم المتجر"
            >
              <FiUser className="text-gray-500" />
              <span>الإدارة</span>
            </Link>

            {/* Cart Trigger Button */}
            <button
              type="button"
              onClick={openCart}
              className="relative flex items-center gap-2 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/90 text-rose-900 px-3.5 py-2 rounded-full hover:bg-rose-100/70 transition shadow-xs group"
              aria-label="سلة التسوق"
            >
              <div className="relative">
                <FiShoppingBag className="text-rose-700 group-hover:scale-110 transition-transform" size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-bold text-xs">السلة</span>
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        <form onSubmit={handleSearchSubmit} className="mt-3 md:hidden relative">
          <input
            type="text"
            placeholder="ابحثي عن منتجات الجمال..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-rose-50/50 border border-rose-200 rounded-full py-2 pr-10 pl-20 text-xs text-gray-800 focus:outline-none focus:border-rose-500"
          />
          <FiSearch className="absolute right-3.5 top-2.5 text-rose-400" size={16} />
          <button
            type="submit"
            className="absolute left-1.5 top-1 bg-rose-600 text-white text-[11px] font-bold px-3 py-1 rounded-full"
          >
            بحث
          </button>
        </form>
      </div>

      {/* 3. Categories Navigation Bar */}
      <nav className="hidden lg:block border-t border-b border-rose-100 bg-rose-50/30">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-sm font-medium text-gray-700">
          <ul className="flex items-center gap-6 py-2.5 overflow-x-auto">
            <li>
              <Link
                to="/"
                className="text-gray-900 hover:text-rose-700 font-bold transition flex items-center gap-1"
              >
                الرئيسية
              </Link>
            </li>
            <li>
              <Link
                to="/products"
                className="hover:text-rose-700 transition"
              >
                جميع المنتجات
              </Link>
            </li>
            {categories.slice(0, 7).map((cat) => (
              <li key={cat.id}>
                <Link
                  to={`/category/${cat.slug}`}
                  className="hover:text-rose-700 transition hover:underline underline-offset-4 decoration-rose-400 whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to="/products?on_sale=1"
            className="text-xs font-extrabold text-rose-700 bg-rose-100/80 hover:bg-rose-200 px-3 py-1 rounded-full transition flex items-center gap-1 shrink-0"
          >
            🔥 أقوى العروض
          </Link>
        </div>
      </nav>

      {/* 4. Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl p-5 overflow-y-auto z-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold">
                    💄
                  </div>
                  <span className="font-bold text-gray-800 text-lg">مكياجي</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-full hover:bg-rose-50 text-gray-500"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="mt-4 space-y-2 text-sm font-medium">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 px-3 rounded-lg hover:bg-rose-50 text-gray-800"
                >
                  الرئيسية
                </Link>
                <Link
                  to="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 px-3 rounded-lg hover:bg-rose-50 text-gray-800"
                >
                  جميع المنتجات
                </Link>
                <Link
                  to="/products?on_sale=1"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 px-3 rounded-lg bg-rose-50 text-rose-700 font-bold"
                >
                  🔥 العروض والخصومات
                </Link>

                <div className="pt-3 pb-1 border-t border-gray-100 text-xs font-bold text-gray-400 uppercase">
                  التصنيفات
                </div>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 px-3 rounded-lg hover:bg-rose-50 text-gray-700"
                  >
                    {cat.name}
                  </Link>
                ))}

                <div className="pt-3 pb-1 border-t border-gray-100 text-xs font-bold text-gray-400 uppercase">
                  خدمات المتجر
                </div>
                <Link
                  to="/order-tracking"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 px-3 rounded-lg hover:bg-rose-50 text-gray-700"
                >
                  تتبع حالة الطلب
                </Link>
                <Link
                  to="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 px-3 rounded-lg hover:bg-rose-50 text-gray-700"
                >
                  لوحة تحكم الإدارة
                </Link>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 text-xs text-gray-500">
              <p className="font-semibold text-gray-700">مكياجي – منبع الجمال</p>
              <p className="mt-1">تعز - التربة - المركز التجاري الأمين</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
