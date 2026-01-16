import { useState, useMemo } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { CHINA_CITIES_BILINGUAL } from '../constants/cities';

interface CitySelectorProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  label?: string;
  placeholder?: string;
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
}

export function CitySelector({
  value,
  onChange,
  label,
  placeholder,
  multiple = false,
  required = false,
  disabled = false,
}: CitySelectorProps) {
  const { t, language } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const filteredCities = useMemo(() => {
    if (!searchQuery) return CHINA_CITIES_BILINGUAL;
    const query = searchQuery.toLowerCase();
    return CHINA_CITIES_BILINGUAL.filter(
      (city) =>
        city.en.toLowerCase().includes(query) ||
        city.zh.includes(query)
    );
  }, [searchQuery]);

  const handleSelect = (cityEn: string) => {
    if (multiple) {
      const newValue = selectedValues.includes(cityEn)
        ? selectedValues.filter((c) => c !== cityEn)
        : [...selectedValues, cityEn];
      onChange(newValue);
    } else {
      onChange(cityEn);
      setIsOpen(false);
    }
  };

  const handleRemove = (cityEn: string) => {
    if (multiple) {
      onChange(selectedValues.filter((c) => c !== cityEn));
    } else {
      onChange('');
    }
  };

  const getDisplayName = (cityEn: string) => {
    const city = CHINA_CITIES_BILINGUAL.find((c) => c.en === cityEn);
    if (!city) return cityEn;
    return language === 'zh' ? city.zh : city.en;
  };

  // Group cities by first letter
  const groupedCities = useMemo(() => {
    const groups: Record<string, typeof CHINA_CITIES_BILINGUAL> = {};
    filteredCities.forEach((city) => {
      const firstLetter = city.en[0].toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(city);
    });
    return groups;
  }, [filteredCities]);

  const letters = Object.keys(groupedCities).sort();

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Selected values display */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedValues.map((cityEn) => (
            <span
              key={cityEn}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm"
            >
              <MapPin size={14} />
              {getDisplayName(cityEn)}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(cityEn)}
                  className="hover:text-blue-900"
                >
                  <X size={14} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Input field */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || t('citySelector.placeholder')}
          disabled={disabled}
          className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
            {/* Alphabet quick jump */}
            <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-200 flex flex-wrap gap-1">
              {letters.map((letter) => (
                <a
                  key={letter}
                  href={`#letter-${letter}`}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 px-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {letter}
                </a>
              ))}
            </div>

            {/* City list */}
            <div className="p-2">
              {filteredCities.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  {t('citySelector.noResults')}
                </div>
              ) : (
                letters.map((letter) => (
                  <div key={letter} id={`letter-${letter}`} className="mb-4">
                    <div className="px-2 py-1 text-xs font-bold text-gray-500 uppercase sticky top-12 bg-white">
                      {letter}
                    </div>
                    {groupedCities[letter].map((city) => {
                      const isSelected = selectedValues.includes(city.en);
                      return (
                        <button
                          key={city.en}
                          type="button"
                          onClick={() => handleSelect(city.en)}
                          className={`w-full text-left px-4 py-2 rounded hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>
                              {language === 'zh' ? city.zh : city.en}
                              {language === 'zh' && (
                                <span className="text-gray-400 text-sm ml-2">{city.en}</span>
                              )}
                            </span>
                            {isSelected && (
                              <span className="text-blue-600">✓</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
