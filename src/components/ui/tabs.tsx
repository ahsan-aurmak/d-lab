import * as React from 'react'
import { cn } from '@/lib/utils'

type TabsContextValue = {
  baseId: string
  value: string
  setValue: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

export function Tabs({
  value,
  onValueChange,
  className,
  children
}: {
  value: string
  onValueChange: (value: string) => void
  className?: string
  children: React.ReactNode
}) {
  const baseId = React.useId()

  return (
    <TabsContext.Provider value={{ baseId, value, setValue: onValueChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(TabsContext)

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const tabElements = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    )
    if (!tabElements.length) return

    const currentIndex = tabElements.findIndex((tab) => tab === document.activeElement)
    if (currentIndex < 0) return

    let nextIndex = currentIndex
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % tabElements.length
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + tabElements.length) % tabElements.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabElements.length - 1

    if (nextIndex !== currentIndex) {
      event.preventDefault()
      const nextTab = tabElements[nextIndex]
      nextTab.focus()
      nextTab.click()
    }
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-slate-200/70 bg-slate-100/80 p-1 backdrop-blur-sm',
        className
      )}
      aria-label="Sections"
      onKeyDown={handleKeyDown}
      role="tablist"
      {...(context ? { id: `${context.baseId}-tablist` } : {})}
      {...props}
    />
  )
}

export function TabsTrigger({
  value,
  className,
  children
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const context = React.useContext(TabsContext)
  if (!context) return null

  const isActive = context.value === value
  const tabId = `${context.baseId}-tab-${value}`
  const panelId = `${context.baseId}-panel-${value}`

  return (
    <button
      aria-controls={panelId}
      aria-selected={isActive}
      className={cn(
        'inline-flex min-h-9 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/45',
        isActive
          ? 'bg-white text-slate-900 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.9)]'
          : 'text-slate-500 hover:bg-white/70 hover:text-slate-900',
        className
      )}
      id={tabId}
      onClick={() => context.setValue(value)}
      role="tab"
      tabIndex={isActive ? 0 : -1}
      type="button"
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  className,
  children
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const context = React.useContext(TabsContext)
  if (!context || context.value !== value) return null

  const tabId = `${context.baseId}-tab-${value}`
  const panelId = `${context.baseId}-panel-${value}`

  return (
    <div aria-labelledby={tabId} className={cn('mt-5', className)} id={panelId} role="tabpanel" tabIndex={0}>
      {children}
    </div>
  )
}
