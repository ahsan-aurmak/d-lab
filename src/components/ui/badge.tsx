import * as React from 'react'
import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-slate-900 text-white',
  secondary: 'bg-slate-100 text-slate-900 ring-1 ring-slate-200/80',
  success: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  danger: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide', variants[variant], className)}
      {...props}
    />
  )
}
