import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function BackgroundBlobs({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none -z-10", className)}>
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 100, 0],
          y: [0, -50, 0],
          backgroundColor: ["rgba(139, 92, 246, 0.3)", "rgba(236, 72, 153, 0.3)", "rgba(139, 92, 246, 0.3)"],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-vibrant-purple/30 rounded-full blur-[100px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
          x: [0, -50, 0],
          y: [0, 100, 0],
          backgroundColor: ["rgba(236, 72, 153, 0.3)", "rgba(59, 130, 246, 0.3)", "rgba(236, 72, 153, 0.3)"],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-vibrant-pink/30 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, 50, 0],
          y: [0, 50, 0],
          backgroundColor: ["rgba(96, 165, 250, 0.3)", "rgba(139, 92, 246, 0.3)", "rgba(96, 165, 250, 0.3)"],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 5,
        }}
        className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-blue-400/30 rounded-full blur-[80px]"
      />
    </div>
  );
}
