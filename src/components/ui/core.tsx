import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const GlassCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn(
    "bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-[2rem] p-8 shadow-2xl",
    className
  )}>
    {children}
  </div>
);

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: "bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)] font-bold",
      secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/10",
      ghost: "hover:bg-white/5 text-white/40 hover:text-white"
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          "px-6 py-3 rounded-2xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <label className={cn("text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2 block font-bold", className)}>
    {children}
  </label>
);
