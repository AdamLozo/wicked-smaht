import { motion } from 'framer-motion';
import type { ReactNode, MouseEventHandler } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
}

const variants = {
  primary: 'bg-boston-gold text-boston-navy hover:bg-boston-gold/90',
  secondary: 'bg-boston-brick text-boston-cream hover:bg-boston-brick/90',
  outline: 'bg-transparent border border-boston-cream/30 text-boston-cream hover:bg-boston-cream/10',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizes = {
  sm: 'px-3 py-2 text-sm min-h-[40px]',
  md: 'px-5 py-2.5 text-base min-h-[44px]',
  lg: 'px-6 py-3 text-lg min-h-[48px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  disabled,
  className = '',
  onClick,
  type = 'button',
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded font-body font-medium
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        touch-manipulation
        active:scale-[0.98]
        ${className}
      `}
      disabled={disabled || isLoading}
      onClick={onClick}
      type={type}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
