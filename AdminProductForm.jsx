import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiArrowRight, FiSave, FiUploadCloud, FiTrash2, FiPlus, FiAlertCircle } from 'react-icons/fi';
import { productsAPI, categoriesAPI, brandsAPI, uploadAPI } from '../../api';

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    short_description: '',
    description: '',
    sku: '',
    price: '',
    compare_price: '',
    cost_price: '',
    category_id: '',
    brand_id: '',
    stock_quantity: 10,
    low_stock_threshold: 5,
    is_active: 1,
    is_featured: 0,
    is_new: 1,
  });

  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    // Load categories & brands
    categoriesAPI.getAll().then((res) => {
      if (res.success) setCategories(res.data || []);
    });
    brandsAPI.getAll().then((res) => {
      if (res.success) setBrands(res.data || []);
    });

    if (isEdit) {
      setLoading(true);
      // In a real app we might fetch by id, or get products and find by id
      productsAPI
        .getAll({ limit: 100 })
        .then((res) => {
          if (res.success && res.data?.products) {
            const current = res.data.products.find((p) => String(p.id) === String(id));
            if (current) {
              setFormData({
                name: current.name || '',
                short_description: current.short_description || '',
                description: current.description || '',
                sku: current.sku || '',
                price: current.price || '',
                compare_price: current.compare_price || '',
                cost_price: current.cost_price || '',
                category_id: current.category_id || '',
                brand_id: current.brand_id || '',
                stock_quantity: current.stock_quantity ?? 10,
                low_stock_threshold: current.low_stock_threshold ?? 5,
                is_active: current.is_active ?? 1,
                is_featured: current.is_featured ?? 0,
                is_new: current.is_new ?? 1,
              });
              if (current.image || current.primary_image) {
                setImages([current.image || current.primary_image]);
              }
            }
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleImageFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      const data = new FormData();
      data.append('image', file);
      data.append('folder', 'products');
      try {
        const res = await uploadAPI.uploadImage(data);
        if (res.success && res.data?.url) {
          setImages((prev) => [...prev, res.data.url]);
        }
      } catch (err) {
        console.warn('Upload error, using local object url for preview:', err);
        setImages((prev) => [...prev, URL.createObjectURL(file)]);
      }
    }
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      { name: 'الدرجة', value: '', price_adjustment: 0, stock_quantity: 10, sku: '' },
    ]);
  };

  const handleRemoveVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('اسم المنتج مطلوب');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setErrorMsg('يرجى تحديد سعر بيع صالح للمنتج');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        compare_price: formData.compare_price ? Number(formData.compare_price) : null,
        cost_price: formData.cost_price ? Number(formData.cost_price) : null,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        brand_id: formData.brand_id ? Number(formData.brand_id) : null,
        stock_quantity: Number(formData.stock_quantity) || 0,
        low_stock_threshold: Number(formData.low_stock_threshold) || 5,
        variants: variants.length > 0 ? variants : undefined,
      };

      let res;
      if (isEdit) {
        res = await productsAPI.update(id, payload);
      } else {
        res = await productsAPI.create(payload);
      }

      if (res.success) {
        setSuccessMsg(isEdit ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج الجديد بنجاح');
        setTimeout(() => navigate('/admin/products'), 1500);
      } else {
        setErrorMsg(res.message || 'فشلت العملية');
      }
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ المنتج');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-gray-400">جاري تحميل بيانات المنتج...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      {/* Top action bar */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            <FiArrowRight size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-black text-gray-900">
              {isEdit ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
            </h2>
            <span className="text-xs text-gray-400">
              متجر مكياجي – منبع الجمال
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
        >
          <FiSave size={16} />
          <span>{submitting ? 'جاري الحفظ...' : 'حفظ المنتج'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-2 text-xs font-bold">
          <FiAlertCircle />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-2 text-xs font-bold">
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-gray-800 pb-2 border-b border-gray-100">
              المعلومات الأساسية
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                اسم المنتج <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: أحمر شفاه فيلفيت مات بلون وردي ناعم"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                وصف مختصر (يظهر في البطاقات والمشاركات)
              </label>
              <input
                type="text"
                placeholder="وصف جذاب من سطر واحد..."
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                الوصف التفصيلي وطريقة الاستخدام
              </label>
              <textarea
                rows="4"
                placeholder="شرح مميزات المنتج ومكوناته وكيفية وضعه..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-gray-800 pb-2 border-b border-gray-100">
              الأسعار والمخزون
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  سعر البيع الحالي (ر.ي) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="6500"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  السعر قبل الخصم (اختياري)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="8500"
                  value={formData.compare_price}
                  onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  سعر التكلفة (للأرباح الداخلية)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="4000"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  كود المنتج (SKU)
                </label>
                <input
                  type="text"
                  placeholder="MKP-LIP-001"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  الكمية المتوفرة بالمخزون
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  حد التنبيه بانخفاض المخزون
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-rose-500 focus:bg-white transition font-mono"
                />
              </div>
            </div>
          </div>

          {/* Variants section */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-sm font-extrabold text-gray-800">
                خيارات وتدرجات المنتج (الألوان، المقاسات)
              </h3>
              <button
                type="button"
                onClick={handleAddVariant}
                className="text-xs text-rose-600 font-bold flex items-center gap-1 hover:underline"
              >
                <FiPlus />
                <span>إضافة خيار</span>
              </button>
            </div>

            {variants.length === 0 ? (
              <p className="text-xs text-gray-400">
                لا توجد خيارات مضافة. اضغطي "إضافة خيار" إذا كان للمنتج ألوان أو أحجام مختلفة.
              </p>
            ) : (
              <div className="space-y-3">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center bg-gray-50 p-3 rounded-2xl"
                  >
                    <input
                      type="text"
                      placeholder="اسم الخاصية (مثال: اللون)"
                      value={v.name}
                      onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                      className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="القيمة (مثال: وردي نود #02)"
                      value={v.value}
                      onChange={(e) => handleVariantChange(idx, 'value', e.target.value)}
                      className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs"
                    />
                    <input
                      type="number"
                      placeholder="فارق السعر (+/-)"
                      value={v.price_adjustment}
                      onChange={(e) => handleVariantChange(idx, 'price_adjustment', e.target.value)}
                      className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-mono"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="الكمية"
                        value={v.stock_quantity}
                        onChange={(e) => handleVariantChange(idx, 'stock_quantity', e.target.value)}
                        className="w-20 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Category, Brand, Images, Status */}
        <div className="space-y-6">
          {/* Classification */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-gray-800 pb-2 border-b border-gray-100">
              التصنيف والعلامة
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                القسم الرئيسي
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-rose-500"
              >
                <option value="">بدون قسم</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                العلامة التجارية
              </label>
              <select
                value={formData.brand_id}
                onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-rose-500"
              >
                <option value="">بدون علامة</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visibility and Featured flags */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-gray-800 pb-2 border-b border-gray-100">
              حالة العرض
            </h3>

            <label className="flex items-center justify-between cursor-pointer text-xs font-semibold text-gray-800">
              <span>نشط ومعروض للعملاء</span>
              <input
                type="checkbox"
                checked={formData.is_active === 1}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-xs font-semibold text-gray-800">
              <span>منتج مميز (يظهر في الواجهة)</span>
              <input
                type="checkbox"
                checked={formData.is_featured === 1}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked ? 1 : 0 })}
                className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-xs font-semibold text-gray-800">
              <span>شارة وصل حديثاً</span>
              <input
                type="checkbox"
                checked={formData.is_new === 1}
                onChange={(e) => setFormData({ ...formData, is_new: e.target.checked ? 1 : 0 })}
                className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
            </label>
          </div>

          {/* Image Upload */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-gray-800 pb-2 border-b border-gray-100">
              صور المنتج
            </h3>

            <label className="border-2 border-dashed border-gray-200 hover:border-rose-400 rounded-2xl p-6 text-center cursor-pointer block bg-gray-50/50 transition">
              <FiUploadCloud size={28} className="mx-auto text-gray-400 mb-2" />
              <span className="text-xs font-bold text-rose-600 block">اضغطي لرفع الصور</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">PNG, JPG, WEBP (حتى 5MB)</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                {images.map((imgUrl, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
