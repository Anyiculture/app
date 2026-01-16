import { useState, ChangeEvent } from 'react';

// Comprehensive country calling codes A-Z
const COUNTRY_CODES = [
  { code: '+93', country: 'Afghanistan', flag: '🇦🇫', pattern: /^\d{9}$/ },
  { code: '+355', country: 'Albania', flag: '🇦🇱', pattern: /^\d{9}$/ },
  { code: '+213', country: 'Algeria', flag: '🇩🇿', pattern: /^\d{9}$/ },
  { code: '+54', country: 'Argentina', flag: '🇦🇷', pattern: /^\d{10}$/ },
  { code: '+61', country: 'Australia', flag: '🇦🇺', pattern: /^\d{9}$/ },
  { code: '+43', country: 'Austria', flag: '🇦🇹', pattern: /^\d{10,11}$/ },
  { code: '+32', country: 'Belgium', flag: '🇧🇪', pattern: /^\d{9}$/ },
  { code: '+55', country: 'Brazil', flag: '🇧🇷', pattern: /^\d{11}$/ },
  { code: '+1', country: 'Canada', flag: '🇨🇦', pattern: /^\d{10}$/ },
  { code: '+86', country: 'China', flag: '🇨🇳', pattern: /^\d{11}$/ },
  { code: '+57', country: 'Colombia', flag: '🇨🇴', pattern: /^\d{10}$/ },
  { code: '+45', country: 'Denmark', flag: '🇩🇰', pattern: /^\d{8}$/ },
  { code: '+20', country: 'Egypt', flag: '🇪🇬', pattern: /^\d{10}$/ },
  { code: '+358', country: 'Finland', flag: '🇫🇮', pattern: /^\d{9,10}$/ },
  { code: '+33', country: 'France', flag: '🇫🇷', pattern: /^\d{9}$/ },
  { code: '+49', country: 'Germany', flag: '🇩🇪', pattern: /^\d{10,11}$/ },
  { code: '+30', country: 'Greece', flag: '🇬🇷', pattern: /^\d{10}$/ },
  { code: '+852', country: 'Hong Kong', flag: '🇭🇰', pattern: /^\d{8}$/ },
  { code: '+91', country: 'India', flag: '🇮🇳', pattern: /^\d{10}$/ },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩', pattern: /^\d{10,12}$/ },
  { code: '+98', country: 'Iran', flag: '🇮🇷', pattern: /^\d{10}$/ },
  { code: '+353', country: 'Ireland', flag: '🇮🇪', pattern: /^\d{9}$/ },
  { code: '+972', country: 'Israel', flag: '🇮🇱', pattern: /^\d{9}$/ },
  { code: '+39', country: 'Italy', flag: '🇮🇹', pattern: /^\d{10}$/ },
  { code: '+81', country: 'Japan', flag: '🇯🇵', pattern: /^\d{10}$/ },
  { code: '+82', country: 'South Korea', flag: '🇰🇷', pattern: /^\d{10,11}$/ },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', pattern: /^\d{9,10}$/ },
  { code: '+52', country: 'Mexico', flag: '🇲🇽', pattern: /^\d{10}$/ },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱', pattern: /^\d{9}$/ },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿', pattern: /^\d{9}$/ },
  { code: '+47', country: 'Norway', flag: '🇳🇴', pattern: /^\d{8}$/ },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰', pattern: /^\d{10}$/ },
  { code: '+63', country: 'Philippines', flag: '🇵🇭', pattern: /^\d{10}$/ },
  { code: '+48', country: 'Poland', flag: '🇵🇱', pattern: /^\d{9}$/ },
  { code: '+351', country: 'Portugal', flag: '🇵🇹', pattern: /^\d{9}$/ },
  { code: '+7', country: 'Russia', flag: '🇷🇺', pattern: /^\d{10}$/ },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', pattern: /^\d{9}$/ },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', pattern: /^\d{8}$/ },
  { code: '+27', country: 'South Africa', flag: '🇿🇦', pattern: /^\d{9}$/ },
  { code: '+34', country: 'Spain', flag: '🇪🇸', pattern: /^\d{9}$/ },
  { code: '+46', country: 'Sweden', flag: '🇸🇪', pattern: /^\d{9}$/ },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭', pattern: /^\d{9}$/ },
  { code: '+886', country: 'Taiwan', flag: '🇹🇼', pattern: /^\d{9}$/ },
  { code: '+66', country: 'Thailand', flag: '🇹🇭', pattern: /^\d{9}$/ },
  { code: '+90', country: 'Turkey', flag: '🇹🇷', pattern: /^\d{10}$/ },
  { code: '+971', country: 'UAE', flag: '🇦🇪', pattern: /^\d{9}$/ },
  { code: '+44', country: 'UK', flag: '🇬🇧', pattern: /^\d{10}$/ },
  { code: '+1', country: 'USA', flag: '🇺🇸', pattern: /^\d{10}$/ },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳', pattern: /^\d{9,10}$/ },
].sort((a, b) => a.country.localeCompare(b.country));

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  defaultCountryCode?: string;
  disabled?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  label,
  required = false,
  placeholder = '',
  className = '',
  defaultCountryCode = '+86',
  disabled = false
}: PhoneInputProps) {
  // Parse existing value or use default
  const parsePhoneValue = (val: string) => {
    if (!val) return { code: defaultCountryCode, number: '' };
    
    const match = COUNTRY_CODES.find(c => val.startsWith(c.code));
    if (match) {
      return {
        code: match.code,
        number: val.substring(match.code.length).trim()
      };
    }
    return { code: defaultCountryCode, number: val };
  };

  const [countryCode, setCountryCode] = useState(parsePhoneValue(value).code);
  const [phoneNumber, setPhoneNumber] = useState(parsePhoneValue(value).number);
  const [error, setError] = useState('');

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode);

  const validatePhone = (code: string, number: string) => {
    if (!number) {
      setError('');
      return true;
    }

    const country = COUNTRY_CODES.find(c => c.code === code);
    if (!country) return false;

    // Remove spaces and dashes for validation
    const cleanNumber = number.replace(/[\s-]/g, '');
    
    if (!country.pattern.test(cleanNumber)) {
      setError(`Invalid ${country.country} phone number format`);
      return false;
    }

    setError('');
    return true;
  };

  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    validatePhone(newCode, phoneNumber);
    onChange(`${newCode} ${phoneNumber}`);
  };

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value;
    setPhoneNumber(newNumber);
    validatePhone(countryCode, newNumber);
    onChange(`${countryCode} ${newNumber}`);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <select
          value={countryCode}
          onChange={handleCountryChange}
          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:text-gray-500"
          required={required}
          disabled={disabled}
        >
          {COUNTRY_CODES.map((country) => (
            <option key={country.code + country.country} value={country.code}>
              {country.flag} {country.code}
            </option>
          ))}
        </select>

        {/* Phone Number Input */}
        <div className="flex-1">
          <input
            type="tel"
            value={phoneNumber}
            onChange={handleNumberChange}
            placeholder={placeholder || (selectedCountry ? `${selectedCountry.country} number` : 'Phone number')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-500' : 'border-gray-300'
            } disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`}
            required={required}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <span className="text-red-500">⚠</span> {error}
        </p>
      )}

      {/* Help Text */}
      {!error && selectedCountry && phoneNumber && (
        <p className="mt-1 text-xs text-gray-500">
          Format: {selectedCountry.country} phone number
        </p>
      )}
    </div>
  );
}
