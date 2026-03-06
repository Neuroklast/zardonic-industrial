import { motion } from 'framer-motion'
import { Card as ShadcnCard } from '@/components/ui/card'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  dataLabel?: string
  hoverable?: boolean
  scanEffect?: boolean
}

export default function Card({ 
  children, 
  className = '', 
  onClick, 
  dataLabel,
  hoverable = true,
  scanEffect = false
}: CardProps) {
  return (
    <ShadcnCard 
      className={`
        bg-card 
        border-border 
        ${hoverable ? 'hover:border-primary/50 transition-colors cursor-pointer' : ''} 
        ${scanEffect ? 'zardonic-theme-hover-scan' : ''} 
        zardonic-theme-cyber-card 
        zardonic-theme-hover-noise 
        relative 
        ${className}
      `}
      onClick={onClick}
    >
      {scanEffect && <div className="zardonic-theme-scan-line" />}
      {dataLabel && (
        <div className="zardonic-theme-data-label mb-2">{dataLabel}</div>
      )}
      {children}
    </ShadcnCard>
  )
}
