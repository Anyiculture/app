import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
  {
    id: 1,
    image: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Happy%20diverse%20family%20walking%20in%20modern%20city%20park%20with%20rainbow%20kite%20asian%20parents%20and%20kids%20and%20black%20woman%20walking%20together&image_size=landscape_16_9',
    ctaLink: '/au-pair',
    color: 'from-blue-600 to-indigo-900'
  },
  {
    id: 2,
    image: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Female%20singer%20recording%20in%20studio%20with%20microphone%20side%20profile%20professional%20music%20production&image_size=landscape_16_9',
    ctaLink: '/jobs',
    color: 'from-violet-600 to-purple-900'
  },
  {
    id: 3,
    image: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Outdoor%20sunny%20park%20event%20with%20red%20bean%20bag%20chairs%20and%20white%20umbrellas%20and%20palm%20trees%20festival%20atmosphere&image_size=landscape_16_9',
    ctaLink: '/events',
    color: 'from-slate-700 to-slate-900'
  },
  {
    id: 4,
    image: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Secondhand%20market%20stall%20with%20vintage%20items%20and%20happy%20shoppers%20browsing%20sunny%20day&image_size=landscape_16_9',
    ctaLink: '/marketplace',
    color: 'from-emerald-600 to-teal-900'
  },
  {
    id: 5,
    image: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Group%20of%20diverse%20friends%20having%20coffee%20and%20chatting%20in%20a%20cozy%20cafe%20warm%20lighting&image_size=landscape_16_9',
    ctaLink: '/community',
    color: 'from-orange-500 to-red-900'
  }
];

export function HeroCarousel() {
  const { t } = useI18n();
  // We reconstruct the localized slides completely here to ensure fresh translations
  const SLIDES_LOCALIZED = SLIDES.map(slide => ({
    ...slide,
    title: t(`hero.slide${slide.id}.title`),
    description: t(`hero.slide${slide.id}.description`),
    ctaText: t(`hero.slide${slide.id}.cta`)
  }));

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % SLIDES_LOCALIZED.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrent(prev => (prev + 1) % SLIDES_LOCALIZED.length);
  const prevSlide = () => setCurrent(prev => (prev === 0 ? SLIDES_LOCALIZED.length - 1 : prev - 1));

  const currentSlide = SLIDES_LOCALIZED[current];

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden shadow-lg shadow-blue-900/5 group mb-6 bg-gray-900">
      <AnimatePresence mode='popLayout'>
        <motion.div 
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
             <img 
               src={currentSlide.image} 
               alt={currentSlide.title} 
               className="w-full h-full object-cover"
             />
             <div className={`absolute inset-0 bg-gradient-to-r ${currentSlide.color} opacity-60 mix-blend-multiply`} />
             <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
          </div>

          {/* Content */}
          <div className="absolute inset-0 p-6 flex flex-col justify-center max-w-2xl text-white z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-semibold tracking-wider uppercase mb-2 w-fit border border-white/30">
                {t('hero.feature')}
              </span>
              <h2 className="text-3xl font-bold mb-2 leading-tight tracking-tight drop-shadow-md">
                {currentSlide.title}
              </h2>
              <p className="text-sm text-gray-200 mb-6 max-w-lg leading-relaxed line-clamp-2">
                {currentSlide.description}
              </p>
              <Link 
                to={currentSlide.ctaLink}
                className="px-5 py-2 bg-white text-gray-900 rounded-full font-bold hover:bg-gray-50 hover:scale-105 transition-all w-fit flex items-center gap-2 shadow-lg text-sm"
              >
                {currentSlide.ctaText}
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="absolute bottom-6 right-6 flex gap-2 z-20">
         <button 
           onClick={prevSlide}
           className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white transition-all border border-white/20"
         >
           <ChevronLeft size={16} />
         </button>
         <button 
           onClick={nextSlide}
           className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white transition-all border border-white/20"
         >
           <ChevronRight size={16} />
         </button>
      </div>

       {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {SLIDES_LOCALIZED.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === current ? 'w-6 bg-white' : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
