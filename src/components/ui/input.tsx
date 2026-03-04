import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const shouldAutoLabel = !props['aria-label'] && !props['aria-labelledby']
    const autoLabel =
      shouldAutoLabel && typeof props.placeholder === 'string' && props.placeholder.trim().length > 0
        ? props.placeholder
        : undefined

    return (
      <input
        aria-label={autoLabel}
        className={cn(
          'flex h-11 w-full rounded-xl border border-slate-300/85 bg-white/85 px-3.5 py-2 text-sm text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none ring-offset-white transition-all placeholder:text-slate-400 focus-visible:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand/30',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'
