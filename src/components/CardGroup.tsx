import type { ReactNode } from 'react'

interface CardGroupProps {
  title: string
  children: ReactNode
}

// A titled group of task cards on the home page. Children are <TaskCard> items.
export function CardGroup({ title, children }: CardGroupProps) {
  return (
    <section className="card-group">
      <h2 className="card-group__title">{title}</h2>
      <ul className="card-grid">{children}</ul>
    </section>
  )
}
