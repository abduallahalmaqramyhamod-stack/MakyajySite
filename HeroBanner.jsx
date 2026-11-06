import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiChevronLeft, FiArrowLeft } from 'react-icons/fi';
import { bannersAPI } from '../../api';

const DEFAULT_SLIDES = [
  {
    id: 1,
    title: 'تألقي بجمال استثنائي',
    subtitle: 'أحدث تشكيلات المكياج والعطور العالمية الأصلية بأسعار حصرية وخاصة',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1600&q=80',
    link: '/products',
    buttonText: 'تسوقي التشكيلة الآن',
  },
  {
    id: 2,
    title: 'عروض ربيع الجمال والأنوثة',
    subtitle: 'خصومات تصل حتى 40% على أرقى مستحضرات العناية بالبشرة والشعر',
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1600&q=80',
    link: '/products?on_sale=1',
    buttonText: 'اكتشفي العروض',
  },
  {
    id: 3,
    title: 'العطور النسائية الفاخرة',
    subtitle: 'نفحات ساحرة تدوم طويلاً وتترك انطباعاً لا يُنسى في كل إطلالة',
    image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=1600&q=80',
    link: '/category/العطور',
    buttonText: 'استكشفي العطور',
  },
];

export default function HeroBanner() {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    bannersAPI
      .getAll()
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const apiSlides = res.data.map((b) => ({
            id: b.id,
            title: b.title,
            subtitle: b.subtitle,
            image: b.image,
            link: b.link || '/products',
            buttonText: 'تسوقي الآن',
          }));
          setSlides(apiSlides);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] md:h-[540px] overflow-hidden bg-gray-900 font-sans">
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {/* Background image with overlay */}
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-rose-950/50 to-transparent" />

          {/* Text content */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full">
              <div className="max-w-xl text-white space-y-4">
                <span className="inline-block bg-rose-600/90 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  مكياجي – منبع الجمال
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight drop-shadow-md">
                  {slide.title}
                </h1>
                <p className="text-sm sm:text-base text-gray-200 leading-relaxed drop-shadow">
                  {slide.subtitle}
                </p>
                <div className="pt-2">
                  <Link
                    to={slide.link}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg shadow-rose-900/50 transition-all transform hover:-translate-y-0.5"
                  >
                    <span>{slide.buttonText}</span>
                    <FiArrowLeft size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center transition"
            aria-label="السابق"
          >
            <FiChevronRight size={22} />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center transition"
            aria-label="التالي"
          >
            <FiChevronLeft size={22} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={`h-2.5 rounded-full transition-all ${
                  i === current ? 'w-8 bg-rose-500' : 'w-2.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`شريحة ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
