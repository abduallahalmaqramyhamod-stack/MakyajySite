import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiShoppingBag,
  FiCheck,
  FiTruck,
  FiShield,
  FiHeart,
  FiShare2,
  FiPlus,
  FiMinus,
  FiAlertCircle,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import ProductCard from '../../components/store/ProductCard';
import { productsAPI } from '../../api';
import { useCartStore } from '../../store/cartStore';
import { useCurrencyStore } from '../../store/currencyStore';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [loading, setLoading] = useState(true);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const { formatPrice } = useCurrencyStore();

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await productsAPI.getBySlug(slug);
        if (res.success && res.data) {
          const p = res.data.product;
          setProduct(p);
          setRelatedProducts(res.data.related_products || []);

          const allImages = res.data.images || [];
          const mainImg = allImages[0]?.image_path || p.primary_image || p.image || '';
          setSelectedImage(mainImg);

          if (res.data.variants && res.data.variants.length > 0) {
            setSelectedVariant(res.data.variants[0]);
          } else {
            setSelectedVariant(null);
          }
          setQuantity(1);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 font-sans">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-gray-100 rounded-3xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-3/4 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 w-40 bg-gray-100 rounded animate-pulse" />
            <div className="h-24 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center font-sans">
        <h2 className="text-2xl font-bold text-gray-800">المنتج غير موجود</h2>
        <p className="text-gray-500 text-sm mt-2">قد يكون تم حذفه أو تغييره.</p>
        <Link
          to="/products"
          className="inline-block mt-4 bg-rose-600 text-white text-xs font-bold px-6 py-2.5 rounded-full"
        >
          العودة للتسوق
        </Link>
      </div>
    );
  }

  const currentPrice = Number(product.price) + Number(selectedVariant?.price_adjustment || 0);
  const hasDiscount = product.compare_price && Number(product.compare_price) > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_price - currentPrice) / product.compare_price) * 100)
    : 0;

  const currentStock = selectedVariant
    ? (selectedVariant.stock_quantity ?? product.stock_quantity)
    : product.stock_quantity;
  const isOutOfStock = currentStock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity, selectedVariant);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const text = `أعجبني هذا المنتج في متجر مكياجي – منبع الجمال: ${product.name} - ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-rose-600">الرئيسية</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-rose-600">المنتجات</Link>
        <span>/</span>
        {product.category_name && (
          <>
            <Link to={`/category/${product.category_slug}`} className="hover:text-rose-600">
              {product.category_name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-800 font-bold truncate">{product.name}</span>
      </nav>

      {/* Main Product Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Images Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-white rounded-3xl overflow-hidden border border-rose-100 shadow-sm relative group">
            <img
              src={selectedImage || product.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80'}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
            {hasDiscount && (
              <span className="absolute top-4 right-4 bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                خصم {discountPercent}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(img.image_path)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition ${
                    selectedImage === img.image_path ? 'border-rose-600 scale-102 shadow-sm' : 'border-gray-100 hover:border-rose-300'
                  }`}
                >
                  <img src={img.image_path} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Brand & Stock badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full">
                {product.brand_name || 'علامة تجارية أصلية'}
              </span>
              <span className={`text-xs font-bold flex items-center gap-1 ${
                isOutOfStock ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                {isOutOfStock ? (
                  <>
                    <FiAlertCircle />
                    <span>غير متوفر حالياً</span>
                  </>
                ) : (
                  <>
                    <FiCheck />
                    <span>متوفر في المخزون ({currentStock})</span>
                  </>
                )}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-snug">
              {product.name}
            </h1>

            {/* SKU */}
            {product.sku && (
              <div className="text-xs text-gray-400">
                رمز المنتج (SKU): <span className="font-mono text-gray-600 font-bold">{product.sku}</span>
              </div>
            )}

            {/* Price section */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-3xl sm:text-4xl font-black text-rose-700">
                {formatPrice(currentPrice)}
              </span>
              {hasDiscount && (
                <span className="text-base text-gray-400 line-through">
                  {formatPrice(product.compare_price)}
                </span>
              )}
            </div>

            {/* Short description */}
            <p className="text-sm text-gray-600 leading-relaxed pt-2">
              {product.short_description || product.description}
            </p>

            {/* Variants (if available) */}
            {product.variants && product.variants.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  اختاري الدرجة أو الحجم:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                        selectedVariant?.id === v.id
                          ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-xs'
                          : 'border-gray-200 text-gray-700 hover:border-rose-300'
                      }`}
                    >
                      {v.name}: {v.value}
                      {v.price_adjustment > 0 && ` (+${formatPrice(v.price_adjustment)})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & Add to Cart */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-700">الكمية:</span>
                <div className="flex items-center border border-gray-200 rounded-2xl bg-white px-2 py-1 shadow-xs">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1.5 text-gray-600 hover:text-rose-600 disabled:opacity-30"
                  >
                    <FiMinus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-black text-gray-800">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= currentStock || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                    className="p-1.5 text-gray-600 hover:text-rose-600 disabled:opacity-30"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>
                {quantity >= currentStock && !isOutOfStock && (
                  <span className="text-[11px] text-amber-600 font-bold">
                    الحد الأقصى المتوفر
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`w-full sm:flex-1 py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition shadow-lg ${
                    isOutOfStock
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : addedAnimation
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-rose-600 via-rose-700 to-pink-700 hover:from-rose-700 hover:to-pink-800 text-white shadow-rose-200'
                  }`}
                >
                  {addedAnimation ? (
                    <>
                      <FiCheck size={18} />
                      <span>تمت الإضافة بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <FiShoppingBag size={18} />
                      <span>{isOutOfStock ? 'المنتج غير متوفر' : 'أضيفي إلى سلة التسوق'}</span>
                    </>
                  )}
                </button>

                {/* WhatsApp Share / Inquire */}
                <button
                  type="button"
                  onClick={shareOnWhatsApp}
                  className="w-full sm:w-auto p-4 rounded-2xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition flex items-center justify-center gap-2 text-xs font-bold"
                  title="مشاركة أو استفسار عبر واتساب"
                >
                  <FaWhatsapp size={18} className="text-emerald-600" />
                  <span>مشاركة</span>
                </button>
              </div>
            </div>
          </div>

          {/* Guarantees bar */}
          <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-100 text-xs text-gray-600">
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-2xl">
              <FiTruck className="text-rose-600 shrink-0" size={18} />
              <span>توصيل سريع لكافة المحافظات</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-2xl">
              <FiShield className="text-rose-600 shrink-0" size={18} />
              <span>دفع نقدًا عند الاستلام</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description & Details */}
      <div className="mt-16 pt-8 border-t border-gray-200">
        <div className="flex gap-4 border-b border-gray-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('description')}
            className={`font-bold text-sm pb-2 transition relative ${
              activeTab === 'description' ? 'text-rose-700' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            وصف المنتج الكامل
            {activeTab === 'description' && (
              <span className="absolute bottom-0 right-0 w-full h-0.5 bg-rose-600 rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`font-bold text-sm pb-2 transition relative ${
              activeTab === 'details' ? 'text-rose-700' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            المواصفات وطريقة الاستخدام
            {activeTab === 'details' && (
              <span className="absolute bottom-0 right-0 w-full h-0.5 bg-rose-600 rounded-full" />
            )}
          </button>
        </div>

        <div className="py-6 text-sm text-gray-700 leading-relaxed max-w-3xl">
          {activeTab === 'description' ? (
            <p className="whitespace-pre-line">{product.description || product.short_description}</p>
          ) : (
            <ul className="space-y-2 list-disc list-inside text-gray-600">
              <li>العلامة التجارية: {product.brand_name || 'أصلية'}</li>
              <li>القسم: {product.category_name}</li>
              <li>حالة التوفر: {currentStock > 0 ? 'متوفر' : 'غير متوفر'}</li>
              <li>طريقة الدفع المدعومة: الدفع نقدًا عند الاستلام</li>
            </ul>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 pt-10 border-t border-gray-100">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-6">
            منتجات ذات صلة قد تعجبكِ
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
