import { useState, useEffect } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { translationService } from '../../services/translationService';
import { useI18n } from '../../contexts/I18nContext';

interface TranslateWrapperProps {
  text: string;
  dbTranslation?: string | null;
  className?: string;
  as?: any;
}

export function TranslateWrapper({ text, dbTranslation, className = '', as: Component = 'span' }: TranslateWrapperProps) {
  const { language } = useI18n();
  const [showTranslated, setShowTranslated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(dbTranslation || null);

  // Reset state when text changes
  useEffect(() => {
    setTranslatedText(dbTranslation || null);
    setShowTranslated(false);
  }, [text, dbTranslation]);

  // Determine target language based on UI language
  const targetLang = language === 'zh' ? 'zh' : 'en';

  const handleTranslate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (showTranslated) {
      setShowTranslated(false);
      return;
    }

    if (translatedText && translatedText !== text) {
      setShowTranslated(true);
      return;
    }

    setLoading(true);
    try {
      const result = await translationService.translateText(text, targetLang);
      setTranslatedText(result);
      setShowTranslated(true);
    } catch (error) {
      console.error('Translation failed', error);
    } finally {
      setLoading(false);
    }
  };

  const displayText = showTranslated && translatedText ? translatedText : text;

  return (
    <Component className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="truncate">{displayText}</span>
      <button
        onClick={handleTranslate}
        disabled={loading}
        className="text-vibrant-purple/70 hover:text-vibrant-purple hover:bg-vibrant-purple/10 p-0.5 rounded transition-colors flex-shrink-0"
        title={showTranslated ? "Show Original" : "Translate"}
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Languages size={12} className={showTranslated ? "fill-current" : ""} />
        )}
      </button>
    </Component>
  );
}
