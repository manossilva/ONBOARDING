import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple'
  className?: string
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-zinc-800 text-zinc-300',
    success: 'bg-green-900/50 text-green-400 border border-green-800',
    warning: 'bg-amber-900/50 text-amber-400 border border-amber-800',
    danger: 'bg-red-900/50 text-red-400 border border-red-800',
    purple: 'bg-purple-900/50 text-purple-400 border border-purple-800',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
