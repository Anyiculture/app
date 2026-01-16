export const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  export const hasMinLength = (text: string, min: number) => {
    return text.trim().length >= min;
  };
  
  export const hasMaxLength = (text: string, max: number) => {
    return text.trim().length <= max;
  };
  
  export const hasMinWords = (text: string, min: number) => {
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    return wordCount >= min;
  };
  
  export const hasMaxWords = (text: string, max: number) => {
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    return wordCount <= max;
  };
  
  export interface ValidationRule<T> {
    validate: (value: T) => boolean;
    message: string;
  }
  
  export const validateField = <T>(value: T, rules: ValidationRule<T>[]): string | undefined => {
    for (const rule of rules) {
      if (!rule.validate(value)) {
        return rule.message;
      }
    }
    return undefined;
  };
  
  // Specific Au Pair form validators
  export const validators = {
    required: (message = "This field is required") => ({
      validate: (val: any) => {
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === 'string') return val.trim() !== '';
        if (typeof val === 'number') return !isNaN(val); 
        return !!val;
      },
      message
    }),
    
    minSelection: (min: number) => ({
      validate: (val: string[]) => val.length >= min,
      message: `Please select at least ${min} option${min > 1 ? 's' : ''}`
    }),
    
    maxSelection: (max: number) => ({
      validate: (val: string[]) => val.length <= max,
      message: `Please select no more than ${max} options`
    }),
    
    essayLength: (minWords: number, maxWords: number) => ({
      validate: (val: string) => {
        const count = val.trim().split(/\s+/).filter(Boolean).length;
        return count >= minWords && count <= maxWords;
      },
      message: `Please write between ${minWords} and ${maxWords} words`
    })
  };
