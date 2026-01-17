import { useI18n } from '../contexts/I18nContext';
import { Linkedin, Twitter, Facebook, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 py-6">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          
          {/* Brand & Copyright */}
          <div className="flex items-center gap-4">
            <span className="font-bold text-gray-900 text-sm">{t('common.brand')}</span>
            <span>&copy; {currentYear}</span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="hidden sm:inline">{t('common.brandEmail')}</span>
          </div>

          {/* Minimal Links */}
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-blue-600 transition-colors">{t('landing.footer.aboutUs')}</Link>
            <Link to="/privacy" className="hover:text-blue-600 transition-colors">{t('landing.footer.privacy')}</Link>
            <Link to="/terms" className="hover:text-blue-600 transition-colors">{t('landing.footer.terms')}</Link>
          </div>

          {/* Simple Socials */}
          <div className="flex gap-4 opacity-60 hover:opacity-100 transition-opacity">
             <a href="#" className="hover:text-blue-600"><Facebook size={14} /></a>
             <a href="#" className="hover:text-blue-600"><Twitter size={14} /></a>
             <a href="#" className="hover:text-blue-600"><Linkedin size={14} /></a>
             <a href="#" className="hover:text-blue-600"><Instagram size={14} /></a>
          </div>

        </div>
      </div>
    </footer>
  );
}
