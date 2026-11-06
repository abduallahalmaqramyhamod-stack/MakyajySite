import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiShoppingBag,
  FiPackage,
  FiGrid,
  FiTag,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiExternalLink,
  FiDollarSign,
} from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';

const NAV_ITEMS = [
  { path: '/admin', label: 'لوحة المعلومات', icon: FiHome, exact: true },
  { path: '/admin/orders', label: 'إدارة الطلبات', icon: FiPackage },
  { path: '/admin/products', label: 'إدارة المنتجات', icon: FiShoppingBag },
  { path: '/admin/categories', label: 'التصنيفات', icon: FiGrid },
  { path: '/admin/brands', label: 'العلامات التجارية', icon: FiTag },
  { path: '/admin/customers', label: 'العملاء', icon: FiUsers },
  { path: '/admin/settings', label: 'إعدادات المتجر والعملات', icon: FiSettings },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900" dir="rtl">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-gray-900 text-gray-300 border-l border-gray-800 shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-lg">
              💄
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base">مكياجي</h2>
              <span className="text-[10px] text-rose-400 font-semibold">لوحة الإدارة</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                  active
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User details and Logout */}
        <div className="p-4 border-t border-gray-800 space-y-3">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-2 bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 font-semibold rounded-xl transition"
          >
            <span>زيارة المتجر</span>
            <FiExternalLink size={13} />
          </Link>

          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">{user?.full_name || 'المدير'}</span>
              <span className="text-[10px] text-gray-500">{user?.username}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-gray-400 hover:text-rose-400 p-2 rounded-lg hover:bg-gray-800 transition"
              title="تسجيل الخروج"
            >
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100"
            >
              {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
            <h1 className="text-base font-extrabold text-gray-800 hidden sm:block">
              نظام إدارة متجر مكياجي – منبع الجمال
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-3 py-1.5 rounded-full font-bold transition"
            >
              <span>عرض المتجر</span>
              <FiExternalLink size={13} />
            </Link>

            <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-bold">
              {user?.role === 'admin' ? 'مدير النظام' : 'مشرف'}
            </span>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative w-64 bg-gray-900 text-gray-300 h-full p-4 flex flex-col justify-between z-10">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                  <span className="font-extrabold text-white text-base">مكياجي الإدارة</span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="p-1 text-gray-400"
                  >
                    <FiX size={20} />
                  </button>
                </div>
                <nav className="mt-4 space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                          active ? 'bg-rose-600 text-white' : 'text-gray-400 hover:bg-gray-800'
                        }`}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600/20 text-rose-400 font-bold text-xs rounded-xl"
              >
                <FiLogOut />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
