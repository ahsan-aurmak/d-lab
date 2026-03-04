import * as React from 'react'
import { cn } from '@/lib/utils'

export function Switch({
  checked,
  onCheckedChange,
  className,
  ...props
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'onClick'>) {
  const isDisabled = Boolean(props.disabled)

  return (
    <button
      aria-checked={checked}
      type="button"
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full ring-1 ring-slate-200/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-1',
        checked ? 'bg-brand shadow-[0_10px_24px_-14px_rgba(0,102,255,0.8)]' : 'bg-slate-400',
        isDisabled ? 'cursor-not-allowed opacity-60' : '',
        className
      )}
      onClick={() => {
        if (isDisabled) return
        onCheckedChange(!checked)
      }}
      role="switch"
      {...props}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1'
        )}
      />
    </button>
  )
}
