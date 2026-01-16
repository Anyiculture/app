import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
}

export function GlassCard({ children, className, delay = 0, onClick }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      onClick={onClick}
      className={cn(
        "bg-white rounded-[2rem] border-2 border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
