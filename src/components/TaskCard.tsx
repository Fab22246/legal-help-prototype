import { Link } from 'react-router-dom'

interface TaskCardProps {
  title: string
  description: string
  to: string
}

// A single task row on the home page. The whole row is one link so the click
// target covers title and description. Rendered as a list item inside
// <CardGroup>. Row height follows content; short descriptions do not force a
// fixed height on neighbours.
export function TaskCard({ title, description, to }: TaskCardProps) {
  return (
    <li>
      <Link className="task-item" to={to}>
        <h3 className="task-item__title">{title}</h3>
        <p className="task-item__desc">{description}</p>
      </Link>
    </li>
  )
}
