import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary'

interface ButtonLinkProps {
  to: string
  variant?: ButtonVariant
  children: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'govbb-btn',
  secondary: 'govbb-btn--secondary',
  tertiary: 'govbb-btn--tertiary',
}

// A navigation link styled as a button. Use for moving between pages; use a real
// <button> for actions.
export function ButtonLink({ to, variant = 'primary', children }: ButtonLinkProps) {
  return (
    <Link className={variantClass[variant]} to={to}>
      {children}
    </Link>
  )
}
