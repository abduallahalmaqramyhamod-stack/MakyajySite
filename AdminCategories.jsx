import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiCheck, FiX, FiGrid } from 'react-icons/fi';
import { categoriesAPI } from '../../api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', sort_order: 0 });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await categoriesAPI.getAll({ include_count: 1 });
      if (res.success) setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', sort_order: 0 });
    setImageFile(null);
    setShowModal(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      description: cat.description || '',
      sort_order: cat.sort_order || 0,
    });
    setImageFile(null);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('description', formData.description.trim());
      payload.append('sort_order', formData.sort_order);
      if (imageFile) {
        payload.append('image', imageFile);
      }

      let res;
      if (editingCategory) {
        res = await categoriesAPI.update(editingCategory.id, payload);
      } else {
        res = await categoriesAPI.create(payload);
      }

      if (res.success) {
        setShowModal(false);
        setMsg(editingCategory ? 'تم تعديل التصنيف بنجاح' : 'تم إضافة التصنيف بنجاح');
        loadCategories();
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف تصنيف "${name}"؟`)) return;
    try {
      const res = await categoriesAPI.delete(id);
      if (res.success) {
        setMsg('تم حذف التصنيف بنجاح');
        loadCategories();
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
          <h2 className="text-2xl font-black text-gray-900">إدارة تصنيفات وأقسام المتجر</h2>
          <p className="text-xs text-gray-500 mt-1">
            أقسام المكياج، العناية، العطور، والإكسسوارات
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition"
        >
          <FiPlus size={16} />
          <span>إضافة تصنيف جديد</span>
        </button>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
          <FiCheck />
          <span>{msg}</span>
        </div>
      )}

      {/* Categories Grid */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">جاري التحميل...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">لا توجد تصنيفات بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4 font-bold">التصنيف</th>
                  <th className="py-3.5 px-4 font-bold">الاسم اللطيف (Slug)</th>
                  <th className="py-3.5 px-4 font-bold">الوصف</th>
                  <th className="py-3.5 px-4 font-bold">عدد المنتجات</th>
                  <th className="py-3.5 px-4 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg shrink-0">
                          {cat.image ? (
                            <img src={cat.image} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            '💄'
                          )}
                        </div>
                        <span className="font-extrabold text-gray-900">{cat.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-gray-500">{cat.slug}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                      {cat.description || '-'}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-800">
                      {cat.product_count || 0}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 text-blue-500 hover:text-blue-700"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat.id, cat.name)}
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
                {editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
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
                  اسم التصنيف <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مكياج العيون"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  الوصف
                </label>
                <textarea
                  rows="2"
                  placeholder="وصف مختصر للقسم..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  صورة الغلاف (اختياري)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full text-xs text-gray-500 file:mr-0 file:ml-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-700"
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
