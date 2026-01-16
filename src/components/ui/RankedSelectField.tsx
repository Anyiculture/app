import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';


interface Option {
  id: string;
  label: string;
}

interface RankedSelectFieldProps {
  label: string;
  options: Option[];
  value: string[]; // Ordered list of IDs
  onChange: (value: string[]) => void;
  maxRanking?: number;
  error?: string;
  className?: string;
}

export function RankedSelectField({
  label,
  options,
  value,
  onChange,
  maxRanking = 3,
  error,
  className
}: RankedSelectFieldProps) {
  // Use local state for immediate UI feedback, sync with props
  const [availableOptions, setAvailableOptions] = useState<Option[]>(
    options.filter(o => !value.includes(o.id))
  );

  const [rankedOptions, setRankedOptions] = useState<Option[]>(
    value.map(id => options.find(o => o.id === id)!).filter(Boolean)
  );
  
  // Sync if props change significantly (naive implementation)
  useEffect(() => {
     const ranked = value.map(id => options.find(o => o.id === id)!).filter(Boolean);
     setRankedOptions(ranked);
     setAvailableOptions(options.filter(o => !value.includes(o.id)));
  }, [value, options]);




  const moveToRanked = (option: Option) => {
    if (rankedOptions.length >= maxRanking) return;

    const newRanked = [...rankedOptions, option];
    setRankedOptions(newRanked);
    setAvailableOptions(availableOptions.filter(o => o.id !== option.id));
    onChange(newRanked.map(i => i.id));
  };

  const moveToAvailable = (option: Option) => {
    const newRanked = rankedOptions.filter(o => o.id !== option.id);
    setRankedOptions(newRanked);
    // Add back to available (naive sort by original order could be added here if needed)
    setAvailableOptions([...availableOptions, option]);
    onChange(newRanked.map(i => i.id));
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} <span className="text-gray-500 font-normal">(Rank top {maxRanking})</span>
      </label>

      {/* Since dnd can be heavy and we want simplicity first, let's implement a Click-to-Select interaction primarily, maybe add DnD later if explicitly requested. 
          Actually, let's do a simple "Selected" vs "Available" lists approach which is very robust.
       */}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Ranked (Selected) List */}
        <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4">
           <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">
             Your Top {maxRanking} Priorities
           </h4>
           
           <div className="space-y-2">
             {rankedOptions.length === 0 ? (
               <div className="text-center py-8 border-2 border-dashed border-blue-200 rounded-lg text-blue-400 text-sm">
                 Select options from the list
               </div>
             ) : (
               rankedOptions.map((option, index) => (
                 <div 
                   key={option.id}
                   className="flex items-center bg-white border border-blue-200 shadow-sm rounded-lg p-3 animate-in fade-in slide-in-from-left-2"
                 >
                   <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mr-3">
                     {index + 1}
                   </span>
                   <span className="flex-grow font-medium text-gray-900 text-sm">{option.label}</span>
                   <button
                     onClick={() => moveToAvailable(option)}
                     className="text-gray-400 hover:text-red-500 transition-colors"
                   >
                     <X size={16} />
                   </button>
                 </div>
               ))
             )}
           </div>
        </div>

        {/* Available Options */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 max-h-[400px] overflow-y-auto">
           <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
             Available Options
           </h4>
           
           <div className="space-y-2">
             {availableOptions.map(option => (
               <button
                 key={option.id}
                 onClick={() => moveToRanked(option)}
                 disabled={rankedOptions.length >= maxRanking}
                 className={clsx(
                   "w-full text-left flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 transition-all hover:bg-gray-50 hover:border-gray-300",
                   rankedOptions.length >= maxRanking && "opacity-50 cursor-not-allowed"
                 )}
               >
                 <span className="text-sm text-gray-700">{option.label}</span>
                 {rankedOptions.length < maxRanking && (
                   <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-300 group-hover:border-blue-400 group-hover:text-blue-400">
                     <span className="text-xs">+</span>
                   </div>
                 )}
               </button>
             ))}
           </div>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-600 animate-pulse">{error}</p>}
    </div>
  );
}
