import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiCheck, FiX, FiTag } from 'react-icons/fi';
import { brandsAPI } from '../../api';

export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({ name: '', name_en: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const loadBrands = async () => {
    setLoading(true);
    try {
      const res = await brandsAPI.getAll();
      if (res.success) setBrands(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const openAddModal = () => {
    setEditingBrand(null);
    setFormData({ name: '', name_en: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (b) => {
    setEditingBrand(b);
    setFormData({
      name: b.name || '',
      name_en: b.name_en || '',
      description: b.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      let res;
      if (editingBrand) {
        res = await brandsAPI.update(editingBrand.id, formData);
      } else {
        res = await brandsAPI.create(formData);
      }

      if (res.success) {
        setShowModal(false);
        setMsg(editingBrand ? 'تم تعديل الماركة بنجاح' : 'تم إضافة الماركة بنجاح');
        loadBrands();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف الماركة "${name}"؟`)) return;
    try {
      const res = await brandsAPI.delete(id);
      if (res.success) {
        setMsg('تم حذف الماركة بنجاح');
        loadBrands();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'فشل الحذف');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">إدارة العلامات التجارية</h2>
          <p className="text-xs text-gray-500 mt-1">
            الماركات العالمية الأصلية المعروضة في المتجر
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition"
        >
          <FiPlus size={16} />
          <span>إضافة ماركة جديدة</span>
        </button>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
          <FiCheck />
          <span>{msg}</span>
        </div>
      )}

      {/* Brands Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">جاري التحميل...</div>
        ) : brands.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">لا توجد ماركات مسجلة بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4 font-bold">اسم الماركة</th>
                  <th className="py-3.5 px-4 font-bold">الاسم بالإنجليزية</th>
                  <th className="py-3.5 px-4 font-bold">الوصف</th>
                  <th className="py-3.5 px-4 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {brands.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 font-bold text-gray-900">{b.name}</td>
                    <td className="py-3 px-4 font-sans text-gray-500">{b.name_en || '-'}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-sm truncate">
                      {b.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(b)}
                          className="p-1.5 text-blue-500 hover:text-blue-700"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b.id, b.name)}
                          className="p-1.5 text-rose-400 hover:text-rose-600"
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-900">
                {editingBrand ? 'تعديل الماركة' : 'إضافة ماركة جديدة'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  اسم الماركة (بالعربية) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: لوريال"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  الاسم بالإنجليزية
                </label>
                <input
                  type="text"
                  placeholder="L'Oréal"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  الوصف
                </label>
                <textarea
                  rows="2"
                  placeholder="نبذة عن العلامة التجارية..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-6 py-2 rounded-xl shadow-md disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
