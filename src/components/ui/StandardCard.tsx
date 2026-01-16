import React from 'react';
import { cn } from '../../lib/utils';

interface StandardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'modern' | 'classic';
}

export function StandardCard({ children, className, onClick, variant = 'modern', ...props }: StandardCardProps) {
  const baseStyles = "group flex flex-col bg-white overflow-hidden h-full transition-all duration-300";
  
  const variants = {
    classic: "rounded-[2.5rem] border border-black border-b-[6px] shadow-[0_15px_35px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] hover:-translate-y-3 universal-card-font",
    modern: "rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
  };

  return (
    <div 
      className={cn(baseStyles, variants[variant], className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function StandardCardImage({ src, alt, className, children, fallback }: { src?: string; alt?: string; className?: string; children?: React.ReactNode; fallback?: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className={cn("relative w-full aspect-[4/3] bg-gray-50 overflow-hidden rounded-t-2xl group-hover:opacity-95", className)}>
      {src && !hasError ? (
        <img 
          src={src} 
          alt={alt || "Card image"} 
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[0.98]"
          onError={() => setHasError(true)}
        />
      ) : (
        fallback || null
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      {children}
    </div>
  );
}

interface StandardCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function StandardCardContent({ children, className = '' }: StandardCardContentProps) {
  return (
    <div className={cn("p-3 flex-grow flex flex-col gap-2", className)}>
      {children}
    </div>
  );
}

interface StandardCardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function StandardCardTitle({ children, className = '' }: StandardCardTitleProps) {
  return (
    <h3 className={cn("text-lg md:text-xl font-bold text-gray-800 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors universal-card-font tracking-tight", className)}>
      {children}
    </h3>
  );
}

export function StandardCardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm md:text-base text-gray-600 line-clamp-2 universal-card-font", className)}>
      {children}
    </p>
  );
}

export function StandardCardMeta({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-gray-500 mt-1 font-medium", className)}>
      {children}
    </div>
  );
}

export function StandardCardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-sm", className)}>
      {children}
    </div>
  );
}
