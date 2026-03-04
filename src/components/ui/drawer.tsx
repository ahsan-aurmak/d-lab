import * as React from 'react'
import { cn } from '@/lib/utils'

export function Drawer({ open, onOpenChange, children }: { open: boolean; onOpenChange: (v: boolean) => void; children: React.ReactNode }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const lastFocusedRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (!open) return
    lastFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTarget =
      containerRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      ) ?? containerRef.current
    focusTarget?.focus()

    return () => {
      document.body.style.overflow = originalOverflow
      lastFocusedRef.current?.focus()
    }
  }, [open])

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      onOpenChange(false)
      return
    }

    if (event.key !== 'Tab' || !containerRef.current) return
    const focusables = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      )
    )

    if (!focusables.length) {
      event.preventDefault()
      containerRef.current.focus()
      return
    }

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement

    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <>
      {open ? (
        <button
          aria-label="Close side panel"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
          onClick={() => onOpenChange(false)}
          type="button"
        />
      ) : null}
      <div
        aria-hidden={!open}
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-md transform overflow-y-auto border-l border-white/70 bg-white/92 p-6 pb-8 shadow-[0_30px_80px_-24px_rgba(15,23,42,0.65)] backdrop-blur-xl transition-transform duration-200 focus:outline-none sm:p-7',
          open ? 'translate-x-0' : 'pointer-events-none translate-x-full'
        )}
        onKeyDown={handleKeyDown}
        ref={containerRef}
        role="dialog"
        tabIndex={-1}
        aria-label="Validation drawer"
        aria-modal="true"
      >
        {children}
      </div>
    </>
  )
}
