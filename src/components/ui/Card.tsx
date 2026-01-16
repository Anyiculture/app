import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({ 
  className, 
  children, 
  hoverEffect = true,
  ...props 
}, ref) => {
  const MotionDiv = motion.div;

  return (
    <MotionDiv
      ref={ref as any}
      initial={hoverEffect ? { y: 0 } : undefined}
      whileHover={hoverEffect ? { y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" } : undefined}
      transition={{ duration: 0.2 }}
      className={cn(
        "bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300",
        className
      )}
      {...(props as any)}
    >
      {children}
    </MotionDiv>
  );
});

Card.displayName = 'Card';

export { Card };
