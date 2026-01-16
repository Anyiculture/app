import { useState, useRef } from 'react';
import { Upload, X, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../contexts/I18nContext';

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucketName?: string;
  acceptedTypes?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  label?: string;
}

export function FileUpload({
  value = '',
  onChange,
  bucketName = 'resumes',
  acceptedTypes = '.pdf,.doc,.docx',
  maxSizeMB = 10,
  disabled = false,
  label
}: FileUploadProps) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(t('common.upload.errorSize', { size: maxSizeMB }));
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

      onChange(publicUrl);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    try {
      if (value) {
        const fileName = value.split('/').pop();
        if (fileName) {
          await supabase.storage.from(bucketName).remove([fileName]);
        }
      }
      onChange('');
    } catch (err) {
      console.error('Error removing file:', err);
    }
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
             <CheckCircle size={14} className="text-green-600" />
             <span className="truncate max-w-[200px]">{value.split('/').pop()}</span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
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
               <span>{label || t('common.upload.uploadDocument')}</span>
               <span className="text-xs font-normal text-gray-400 ml-1">
                 ({t('common.upload.maxSize', { size: maxSizeMB })})
               </span>
             </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
