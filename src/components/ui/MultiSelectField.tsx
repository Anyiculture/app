import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useI18n } from '../../contexts/I18nContext';

interface Option {
  id: string;
  label: string;
}

interface MultiSelectFieldProps {
  label: string;
  description?: string; // Help text
  options: Option[];
  value: string[]; // Selected IDs
  onChange: (value: string[]) => void;
  maxSelection?: number;
  error?: string;
  className?: string;
  allowOther?: boolean;
  otherText?: string;
  onOtherTextChange?: (text: string) => void;
  placeholder?: string;
  variant?: 'dropdown' | 'grid';
  disabled?: boolean;
}

export function MultiSelectField({
  label,
  description,
  options,
  value,
  onChange,
  maxSelection,
  error,
  className,
  allowOther = false,
  otherText = '',
  onOtherTextChange,
  placeholder = "Select options...",
  variant = 'dropdown',
  disabled = false
}: MultiSelectFieldProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (optionId: string) => {
    if (disabled) return;
    if (value.includes(optionId)) {
      onChange(value.filter(id => id !== optionId));
    } else {
      if (maxSelection && value.length >= maxSelection) {
        return;
      }
      onChange([...value, optionId]);
    }
  };

  const isSelected = (id: string) => value.includes(id);
  
  const selectedLabels = options
    .filter(opt => value.includes(opt.id))
    .map(opt => opt.label);
    
  if (value.includes('other')) {
    selectedLabels.push(t('onboarding.other'));
  }

  const showOtherInput = allowOther && value.includes('other');

  return (
    <div className={twMerge("space-y-2", className)} ref={containerRef}>
      <div className="flex justify-between items-baseline">
        <label className="block text-sm font-semibold text-gray-900">
          {label}
        </label>
        {maxSelection && (
          <span className={clsx("text-xs", value.length >= maxSelection ? "text-pink-600 font-bold" : "text-gray-500")}>
             {value.length}/{maxSelection}
          </span>
        )}
      </div>

      {description && (
        <p className="text-sm text-gray-500 mb-2">
          {description}
        </p>
      )}

      {variant === 'dropdown' ? (
        <div className="relative">
          {/* Trigger */}
          <div 
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={clsx(
              "relative w-full bg-white border rounded-lg py-2.5 px-3 text-left shadow-sm focus:outline-none focus:ring-1 sm:text-sm flex items-center justify-between min-h-[42px]",
              disabled ? "cursor-not-allowed bg-gray-50 text-gray-500" : "cursor-pointer",
              error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-gray-200 focus:ring-pink-500 focus:border-pink-500",
              isOpen && "ring-1 ring-pink-500 border-pink-500"
            )}
          >
            <div className="flex flex-wrap gap-1.5 mr-6">
              {selectedLabels.length === 0 ? (
                <span className="text-gray-400 block truncate">{placeholder}</span>
              ) : (
                selectedLabels.map((label, idx) => (
                  <span key={idx} className="inline-flex items-center rounded-md bg-pink-50 px-2 py-0.5 text-xs font-medium text-pink-700 ring-1 ring-inset ring-pink-700/10">
                    {label}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const id = label === 'Other' ? 'other' : options.find(o => o.label === label)?.id;
                          if(id) handleSelect(id);
                        }}
                        className="ml-1 inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-full text-pink-400 hover:bg-pink-100 hover:text-pink-500 focus:outline-none"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </span>
                ))
              )}
            </div>
            {!disabled && (
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown className={clsx("h-5 w-5 text-gray-400 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
              </span>
            )}
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div ref={dropdownRef} className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm animate-in fade-in zoom-in-95 duration-100">
              {options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={clsx(
                    "relative cursor-default select-none py-2.5 pl-3 pr-9",
                    isSelected(option.id) ? "bg-pink-50 text-pink-900 font-medium" : "text-gray-900 hover:bg-gray-50",
                    (maxSelection && !isSelected(option.id) && value.length >= maxSelection) && "opacity-50 cursor-not-allowed hover:bg-white"
                  )}
                >
                  <span className="block truncate">{option.label}</span>
                  {isSelected(option.id) && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-pink-600">
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </span>
                  )}
                </div>
              ))}
              {allowOther && (
                <div
                  onClick={() => handleSelect('other')}
                  className={clsx(
                    "relative cursor-default select-none py-2.5 pl-3 pr-9 border-t border-gray-100",
                    isSelected('other') ? "bg-pink-50 text-pink-900" : "text-gray-900 hover:bg-gray-50",
                    (maxSelection && !isSelected('other') && value.length >= maxSelection) && "opacity-50 cursor-not-allowed hover:bg-white"
                  )}
                >
                  <span className="block truncate font-medium">{t('onboarding.other')}</span>
                  {isSelected('other') && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-pink-600">
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {options.map((option) => (
            <div
              key={option.id}
              onClick={() => !disabled && handleSelect(option.id)}
              className={clsx(
                "flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200",
                disabled ? "cursor-not-allowed opacity-60 bg-gray-50 border-gray-100" : "cursor-pointer",
                !disabled && isSelected(option.id) 
                  ? "border-pink-500 bg-pink-50/50 ring-1 ring-pink-500" 
                  : !disabled && "border-gray-100 bg-white hover:border-pink-200 hover:bg-gray-50/50",
                isSelected(option.id) && disabled && "border-pink-300 bg-pink-50/30",
                (maxSelection && !isSelected(option.id) && value.length >= maxSelection) && "opacity-40 cursor-not-allowed grayscale"
              )}
            >
              <div className={clsx(
                "w-4 h-4 rounded flex items-center justify-center border transition-colors",
                isSelected(option.id) ? (disabled ? "bg-pink-300 border-pink-300" : "bg-pink-500 border-pink-500") : "border-gray-200"
              )}>
                {isSelected(option.id) && <Check size={12} className="text-white font-bold" />}
              </div>
              <span className={clsx(
                "text-sm font-medium",
                isSelected(option.id) ? "text-pink-900" : "text-gray-700"
              )}>
                {option.label === 'Other' ? t('onboarding.other') : option.label}
              </span>
            </div>
          ))}
          {allowOther && (
             <div
               onClick={() => !disabled && handleSelect('other')}
               className={clsx(
                 "flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200",
                 disabled ? "cursor-not-allowed opacity-60 bg-gray-50 border-gray-100" : "cursor-pointer",
                 !disabled && isSelected('other') ? "border-pink-500 bg-pink-50/50" : !disabled && "border-gray-100 bg-white hover:border-pink-200",
                 isSelected('other') && disabled && "border-pink-300 bg-pink-50/30"
               )}
             >
                <div className={clsx(
                  "w-4 h-4 rounded flex items-center justify-center border",
                  isSelected('other') ? (disabled ? "bg-pink-300 border-pink-300" : "bg-pink-500 border-pink-500") : "border-gray-200"
                )}>
                  {isSelected('other') && <Check size={12} className="text-white" />}
                </div>
                <span className="text-sm font-medium">{t('onboarding.other')}</span>
             </div>
          )}
        </div>
      )}

      {showOtherInput && (
        <div className="mt-2 animate-in fade-in slide-in-from-top-2">
          <input
            type="text"
            value={otherText}
            onChange={(e) => onOtherTextChange && onOtherTextChange(e.target.value)}
            disabled={disabled}
            placeholder={t('common.pleaseSpecify') || "Please specify..."}
            className={clsx(
               "block w-full rounded-lg border-gray-200 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm py-2.5 px-3",
               disabled && "bg-gray-50 text-gray-500 cursor-not-allowed"
            )}
            autoFocus={!disabled}
          />
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
