import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiShield,
  FiTruck,
  FiAward,
  FiCheckCircle,
  FiExternalLink,
} from 'react-icons/fi';
import { FaWhatsapp, FaFacebookF, FaInstagram, FaSnapchatGhost } from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-gray-300 font-sans pt-14 pb-8 border-t-4 border-rose-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value propositions banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-gray-800 text-center sm:text-right">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <FiAward size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">منتجات أصلية 100%</h4>
              <p className="text-xs text-gray-400 mt-0.5">ضمان الجودة وأشهر الماركات</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <FiTruck size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">توصيل لجميع المحافظات</h4>
              <p className="text-xs text-gray-400 mt-0.5">شحن آمن وسريع حتى باب منزلك</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <FiShield size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">دفع عند الاستلام</h4>
              <p className="text-xs text-gray-400 mt-0.5">افحصي طلبك وادفعي نقدًا بأمان</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <FiCheckCircle size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">خدمة عملاء راقية</h4>
              <p className="text-xs text-gray-400 mt-0.5">فريق متخصص للإجابة عن استفساراتك</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          {/* 1. Store Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-600 to-amber-400 flex items-center justify-center text-white font-bold text-lg">
                💄
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl text-white">مكياجي</span>
                <span className="text-xs text-rose-400 font-semibold -mt-1">منبع الجمال</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              متجر متخصص في أحدث مستحضرات التجميل، ومنتجات العناية الفائقة بالبشرة والشعر، وأفخم العطور الشرقية والغربية، والإكسسوارات النسائية التي تبرز جمالكِ الطبيعي.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-rose-600 text-gray-300 hover:text-white flex items-center justify-center transition"
                aria-label="فيسبوك المتجر"
              >
                <FaFacebookF size={14} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-rose-600 text-gray-300 hover:text-white flex items-center justify-center transition"
                aria-label="انستقرام المتجر"
              >
                <FaInstagram size={14} />
              </a>
              <a
                href="https://snapchat.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-rose-600 text-gray-300 hover:text-white flex items-center justify-center transition"
                aria-label="سناب شات المتجر"
              >
                <FaSnapchatGhost size={14} />
              </a>
            </div>
          </div>

          {/* 2. Quick Links */}
          <div>
            <h4 className="text-white font-bold text-base mb-4 relative inline-block">
              روابط سريعة
              <span className="absolute -bottom-1 right-0 w-8 h-0.5 bg-rose-500 rounded-full" />
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-rose-400 transition">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-rose-400 transition">
                  جميع المنتجات
                </Link>
              </li>
              <li>
                <Link to="/products?on_sale=1" className="hover:text-rose-400 transition">
                  العروض والخصومات
                </Link>
              </li>
              <li>
                <Link to="/order-tracking" className="hover:text-rose-400 transition">
                  تتبع حالة الطلب
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-rose-400 transition">
                  سلة التسوق
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-rose-400 transition text-gray-400">
                  لوحة تحكم الإدارة
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Product Categories */}
          <div>
            <h4 className="text-white font-bold text-base mb-4 relative inline-block">
              أقسام المتجر
              <span className="absolute -bottom-1 right-0 w-8 h-0.5 bg-rose-500 rounded-full" />
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/category/مكياج-الوجه" className="hover:text-rose-400 transition">
                  مكياج الوجه
                </Link>
              </li>
              <li>
                <Link to="/category/مكياج-العيون" className="hover:text-rose-400 transition">
                  مكياج العيون والرموش
                </Link>
              </li>
              <li>
                <Link to="/category/مكياج-الشفاه" className="hover:text-rose-400 transition">
                  أحمر الشفاه والمرطبات
                </Link>
              </li>
              <li>
                <Link to="/category/العناية-بالبشرة" className="hover:text-rose-400 transition">
                  العناية بالبشرة والنضارة
                </Link>
              </li>
              <li>
                <Link to="/category/العطور" className="hover:text-rose-400 transition">
                  العطور النسائية الفاخرة
                </Link>
              </li>
              <li>
                <Link to="/category/إكسسوارات" className="hover:text-rose-400 transition">
                  فرش وأدوات التجميل
                </Link>
              </li>
            </ul>
          </div>

          {/* 4. Store Location & Contact */}
          <div>
            <h4 className="text-white font-bold text-base mb-4 relative inline-block">
              مقر المتجر والتواصل
              <span className="absolute -bottom-1 right-0 w-8 h-0.5 bg-rose-500 rounded-full" />
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <FiMapPin className="text-rose-400 shrink-0 mt-1" size={16} />
                <span className="text-gray-300 leading-relaxed text-xs sm:text-sm">
                  اليمن – محافظة تعز – التربة – المركز التجاري الأمين – مقابل فلورينا للأحذية والشنط
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <FiPhone className="text-rose-400 shrink-0" size={16} />
                <span className="text-gray-300 text-xs sm:text-sm" dir="ltr">
                  +967 771 496 283
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <FiMail className="text-rose-400 shrink-0" size={16} />
                <span className="text-gray-300 text-xs sm:text-sm">
                  info@makeupi.store
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Developer Credit & Copyright Section (Strict requirement implementation) */}
        <div className="pt-8 mt-6 border-t border-gray-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div>
            جميع الحقوق محفوظة © {currentYear} لمتجر <strong className="text-rose-400">مكياجي – منبع الجمال</strong>.
          </div>

          {/* Developer signature with WhatsApp and Call clickable icons and tooltips */}
          <div className="flex items-center gap-3 bg-gray-800/60 border border-gray-700/60 px-4 py-2 rounded-full shadow-inner">
            <span className="font-semibold text-gray-200">
              تطوير / م. عبدالله حمود المقرمي
            </span>
            <span className="text-gray-500">|</span>
            <span className="font-mono text-gray-300" dir="ltr">
              771496283
            </span>

            <div className="flex items-center gap-2 mr-1">
              {/* WhatsApp Developer Interactive Icon */}
              <div className="relative group/tooltip inline-block">
                <a
                  href="https://wa.me/967771496283"
                  target="_blank"
                  rel="noreferrer"
                  className="w-7 h-7 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white flex items-center justify-center transition-all transform hover:scale-110 shadow-sm"
                  aria-label="تواصل مع المطوّر عبر واتساب"
                >
                  <FaWhatsapp size={14} />
                </a>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/tooltip:block bg-gray-900 text-white text-[11px] font-medium py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-50 border border-gray-700 pointer-events-none">
                  «تواصل مع المطوّر عبر واتساب»
                  <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-gray-700" />
                </div>
              </div>

              {/* Call Developer Interactive Icon */}
              <div className="relative group/tooltip inline-block">
                <a
                  href="tel:+967771496283"
                  className="w-7 h-7 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center transition-all transform hover:scale-110 shadow-sm"
                  aria-label="اتصل بالمطوّر"
                >
                  <FiPhone size={13} />
                </a>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/tooltip:block bg-gray-900 text-white text-[11px] font-medium py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-50 border border-gray-700 pointer-events-none">
                  «اتصل بالمطوّر»
                  <div className="w-2 h-2 bg-gray-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-gray-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
