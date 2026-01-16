import { useState, useMemo } from 'react';
import { Search, X, Briefcase } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { JOB_CATEGORIES } from '../constants/jobCategories';

interface CategorySelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  showSubcategories?: boolean;
  maxSelections?: number;
  disabled?: boolean;
}

export function CategorySelector({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  showSubcategories = true,
  maxSelections,
  disabled = false
}: CategorySelectorProps) {
  const { t, language } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedValues = value || [];

  const filteredItems = useMemo(() => {
    if (!searchQuery) {
      return JOB_CATEGORIES.flatMap((cat) =>
        showSubcategories
          ? cat.subcategories.map((sub) => ({
              id: `${cat.id}:${sub.id}`,
              category_id: cat.id,
              category_name: t(`jobCategories.${cat.id}.name`),
              name: t(`jobCategories.${cat.id}.subcategories.${sub.id}.name`),
            }))
          : [{
              id: cat.id,
              category_id: cat.id,
              category_name: t(`jobCategories.${cat.id}.name`),
              name: t(`jobCategories.${cat.id}.name`),
            }]
      );
    }

    const query = searchQuery.toLowerCase();
    return JOB_CATEGORIES.flatMap((cat) =>
      showSubcategories
        ? cat.subcategories
            .filter(
              (sub) =>
                t(`jobCategories.${cat.id}.subcategories.${sub.id}.name`).toLowerCase().includes(query) ||
                t(`jobCategories.${cat.id}.name`).toLowerCase().includes(query)
            )
            .map((sub) => ({
              id: `${cat.id}:${sub.id}`,
              category_id: cat.id,
              category_name: t(`jobCategories.${cat.id}.name`),
              name: t(`jobCategories.${cat.id}.subcategories.${sub.id}.name`),
            }))
        : t(`jobCategories.${cat.id}.name`).toLowerCase().includes(query)
        ? [{
            id: cat.id,
            category_id: cat.id,
            category_name: t(`jobCategories.${cat.id}.name`),
            name: t(`jobCategories.${cat.id}.name`),
          }]
        : []
    );
  }, [searchQuery, language, showSubcategories, t]);

  const handleSelect = (itemId: string) => {
    const newValue = selectedValues.includes(itemId)
      ? selectedValues.filter((c) => c !== itemId)
      : maxSelections && selectedValues.length >= maxSelections
      ? selectedValues
      : [...selectedValues, itemId];
    onChange(newValue);
  };

  const handleRemove = (itemId: string) => {
    onChange(selectedValues.filter((c) => c !== itemId));
  };

  const getDisplayName = (itemId: string) => {
    for (const cat of JOB_CATEGORIES) {
      if (!showSubcategories && cat.id === itemId) {
        return t(`jobCategories.${cat.id}.name`);
      }
      if (showSubcategories) {
        const [catId, subId] = itemId.split(':');
        if (cat.id === catId) {
          const sub = cat.subcategories.find((s) => s.id === subId);
          if (sub) {
            return t(`jobCategories.${cat.id}.subcategories.${sub.id}.name`);
          }
        }
      }
    }
    return itemId;
  };

  // Group by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof filteredItems> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category_name]) {
        groups[item.category_name] = [];
      }
      groups[item.category_name].push(item);
    });
    return groups;
  }, [filteredItems]);

  const categories = Object.keys(groupedItems).sort();

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
          {selectedValues.map((itemId) => (
            <span
              key={itemId}
              className={`inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm ${disabled ? 'opacity-70' : ''}`}
            >
              <Briefcase size={14} />
              {getDisplayName(itemId)}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(itemId)}
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
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder || t('categorySelector.placeholder')}
          className={`w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
          disabled={disabled}
        />
        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
      </div>

      {maxSelections && (
        <p className="text-xs text-gray-500 mt-1">
          {t('categorySelector.maxSelections', { current: selectedValues.length, max: maxSelections })}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
            <div className="p-2">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  {t('categorySelector.noResults')}
                </div>
              ) : (
                categories.map((categoryName) => (
                  <div key={categoryName} className="mb-4">
                    <div className="px-2 py-1 text-xs font-bold text-gray-500 uppercase sticky top-0 bg-white">
                      {categoryName}
                    </div>
                    {groupedItems[categoryName].map((item) => {
                      const isSelected = selectedValues.includes(item.id);
                      const canSelect = !maxSelections || selectedValues.length < maxSelections || isSelected;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => canSelect && handleSelect(item.id)}
                          disabled={!canSelect}
                          className={`w-full text-left px-4 py-2 rounded transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : canSelect
                              ? 'hover:bg-gray-50 text-gray-700'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{item.name}</span>
                            {isSelected && <span className="text-blue-600">✓</span>}
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
