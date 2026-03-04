import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const shouldAutoLabel = !props['aria-label'] && !props['aria-labelledby']
  const autoLabel = shouldAutoLabel
    ? typeof props.name === 'string' && props.name.trim().length > 0
      ? props.name
      : 'Select option'
    : undefined

  return (
    <div className="relative w-full">
      <select
        aria-label={autoLabel}
        className={cn(
          'h-11 w-full appearance-none rounded-xl border border-slate-300/85 bg-white/85 px-3.5 pr-12 text-sm text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition-all focus-visible:border-brand/70 focus-visible:ring-2 focus-visible:ring-brand/30',
          className
        )}
        {...props}
      />
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  )
}
