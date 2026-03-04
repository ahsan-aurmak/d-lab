import * as React from 'react'
import { cn } from '@/lib/utils'

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
        className
      )}
      {...props}
    />
  )
}
