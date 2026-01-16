import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag' | 'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDrop'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'gradient-pink';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading,
  children,
  disabled,
  // Filter out non-DOM props that might be passed
  // @ts-ignore
  leftIcon,
  // @ts-ignore
  rightIcon,
  ...props 
}, ref) => {
  
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-500 disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    primary: "bg-pink-600 text-white hover:bg-pink-700 shadow-md hover:shadow-lg hover:-translate-y-0.5",
    "gradient-pink": "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5",
    secondary: "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm",
    outline: "border-2 border-pink-600 text-pink-600 hover:bg-pink-50",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  };

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-base",
    lg: "h-12 px-8 text-lg",
  };

  const MotionButton = motion.button;

  return (
    <MotionButton
      ref={ref as any}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading || disabled}
      {...(props as any)}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </MotionButton>
  );
});

Button.displayName = 'Button';

export { Button };
