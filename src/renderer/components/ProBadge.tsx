interface ProBadgeProps {
  className?: string
  size?: 'sm' | 'md'
}

export function ProBadge({ className = '', size = 'md' }: ProBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
  }

  return (
    <span
      className={`
        bg-gradient-to-r from-amber-500 to-orange-500
        text-white font-medium rounded-full
        ${sizeClasses[size]}
        ${className}
      `}
    >
      PRO
    </span>
  )
}
