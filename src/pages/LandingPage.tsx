import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import {
  ArrowRight,
  Baby,
  Briefcase,
  Calendar,
  CheckCircle2,
  FileText,
  GraduationCap,
  Heart,
  MessageSquare,
  ShoppingBag
} from 'lucide-react';
import { Button } from '../components/ui/Button';

import { BackgroundBlobs } from '../components/ui/BackgroundBlobs';
import { GlowingCard } from '../components/ui/GlowingCard';
import { motion } from 'framer-motion';

// Reusable Pulse Circles Component - Thicket and Stronger Pulse
function ConcentricCircles({ className }: { className?: string }) {
  return (
    <div className={`absolute -z-10 ${className}`}>
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.8, 0.4, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full border-[6px] border-[#e81cff]/40 blur-sm"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute inset-[-40px] rounded-full border-[8px] border-[#40c9ff]/30 blur-sm"
      />
      <motion.div
        animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.1, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute inset-[-80px] rounded-full border-[4px] border-vibrant-purple/20"
      />
       <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.05, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute inset-[-120px] rounded-full border-[2px] border-gray-200/50"
      />
    </div>
  );
}

export function LandingPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1 }
  };

  const modules = [
    {
      icon: Briefcase,
      title: t('nav.jobs'),
      color: 'bg-blue-500',
      link: '/jobs',
      features: [t('landing.jobsFeature1'), t('landing.jobsFeature2'), t('landing.jobsFeature3')]
    },
    {
      icon: ShoppingBag,
      title: t('nav.marketplace'),
      color: 'bg-pink-500',
      link: '/marketplace',
      features: [t('landing.marketplaceFeature1'), t('landing.marketplaceFeature2'), t('landing.marketplaceFeature3')]
    },
    {
      icon: Calendar,
      title: t('nav.events'),
      color: 'bg-purple-500',
      link: '/events',
      features: [t('landing.eventsFeature1'), t('landing.eventsFeature2'), t('landing.eventsFeature3')]
    },
    {
      icon: GraduationCap,
      title: t('nav.education'),
      color: 'bg-indigo-500',
      link: '/education',
      features: [t('landing.educationFeature1'), t('landing.educationFeature2'), t('landing.educationFeature3')]
    },
    {
      icon: FileText,
      title: t('nav.visa'),
      color: 'bg-red-500',
      link: '/visa',
      features: [t('landing.visaFeature1'), t('landing.visaFeature2'), t('landing.visaFeature3')]
    },
    {
      icon: Baby,
      title: t('nav.auPair'),
      color: 'bg-orange-500',
      link: '/au-pair',
      features: [t('landing.auPairFeature1'), t('landing.auPairFeature2'), t('landing.auPairFeature3')]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 overflow-hidden relative">
      <BackgroundBlobs />
      
      {/* Hero Section - Super Populated Split Layout */}
      <div className="relative isolate pt-4 lg:pt-8 overflow-hidden"> {/* Reduced top padding to move everything UP */}
        <div className="py-8 sm:py-12 lg:pb-24">
          <div className="mx-auto max-w-[90rem] px-6 lg:px-8"> {/* Wider container for more space */}
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 lg:items-center">
              
              {/* Left Column: Text Content - MOVED UP & STYLISH */}
              <div className="max-w-2xl lg:max-w-none text-center lg:text-left z-20 relative -mt-10 lg:-mt-20">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="mb-4 flex justify-center lg:justify-start">
                        <span className="rounded-full bg-vibrant-purple/10 px-4 py-1.5 text-sm font-bold tracking-wide leading-6 text-vibrant-purple ring-1 ring-inset ring-vibrant-purple/20 backdrop-blur-md uppercase">
                           {t('landing.whatsNew')}
                        </span>
                    </div>
                    
                    {/* HUGE STYLISH FONT */}
                    <h1 className="font-display text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl lg:text-8xl mb-6 leading-[0.9] lg:tracking-tight">
                      {t('landing.heroTitle')} <br className="hidden lg:block"/>
                      <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-vibrant-purple via-pink-500 to-vibrant-pink animate-gradient-x p-1">
                        {t('landing.heroTitleHighlight')}
                      </span>
                    </h1>
                    
                    <p className="mt-4 text-xl leading-8 text-gray-600 max-w-xl mx-auto lg:mx-0 font-medium font-serif">
                        {t('landing.heroSubtitle')}
                    </p>
                    
                    <div className="mt-8 hidden md:flex items-center justify-center lg:justify-start gap-x-6">
                      <Link to={user ? "/dashboard" : "/signup"}>
                        <Button size="lg" className="shadow-2xl shadow-vibrant-purple/30 rounded-full px-10 py-7 text-xl font-bold hover:scale-105 transition-transform bg-gray-900 text-white hover:bg-gray-800 border-0">
                           {user ? t('landing.goToDashboard') : t('landing.getStarted')} <ArrowRight className="ml-2 h-6 w-6" />
                        </Button>
                      </Link>
                       <a href="#services" className="text-lg font-bold leading-6 text-gray-900 group cursor-pointer hover:text-vibrant-purple transition-colors flex items-center font-display">
                          {t('landing.learnMore')} <div className="ml-2 bg-gray-100 p-2 rounded-full group-hover:bg-vibrant-purple/10 transition-colors"><ArrowRight className="w-4 h-4" /></div>
                       </a>
                    </div>
                  </motion.div>
              </div>
              
              {/* Right Column: The "MAXIMUM DENSITY" Cloud */}
              <div className="mt-12 sm:mt-16 lg:mt-0 relative z-10 h-[500px] lg:h-[700px] w-full flex items-center justify-center perspective-[2000px]">
                 
                 {/* 1. Pulsing Concentric Circles (Background) - BIGGER */}
                 <ConcentricCircles className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] opacity-100" />
                 
                 {/* Background Glows */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-gradient-to-tr from-vibrant-purple/30 to-vibrant-pink/30 rounded-full blur-[100px] animate-pulse -z-10" />

                 <div className="relative w-full h-full max-w-2xl mx-auto">
                    
                    {/* --- ABSTRACT SHAPES LAYER (Back) --- */}

                    {/* Shape 1: Big Organic Blob (Top Left) */}
                    <motion.div
                      animate={{ 
                        y: [0, -25, 0],
                        rotate: [0, -5, 0],
                        borderRadius: ["60% 40% 30% 70% / 60% 30% 70% 40%", "30% 60% 70% 40% / 50% 60% 30% 60%", "60% 40% 30% 70% / 60% 30% 70% 40%"]
                      }}
                      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-10 -left-10 w-48 h-48 lg:w-64 lg:h-64 overflow-hidden shadow-2xl border-[6px] border-white z-0 bg-indigo-50"
                    >
                       <img 
                         src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80" 
                         alt="Education" 
                         className="w-full h-full object-cover opacity-90 hover:scale-110 transition-transform duration-700"
                       />
                    </motion.div>

                    {/* Shape 2: Tilted Square (Top Right) */}
                    <motion.div
                       animate={{ 
                        y: [0, 20, 0],
                        rotate: [10, 15, 10]
                      }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="absolute top-0 right-0 w-40 h-52 lg:w-56 lg:h-72 rounded-[3rem] overflow-hidden shadow-2xl border-[6px] border-white z-10 rotate-12 bg-blue-50"
                    >
                       <img 
                         src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80" 
                         alt="Professional" 
                         className="w-full h-full object-cover opacity-90 hover:scale-110 transition-transform duration-700"
                       />
                    </motion.div>

                    {/* Shape 3: Perfect Circle (Center) - HUGE */}
                    <motion.div
                       animate={{ 
                        scale: [1, 1.02, 1],
                      }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden shadow-2xl border-[8px] border-white z-20 ring-8 ring-vibrant-purple/10 bg-purple-50"
                    >
                       <img 
                         src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80" 
                         alt="Community" 
                         className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                       />
                    </motion.div>

                     {/* Shape 4: Squircle (Bottom Left) */}
                     <motion.div
                       animate={{ 
                        y: [0, -20, 0],
                        rotate: [-5, -10, -5]
                      }}
                      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                      className="absolute bottom-20 -left-4 w-40 h-32 lg:w-60 lg:h-48 rounded-[40px] overflow-hidden shadow-2xl border-[6px] border-white z-10 -rotate-6 bg-pink-50"
                    >
                       <img 
                         src="https://images.unsplash.com/photo-1478860409698-8707f313ee8b?auto=format&fit=crop&w=600&q=80" 
                         alt="Travel" 
                         className="w-full h-full object-cover opacity-90 hover:scale-110 transition-transform duration-700"
                       />
                    </motion.div>

                    {/* Shape 5: Abstract Blob (Bottom Right) */}
                    <motion.div
                      animate={{ 
                        y: [0, 25, 0],
                        borderRadius: ["30% 70% 70% 30% / 30% 30% 70% 70%", "50% 50% 30% 70% / 50% 50% 70% 30%", "30% 70% 70% 30% / 30% 30% 70% 70%"]
                      }}
                      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                      className="absolute bottom-10 right-0 w-36 h-36 lg:w-48 lg:h-48 overflow-hidden shadow-2xl border-[6px] border-white z-10 bg-orange-50"
                    >
                       <img 
                         src="https://images.unsplash.com/photo-1528605248644-14dd0402203f?auto=format&fit=crop&w=600&q=80" 
                         alt="Culture" 
                         className="w-full h-full object-cover opacity-90 hover:scale-110 transition-transform duration-700"
                         onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/anyi_global_logo.png'; }}
                       />
                    </motion.div>

                    {/* --- NEW EXTRA SHAPES FOR "POPULATED" FEEL --- */}
                    
                    {/* Extra Shape 6: Small Circle (Top Middle) */}
                    <motion.div
                       animate={{ y: [0, 15, 0] }}
                       transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 3 }}
                       className="absolute top-0 left-1/3 w-20 h-20 lg:w-28 lg:h-28 rounded-full overflow-hidden shadow-lg border-4 border-white z-0 opacity-80"
                    >
                        <img 
                         src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=300&q=80" 
                         alt="Extra 1" 
                         className="w-full h-full object-cover"
                       />
                    </motion.div>

                    {/* Extra Shape 7: Tiny Squircle (Bottom Middle) */}
                     <motion.div
                       animate={{ y: [0, -15, 0] }}
                       transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 3.5 }}
                       className="absolute bottom-4 left-1/3 w-16 h-16 lg:w-24 lg:h-24 rounded-3xl overflow-hidden shadow-lg border-4 border-white z-20 opacity-90"
                    >
                        <img 
                         src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=80" 
                         alt="Extra 2" 
                         className="w-full h-full object-cover"
                       />
                    </motion.div>


                    {/* --- LAYER 3: Floating UI Cards & Icons (Front) --- */}

                     {/* Card 1: Education Label */}
                     <motion.div
                      animate={{ y: [0, 10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                      className="absolute top-20 -left-8 lg:-left-12 z-40 bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-xl border border-white/60 flex items-center gap-3 hover:scale-110 transition-transform cursor-pointer"
                     >
                       <div className="bg-indigo-100 p-2 rounded-full">
                          <GraduationCap className="w-5 h-5 text-indigo-600" />
                       </div>
                       <div className="text-left">
                           <p className="text-xs font-bold text-gray-800">{t('nav.education')}</p>
                           <p className="text-[10px] text-gray-500">{t('landing.heroFloating.topUniversities')}</p>
                       </div>
                     </motion.div>

                    {/* Card 2: Jobs Label */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                      className="absolute top-12 right-16 lg:right-24 z-40 bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-xl border border-white/60 flex items-center gap-3 hover:scale-110 transition-transform cursor-pointer"
                    >
                       <div className="bg-blue-100 p-2 rounded-full">
                         <Briefcase className="w-5 h-5 text-blue-600" />
                       </div>
                       <div className="text-left">
                           <p className="text-xs font-bold text-gray-800">{t('nav.jobs')}</p>
                           <p className="text-[10px] text-gray-500">{t('landing.heroFloating.newOpenings')}</p>
                       </div>
                    </motion.div>

                    {/* Card 3: Visa Status (Huge) */}
                    <motion.div
                      animate={{ x: [0, 8, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                      className="absolute top-1/2 -left-16 lg:-left-32 -translate-y-1/2 z-50 bg-white/90 backdrop-blur-2xl p-4 rounded-2xl shadow-2xl border border-white/80 flex items-center gap-4 pr-8 hover:scale-105 transition-transform cursor-pointer"
                    >
                      <div className="bg-green-100 p-3 rounded-full relative">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-extrabold text-gray-900">{t('landing.heroFloating.visaApproved')}</p>
                        <p className="text-xs text-gray-500 font-semibold">{t('landing.heroFloating.justNow')}</p>
                      </div>
                    </motion.div>

                    {/* Card 4: Au Pair Label */}
                     <motion.div
                      animate={{ x: [0, -8, 0] }}
                      transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2.2 }}
                      className="absolute top-2/3 right-0 lg:-right-8 z-40 bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-xl border border-white/60 flex items-center gap-3 hover:scale-110 transition-transform cursor-pointer"
                     >
                        <div className="bg-orange-100 p-2 rounded-full">
                           <Baby className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="text-left">
                           <p className="text-xs font-bold text-gray-800">{t('nav.auPair')}</p>
                           <p className="text-[10px] text-gray-500">{t('landing.heroFloating.trustedFamilies')}</p>
                       </div>
                     </motion.div>

                    {/* Card 5: Marketplace Label */}
                     <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                      className="absolute bottom-24 -left-4 lg:left-0 z-40 bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-xl border border-white/60 flex items-center gap-3 hover:scale-110 transition-transform cursor-pointer"
                     >
                        <div className="bg-pink-100 p-2 rounded-full">
                           <ShoppingBag className="w-5 h-5 text-pink-600" />
                        </div>
                        <div className="text-left">
                           <p className="text-xs font-bold text-gray-800">{t('nav.marketplace')}</p>
                           <p className="text-[10px] text-gray-500">{t('landing.heroFloating.trendingItems')}</p>
                       </div>
                     </motion.div>

                    {/* Card 6: Community Status (Huge) */}
                    <motion.div
                      animate={{ y: [0, 10, 0] }}
                      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2.8 }}
                      className="absolute bottom-0 right-10 lg:-bottom-8 lg:right-0 z-50 bg-white/90 backdrop-blur-2xl p-4 rounded-2xl shadow-2xl border border-white/80 flex items-center gap-4 pr-8 hover:scale-105 transition-transform cursor-pointer"
                    >
                      <div className="bg-purple-100 p-3 rounded-full">
                        <MessageSquare className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-extrabold text-gray-900">{t('nav.community')}</p>
                        <p className="text-xs text-gray-500 font-semibold">{t('landing.heroFloating.activeMembers')}</p>
                      </div>
                    </motion.div>
                    
                    {/* Floating Icons - SCATTERED EVERYWHERE */}
                     <motion.div
                      animate={{ y: [0, -30, 0], x: [0, 15, 0], rotate: [0, 10, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-12 right-1/2 w-14 h-14 bg-white shadow-xl rounded-full flex items-center justify-center z-20 text-3xl border-4 border-white/50"
                    >
                       <span>🇨🇳</span>
                    </motion.div>

                    <motion.div
                      animate={{ y: [0, 30, 0], x: [0, -15, 0], rotate: [0, -10, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="absolute -bottom-12 left-1/2 w-16 h-16 bg-white shadow-xl rounded-full flex items-center justify-center z-40 text-4xl border-4 border-white/50"
                    >
                       <span>🌏</span>
                    </motion.div>
                    
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                      className="absolute top-1/2 right-0 w-10 h-10 bg-vibrant-pink shadow-lg rounded-full flex items-center justify-center z-40 text-white"
                    >
                       <Heart className="w-5 h-5 fill-current" />
                    </motion.div>

                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Section - "4-over-3" Interlock Grid */}
      <div id="services" className="relative py-16 sm:py-24 scroll-mt-20">
        <BackgroundBlobs className="opacity-40 top-1/2 left-0 w-full" />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-12">
               <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-vibrant-purple to-vibrant-pink animate-gradient-x">{t('landing.exploreServices')}</h2>
               <p className="mt-2 text-gray-600">{t('landing.exploreServicesSubtitle')}</p>
            </div>
            
            <motion.div 
               variants={container}
               initial="hidden"
               whileInView="show"
               viewport={{ once: true, margin: "-100px" }}
               className="flex flex-col gap-6"
            >
               {/* Top Row: 4 Items (Jobs, Marketplace, Events, Education) */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {modules.slice(0, 4).map((module) => (
                      <Link key={module.link} to={module.link} className="col-span-1 h-80">
                          <motion.div variants={item} className="h-full w-full">
                             <GlowingCard 
                                title={module.title}
                                icon={module.icon}
                                description={user ? undefined : (t(`landing.${module.link.replace('/','').replace(/-([a-z])/g, (g) => g[1].toUpperCase())}Desc`) || module.title)}
                                color={module.color}
                                features={module.features}
                             />
                          </motion.div>
                      </Link>
                  ))}
               </div>

               {/* Bottom Row: 3 Items (Visa, Au Pair, Community) - Wider Cards */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {/* Visa */}
                  <Link to={modules[4].link} className="col-span-1 h-72">
                      <motion.div variants={item} className="h-full w-full">
                         < GlowingCard 
                            title={modules[4].title}
                            icon={modules[4].icon}
                            description={user ? undefined : (t(`landing.${modules[4].link.replace('/','').replace(/-([a-z])/g, (g) => g[1].toUpperCase())}Desc`) || modules[4].title)}
                            color={modules[4].color}
                            features={modules[4].features}
                         />
                      </motion.div>
                  </Link>
                  
                   {/* Au Pair */}
                  <Link to={modules[5].link} className="col-span-1 h-72">
                      <motion.div variants={item} className="h-full w-full">
                         <GlowingCard 
                            title={modules[5].title}
                            icon={modules[5].icon}
                            description={user ? undefined : (t(`landing.${modules[5].link.replace('/','').replace(/-([a-z])/g, (g) => g[1].toUpperCase())}Desc`) || modules[5].title)}
                            color={modules[5].color}
                            features={modules[5].features}
                         />
                      </motion.div>
                  </Link>

                  {/* Community */}
                  <Link to="/community" className="col-span-1 h-72">
                     <motion.div variants={item} className="h-full w-full">
                        <GlowingCard
                           title={t('nav.community')}
                           icon={MessageSquare}
                           description={t('landing.joinCommunityText')}
                           color="bg-teal-500"
                           className="w-full"
                           features={[t('landing.communityFeature1'), t('landing.communityFeature2'), t('landing.communityFeature3')]}
                        />
                     </motion.div>
                  </Link>
               </div>

            </motion.div>
        </div>
      </div>
      
      {/* Community Section DELETED as requested */}

    </div>
  );
}
