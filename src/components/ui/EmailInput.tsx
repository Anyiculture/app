import { useState, ChangeEvent } from 'react';
import { useI18n } from '../../contexts/I18nContext';

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  helpText?: string;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function EmailInput({
  value,
  onChange,
  label,
  required = false,
  placeholder = 'example@email.com',
  className = '',
  helpText
}: EmailInputProps) {
  const { t } = useI18n();
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const validateEmail = (email: string) => {
    if (!email) {
      if (required) {
        setError(t('errors.emailRequired'));
        return false;
      }
      setError('');
      return true;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError(t('errors.invalidEmail'));
      return false;
    }

    setError('');
    return true;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (touched) {
      validateEmail(newValue);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validateEmail(value);
  };

  const isValid = !error && value && EMAIL_REGEX.test(value);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="email"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            error && touched
              ? 'border-red-500 focus:ring-red-500'
              : isValid
              ? 'border-green-500 focus:ring-green-500'
              : 'border-gray-300'
          }`}
          required={required}
        />

        {/* Validation Icon */}
        {touched && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <span className="text-green-500 text-xl">✓</span>
            ) : error ? (
              <span className="text-red-500 text-xl">✗</span>
            ) : null}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && touched && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <span className="text-red-500">⚠</span> {error}
        </p>
      )}

      {/* Help Text */}
      {!error && helpText && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
}
