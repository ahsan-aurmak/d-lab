import * as React from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'outline' | 'destructive'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-[linear-gradient(135deg,var(--primary-color),#004fd1)] text-white shadow-[0_16px_34px_-18px_rgba(0,102,255,0.8)] hover:-translate-y-0.5 hover:brightness-105',
  secondary: 'bg-white/85 text-slate-900 ring-1 ring-slate-200/80 hover:bg-white',
  ghost: 'bg-transparent text-slate-700 hover:bg-white/70 hover:text-slate-900',
  outline: 'border border-slate-300/80 bg-white/70 text-slate-900 hover:bg-white',
  destructive: 'bg-[linear-gradient(135deg,#ef4444,#dc2626)] text-white hover:brightness-110'
}

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-11 px-4 py-2',
  sm: 'h-9 rounded-xl px-3',
  lg: 'h-12 rounded-xl px-8',
  icon: 'h-10 w-10'
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/45 disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Button.displayName = 'Button'
