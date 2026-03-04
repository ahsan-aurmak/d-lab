import * as React from 'react'
import { cn } from '@/lib/utils'

export function Drawer({ open, onOpenChange, children }: { open: boolean; onOpenChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <>
      {open ? <button aria-label="Overlay" className="fixed inset-0 z-40 bg-slate-900/30" onClick={() => onOpenChange(false)} /> : null}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-md transform border-l border-slate-200 bg-white p-6 shadow-xl transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {children}
      </div>
    </>
  )
}
