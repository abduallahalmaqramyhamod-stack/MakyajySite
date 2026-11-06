import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiUser, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    const res = await login(username.trim(), password.trim());
    if (res.success) {
      navigate('/admin');
    } else {
      setErrorMsg(res.message || 'بيانات الدخول غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-rose-950 to-gray-950 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-700 to-amber-400 text-white flex items-center justify-center text-2xl mx-auto shadow-lg shadow-rose-300">
            💄
          </div>
          <h1 className="text-2xl font-black text-gray-900">
            مكياجي – منبع الجمال
          </h1>
          <p className="text-xs text-gray-500 font-semibold">
            لوحة الإدارة والتحكم في المتجر
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
            <FiAlertCircle className="shrink-0" size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              اسم المستخدم
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pr-10 pl-4 text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
              />
              <FiUser className="absolute right-3.5 top-3.5 text-gray-400" size={18} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pr-10 pl-4 text-xs sm:text-sm text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
              />
              <FiLock className="absolute right-3.5 top-3.5 text-gray-400" size={18} />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-rose-600 via-rose-700 to-pink-700 hover:from-rose-700 hover:to-pink-800 text-white font-black py-3.5 px-4 rounded-2xl shadow-lg shadow-rose-200 transition flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50"
          >
            {isLoading ? (
              <span>جاري التحقق...</span>
            ) : (
              <>
                <span>تسجيل الدخول</span>
                <FiArrowLeft size={16} />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
          <p>نظام مشفر ومحمي. المصادقة عبر JWT مع التشفير بـ bcrypt</p>
        </div>
      </div>
    </div>
  );
}
