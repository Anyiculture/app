import { useEffect, useState } from 'react';
import { Country, State, City } from 'country-state-city';
import { MapPin, Globe, Building } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

interface GlobalLocationSelectorProps {
  country?: string;
  state?: string;
  city?: string;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  className?: string;
}

export function GlobalLocationSelector({
  country,
  state,
  city,
  onCountryChange,
  onStateChange,
  onCityChange,
  className = ''
}: GlobalLocationSelectorProps) {
  const { t, language } = useI18n();
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  // Use Intl.DisplayNames for translations
  const regionNames = new Intl.DisplayNames([language === 'zh' ? 'zh-CN' : 'en-US'], { type: 'region' });

  // Load countries on mount
  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  // Update states when country changes
  useEffect(() => {
    if (country) {
      setStates(State.getStatesOfCountry(country));
      // If current state doesn't belong to new country, reset it
      if (state && !State.getStatesOfCountry(country).find(s => s.isoCode === state)) {
        onStateChange('');
        onCityChange('');
      }
    } else {
      setStates([]);
    }
  }, [country]);

  // Update cities when state changes
  useEffect(() => {
    if (country && state) {
      setCities(City.getCitiesOfState(country, state));
      // If current city doesn't belong to new state, reset it
      if (city && !City.getCitiesOfState(country, state).find(c => c.name === city)) {
        onCityChange('');
      }
    } else {
      setCities([]);
    }
  }, [country, state]);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {/* Country Selector */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">{t('common.location.country')}</label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={country}
            onChange={(e) => {
              onCountryChange(e.target.value);
              onStateChange('');
              onCityChange('');
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
          >
            <option value="">{t('common.location.selectCountry')}</option>
            {countries.map((c) => (
              <option key={c.isoCode} value={c.isoCode}>
                {regionNames.of(c.isoCode)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* State/Province Selector */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">{t('common.location.province')}</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={state}
            onChange={(e) => {
              onStateChange(e.target.value);
              onCityChange('');
            }}
            disabled={!country}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">{t('common.location.selectProvince')}</option>
            {states.map((s) => (
              <option key={s.isoCode} value={s.isoCode}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* City Selector */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">{t('common.location.city')}</label>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            disabled={!state}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">{t('common.location.selectCity')}</option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
