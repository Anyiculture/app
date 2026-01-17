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
        "bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
