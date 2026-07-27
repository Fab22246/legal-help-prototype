import { Link } from 'react-router-dom'

interface TaskCardProps {
  title: string
  description: string
  to: string
}

// A single task card. The whole card is one link for a large, keyboard-friendly
// target. Rendered as a list item inside <CardGroup>.
export function TaskCard({ title, description, to }: TaskCardProps) {
  return (
    <li>
      <Link className="task-card" to={to}>
        <h3 className="task-card__title">{title}</h3>
        <p className="task-card__desc">{description}</p>
      </Link>
    </li>
  )
}
