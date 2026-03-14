import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-5 ${className}`}>
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon?: React.ReactNode
  accent?: boolean
  subtitle?: string
}

export function StatCard({ title, value, icon, accent = false, subtitle }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-zinc-400 text-sm font-medium">{title}</span>
        {icon && (
          <div className={`p-2 rounded-lg ${accent ? 'bg-amber-500/10 text-amber-400' : 'bg-purple-600/10 text-purple-400'}`}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <p className={`text-2xl font-bold ${accent ? 'text-amber-400' : 'text-white'}`}>{value}</p>
        {subtitle && <p className="text-zinc-500 text-xs mt-1">{subtitle}</p>}
      </div>
    </Card>
  )
}
