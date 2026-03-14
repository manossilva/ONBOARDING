import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-zinc-300">{label}</label>
        )}
        <input
          ref={ref}
          className={`bg-zinc-800 border ${error ? 'border-red-500' : 'border-zinc-700'} rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-sm ${className}`}
          {...props}
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-zinc-300">{label}</label>
        )}
        <select
          ref={ref}
          className={`bg-zinc-800 border ${error ? 'border-red-500' : 'border-zinc-700'} rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-sm ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-zinc-300">{label}</label>
        )}
        <textarea
          ref={ref}
          className={`bg-zinc-800 border ${error ? 'border-red-500' : 'border-zinc-700'} rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-sm resize-none ${className}`}
          {...props}
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
