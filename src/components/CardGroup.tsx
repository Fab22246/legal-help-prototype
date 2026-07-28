import type { ReactNode } from 'react'

interface CardGroupProps {
  title: string
  children: ReactNode
}

// A titled category of task links on the home page. Children are <TaskCard>
// items rendered as full-width rows inside a bordered task-list container.
export function CardGroup({ title, children }: CardGroupProps) {
  return (
    <section className="task-category">
      <h2 className="card-group__title">{title}</h2>
      <ul className="task-list">{children}</ul>
    </section>
  )
}
