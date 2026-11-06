import React, { useState, useEffect } from 'react';
import {
  FiSettings,
  FiDollarSign,
  FiTruck,
  FiLock,
  FiSave,
  FiCheck,
  FiAlertCircle,
  FiImage,
} from 'react-icons/fi';
import { settingsAPI, currenciesAPI, shippingAPI, authAPI, bannersAPI } from '../../api';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({});
  const [currencies, setCurrencies] = useState([]);
  const [shippingFees, setShippingFees] = useState([]);
  const [banners, setBanners] = useState([]);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const loadData = async () => {
    try {
      const [setRes, curRes, shipRes, banRes] = await Promise.all([
        settingsAPI.getAll(),
        currenciesAPI.getAll(),
        shippingAPI.getAllAdmin(),
        bannersAPI.getAll(),
      ]);

      if (setRes.success) setSettings(setRes.data || {});
      if (curRes.success) setCurrencies(curRes.data || []);
      if (shipRes.success) setShippingFees(shipRes.data || []);
      if (banRes.success) setBanners(banRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await settingsAPI.update({ settings });
      if (res.success) {
        setFeedback({ type: 'success', text: 'تم حفظ الإعدادات العامة بنجاح' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل الحفظ' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateExchangeRate = async (currencyId, newRate) => {
    try {
      const res = await currenciesAPI.update(currencyId, { exchange_rate: Number(newRate) });
      if (res.success) {
        setFeedback({ type: 'success', text: 'تم تحديث سعر الصرف بنجاح' });
        loadData();
      }
    } catch (err) {
      alert(err.message || 'فشل تحديث سعر الصرف');
    }
  };

  const handleUpdateShippingFee = async (feeId, newFee, newDays) => {
    try {
      const res = await shippingAPI.update(feeId, {
        fee: Number(newFee),
        estimated_days: newDays,
      });
      if (res.success) {
        setFeedback({ type: 'success', text: 'تم تحديث رسوم التوصيل بنجاح' });
        loadData();
      }
    } catch (err) {
      alert(err.message || 'فشل التحديث');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setFeedback({ type: 'error', text: 'كلمة المرور الجديدة غير متطابقة' });
      return;
    }

    setSaving(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (res.success) {
        setFeedback({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'فشل تغيير كلمة المرور' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">إعدادات المتجر الشاملة</h2>
          <p className="text-xs text-gray-500 mt-1">
            إدارة بيانات التواصل، أسعار الصرف، رسوم التوصيل، وحماية الحساب
          </p>
        </div>
      </div>

      {feedback.text && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2.5 rounded-xl transition ${
            activeTab === 'general'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          البيانات العامة والتواصل
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('currencies')}
          className={`px-4 py-2.5 rounded-xl transition ${
            activeTab === 'currencies'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          أسعار الصرف (YER / USD)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('shipping')}
          className={`px-4 py-2.5 rounded-xl transition ${
            activeTab === 'shipping'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          رسوم الشحن بالمحافظات
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl transition ${
            activeTab === 'security'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          أمان الحساب وكلمة المرور
        </button>
      </div>

      {/* Tab 1: General Settings */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-gray-900 pb-2 border-b border-gray-100">
            معلومات وهوية المتجر
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">اسم المتجر</label>
              <input
                type="text"
                value={settings.store_name || ''}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                dir="ltr"
                value={settings.store_email || ''}
                onChange={(e) => setSettings({ ...settings, store_email: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">هاتف المتجر المباشر</label>
              <input
                type="text"
                dir="ltr"
                value={settings.store_phone || ''}
                onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">رقم واتساب خدمة العملاء</label>
              <input
                type="text"
                dir="ltr"
                value={settings.store_whatsapp || ''}
                onChange={(e) => setSettings({ ...settings, store_whatsapp: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 text-right"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                عنوان المتجر الفعلي (تعز – التربة)
              </label>
              <input
                type="text"
                value={settings.store_address || ''}
                onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">الوصف العام في محركات البحث</label>
              <textarea
                rows="2"
                value={settings.store_description || ''}
                onChange={(e) => setSettings({ ...settings, store_description: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Currencies & Exchange Rate */}
      {activeTab === 'currencies' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-gray-900 pb-2 border-b border-gray-100">
            إدارة العملات وسعر صرف الريال اليمني مقابل الدولار
          </h3>
          <p className="text-xs text-gray-500">
            العملة الأساسية لتسعير المنتجات في قاعدة البيانات هي الريال اليمني (YER). عند اختيار العميل للدولار الأمريكي ($)، يتم تحويل الأسعار تلقائياً بناءً على سعر الصرف المحدد أدناه.
          </p>

          <div className="space-y-3 pt-2">
            {currencies.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-extrabold text-sm text-gray-800">
                    {c.name} ({c.code}) - {c.symbol}
                  </h4>
                  <span className="text-[11px] text-gray-400">
                    {c.code === 'YER' ? 'العملة الأساسية (معدل 1.0)' : 'عملة ثانوية للعرض والتحويل'}
                  </span>
                </div>

                {c.code !== 'YER' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">1 دولار =</span>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={c.exchange_rate}
                      id={`rate-${c.id}`}
                      className="w-32 bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <span className="text-xs font-bold text-gray-700">ريال</span>
                    <button
                      type="button"
                      onClick={() => {
                        const val = document.getElementById(`rate-${c.id}`)?.value;
                        if (val) handleUpdateExchangeRate(c.id, val);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-xs"
                    >
                      تحديث
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Shipping Fees */}
      {activeTab === 'shipping' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-gray-900 pb-2 border-b border-gray-100">
            رسوم الشحن والتوصيل للمحافظات اليمنية
          </h3>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 font-bold">المحافظة</th>
                  <th className="py-2.5 px-3 font-bold">رسوم التوصيل (ر.ي)</th>
                  <th className="py-2.5 px-3 font-bold">المدة التقديرية</th>
                  <th className="py-2.5 px-3 font-bold text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shippingFees.map((sf) => (
                  <tr key={sf.id}>
                    <td className="py-2.5 px-3 font-bold text-gray-800">{sf.governorate}</td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        id={`fee-${sf.id}`}
                        defaultValue={sf.fee}
                        className="w-28 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        id={`days-${sf.id}`}
                        defaultValue={sf.estimated_days || ''}
                        className="w-32 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const fee = document.getElementById(`fee-${sf.id}`)?.value;
                          const days = document.getElementById(`days-${sf.id}`)?.value;
                          handleUpdateShippingFee(sf.id, fee, days);
                        }}
                        className="bg-gray-900 hover:bg-black text-white text-[11px] font-bold px-3 py-1 rounded-lg"
                      >
                        حفظ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Security */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs max-w-md space-y-4">
          <h3 className="font-extrabold text-sm text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
            <FiLock className="text-rose-600" />
            <span>تغيير كلمة مرور المدير</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              كلمة المرور الحالية
            </label>
            <input
              type="password"
              required
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              كلمة المرور الجديدة
            </label>
            <input
              type="password"
              required
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              تأكيد كلمة المرور الجديدة
            </label>
            <input
              type="password"
              required
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
          >
            {saving ? 'جاري الحفظ...' : 'تغيير كلمة المرور الآن'}
          </button>
        </form>
      )}
    </div>
  );
}
