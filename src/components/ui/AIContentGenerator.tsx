import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { aiService, GenerateContentParams, GeneratedContent, GeneratedImage } from '../../services/aiService';
import { useI18n } from '../../contexts/I18nContext';
import { Button } from './Button';

interface AIContentGeneratorProps {
  contentType: 'marketplace' | 'education';
  category?: string;
  programType?: string;
  onContentGenerated: (content: GeneratedContent) => void;
  onImagesGenerated?: (images: GeneratedImage[]) => void;
  disabled?: boolean;
}

export function AIContentGenerator({
  contentType,
  category,
  programType,
  onContentGenerated,
  onImagesGenerated,
  disabled = false,
}: AIContentGeneratorProps) {
  const { t, language } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: GenerateContentParams = {
        contentType,
        category,
        programType,
        preferences: {
          language,
          tone: 'professional',
        },
      };

      if (onImagesGenerated) {
        // Generate both content and images
        const { content, images } = await aiService.generateListingWithImages(params);
        onContentGenerated(content);
        onImagesGenerated(images);
      } else {
        // Generate content only
        const content = await aiService.generateContent(params);
        onContentGenerated(content);
      }
    } catch (err: any) {
      console.error('AI Generation Error:', err);
      setError(err.message || t('common.ai.generationError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={handleGenerate}
        disabled={disabled || loading}
        variant="outline"
        className="w-full sm:w-auto flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-purple-200 text-purple-700 font-semibold"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>{t('common.ai.generating')}</span>
          </>
        ) : (
          <>
            <Sparkles size={16} />
            <span>{t('common.ai.generateWithAI')}</span>
          </>
        )}
      </Button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="text-purple-600 mt-0.5 flex-shrink-0 animate-pulse" />
            <div className="text-sm text-purple-800">
              <p className="font-semibold mb-1">{t('common.ai.generatingContent')}</p>
              <p className="text-purple-600">{t('common.ai.pleaseWait')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
