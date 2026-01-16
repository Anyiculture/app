import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../contexts/I18nContext';


interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  bucketName?: string;
  disabled?: boolean;
}

export function ImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  bucketName = 'images',
  disabled = false
}: ImageUploadProps) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (value.length + files.length > maxImages) {
      setError(t('common.upload.errorMaxImages', { count: maxImages }));
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = files.map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error(t('common.upload.errorImageOnly'));
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error(t('common.upload.errorSize', { size: 5 }));
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...value, ...uploadedUrls]);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async (urlToRemove: string) => {
    try {
      const fileName = urlToRemove.split('/').pop();
      if (fileName) {
        await supabase.storage.from(bucketName).remove([fileName]);
      }
      onChange(value.filter(url => url !== urlToRemove));
    } catch (err) {
      console.error('Error removing image:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative group w-24 h-24 rounded-xl overflow-hidden bg-gray-100 ring-1 ring-black/5 shadow-sm">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                disabled={disabled}
                className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        {value.length < maxImages && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all disabled:opacity-50 disabled:no-underline"
            >
              {uploading ? (
                 <>
                   <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                   <span>{t('common.upload.uploading')}</span>
                 </>
              ) : (
                 <>
                   <Upload size={16} />
                   <span>{t('common.upload.uploadImage')}</span>
                 </>
              )}
            </button>
            <span className="text-xs text-gray-400">({value.length}/{maxImages})</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="text-sm text-gray-500">
        <p>• {t('common.upload.maxImages', { count: maxImages })}</p>
        <p>• {t('common.upload.maxSizePerImage', { size: 5 })}</p>
        <p>• {t('common.upload.supportedFormats')}</p>
      </div>
      </div>
    </div>
  );
}
