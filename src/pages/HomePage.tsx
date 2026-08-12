import { CardGroup } from '../components/CardGroup'
import { TaskCard } from '../components/TaskCard'
import { HOME_INTRO, SERVICE_NAME } from '../data/content'
import { groupOrder, routes } from '../data/routes'

// Card-based front page, grouped by user need. No "Start now" button.
export function HomePage() {
  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">{SERVICE_NAME}</h1>
        <p className="page__intro">{HOME_INTRO}</p>
      </div>

      <CardGroup title="Prepare a draft document">
        <TaskCard
          title="Prepare a draft tenancy agreement"
          description="Answer questions to prepare a draft agreement for landlords and tenants to check before signing."
          to="/renting-home/agreement"
        />
      </CardGroup>

      <div className="category-grid">
        {groupOrder.map((group) => {
          const cards = routes.filter((route) => route.showOnHome && route.group === group)
          if (cards.length === 0) return null
          return (
            <CardGroup key={group} title={group}>
              {cards.map((route) => (
                <TaskCard
                  key={route.path}
                  title={route.title}
                  description={route.description}
                  to={route.path}
                />
              ))}
            </CardGroup>
          )
        })}
      </div>
    </div>
  )
}
