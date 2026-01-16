import { clsx } from 'clsx';
import { Info } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface Option {
  id: string;
  label: string;
  description?: string; // Optional subtitle for the option
}

interface SingleSelectFieldProps {
  label: string;
  description?: string;
  options: Option[];
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  layout?: 'row' | 'column' | 'grid'; // Grid is great for visual cards
  variant?: 'radio' | 'cards' | 'buttons'; // Different visual styles
  disabled?: boolean;
}

export function SingleSelectField({
  label,
  description,
  options,
  value,
  onChange,
  error,
  className,
  layout = 'column',
  variant = 'radio',
  disabled = false
}: SingleSelectFieldProps) {
  
  return (
    <div className={twMerge("space-y-2", className)}>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5 flex items-start gap-1">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
            {description}
          </p>
        )}
      </div>

      <div className={clsx(
        "gap-3",
        layout === 'row' && "flex flex-wrap",
        layout === 'column' && "flex flex-col",
        layout === 'grid' && "grid grid-cols-1 sm:grid-cols-2"
      )}>
        {options.map((option) => {
          const isSelected = value === option.id;

          if (variant === 'cards') {
            return (
              <div
                key={option.id}
                onClick={() => !disabled && onChange(option.id)}
                className={clsx(
                  "rounded-xl border p-4 transition-all duration-200",
                  disabled ? "cursor-not-allowed opacity-60 bg-gray-50 border-gray-100" : "cursor-pointer hover:shadow-md",
                  !disabled && isSelected 
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" 
                    : !disabled && "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50",
                  isSelected && disabled && "border-blue-300 bg-blue-50/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={clsx("font-medium", isSelected ? "text-blue-900" : "text-gray-900")}>
                      {option.label}
                    </p>
                    {option.description && (
                      <p className={clsx("text-xs mt-1", isSelected ? "text-blue-700" : "text-gray-500")}>
                        {option.description}
                      </p>
                    )}
                  </div>
                  <div className={clsx(
                    "h-4 w-4 rounded-full border flex items-center justify-center",
                    isSelected ? (disabled ? "border-blue-300 bg-blue-300" : "border-blue-600 bg-blue-600") : "border-gray-300"
                  )}>
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>
            );
          }

          if (variant === 'buttons') {
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(option.id)}
                disabled={disabled}
                className={clsx(
                  "px-4 py-2 text-sm font-medium rounded-lg border transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                  disabled ? "opacity-50 cursor-not-allowed" : "",
                  isSelected
                    ? "bg-blue-600 text-white border-transparent hover:bg-blue-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                )}
              >
                {option.label}
              </button>
            );
          }

          // Default RADIO style
          return (
            <div key={option.id} className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id={`${label}-${option.id}`}
                  name={label}
                  type="radio"
                  checked={isSelected}
                  onChange={() => onChange(option.id)}
                  disabled={disabled}
                  className={clsx(
                    "h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500",
                    disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                  )}
                />
              </div>
              <div className="ml-3 text-sm">
                <label 
                  htmlFor={`${label}-${option.id}`} 
                  className={clsx("font-medium", disabled ? "cursor-not-allowed text-gray-500" : "cursor-pointer text-gray-700", isSelected && !disabled && "text-gray-900")}
                >
                  {option.label}
                </label>
                {option.description && (
                  <p className="text-gray-500">{option.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="mt-1 text-xs text-red-600 animate-pulse">{error}</p>}
    </div>
  );
}
