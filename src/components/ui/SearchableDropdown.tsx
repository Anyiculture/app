import { useState, useRef, useEffect, useMemo } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { clsx } from 'clsx';

interface Option {
  id: string;
  label: string;
  keywords?: string[]; // Extra searchable keywords
}

interface SearchableDropdownProps {
  label: string;
  options: Option[];
  value: string[]; // Multiselect by default for now, can separate if needed
  onChange: (value: string[]) => void;
  maxSelection?: number;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  className?: string;
}

export function SearchableDropdown({
  label,
  options,
  value,
  onChange,
  maxSelection,
  placeholder = 'Select options...',
  searchPlaceholder,
  error,
  className
}: SearchableDropdownProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const lowerQuery = searchQuery.toLowerCase();
    
    return options.filter(opt => 
      opt.label.toLowerCase().includes(lowerQuery) || 
      opt.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
    );
  }, [options, searchQuery]);

  const handleSelect = (optionId: string) => {
    if (value.includes(optionId)) {
      onChange(value.filter(id => id !== optionId));
    } else {
      if (maxSelection && value.length >= maxSelection) return;
      onChange([...value, optionId]);
    }
    // Don't close for multiselect
  };

  const removeValue = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== id));
  };

  const selectedLabels = options
    .filter(opt => value.includes(opt.id))
    .map(opt => ({ id: opt.id, label: opt.label }));

  return (
    <div className={className} ref={containerRef}>
      <div className="flex justify-between items-baseline mb-1">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {maxSelection && (
          <span className={clsx("text-xs", value.length >= maxSelection ? "text-orange-600 font-medium" : "text-gray-500")}>
            {value.length}/{maxSelection}
          </span>
        )}
      </div>

      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "relative w-full cursor-pointer bg-white border rounded-lg py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none sm:text-sm min-h-[42px] flex items-center flex-wrap gap-1.5",
            error ? "border-red-300 ring-red-500" : "border-gray-300 focus:ring-blue-500",
            isOpen && "ring-1 ring-blue-500 border-blue-500"
          )}
        >
          {selectedLabels.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            selectedLabels.map(opt => (
              <span key={opt.id} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                {opt.label}
                <button
                  onClick={(e) => removeValue(e, opt.id)}
                  className="ml-1 inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))
          )}
          
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className={clsx("h-5 w-5 text-gray-400 targsition-transform", isOpen && "rotate-180")} />
          </span>
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 max-h-72 w-full overflow-hidden rounded-md bg-white text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm animate-in fade-in zoom-in-95 duration-100 flex flex-col">
            
            {/* Search Input */}
            <div className="border-b border-gray-100 p-2 sticky top-0 bg-white z-10">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  autoFocus
                  className="w-full rounded-md border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={searchPlaceholder || t('common.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()} // Prevent closing
                />
              </div>
            </div>

            {/* Options List */}
            <div className="overflow-auto flex-1 py-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  {t('common.noResults')}
                </div>
              ) : (
                filteredOptions.map((option) => {
                   const isSelected = value.includes(option.id);
                   const isMaxReached = maxSelection ? value.length >= maxSelection : false;
                   const isDisabled = !isSelected && isMaxReached;

                   return (
                    <div
                      key={option.id}
                      onClick={() => !isDisabled && handleSelect(option.id)}
                      className={clsx(
                        "relative cursor-default select-none py-2.5 pl-3 pr-9",
                        isSelected ? "bg-blue-50 text-blue-900" : "text-gray-900 hover:bg-gray-50",
                        isDisabled && "opacity-50 cursor-not-allowed hover:bg-white"
                      )}
                    >
                      <div className="flex items-center">
                        <span className={clsx("block truncate", isSelected && "font-semibold")}>
                          {option.label}
                        </span>
                      </div>

                      {isSelected && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600 animate-pulse">{error}</p>}
    </div>
  );
}
