import { useTenancyBuilder } from '../../state/tenancyBuilderContext'
import { WarningNotice } from '../WarningNotice'

// Visible warning shown on tenancy-builder pages when sessionStorage is not
// usable. The journey still works in memory; the user is told plainly that
// refreshing may lose answers.
export function StorageWarning() {
  const { storageAvailable } = useTenancyBuilder()
  if (storageAvailable) return null
  return (
    <WarningNotice>
      <p>
        <strong>We cannot save your answers.</strong> We cannot keep your answers if you refresh or
        close this page. You can continue, but you may need to enter them again.
      </p>
    </WarningNotice>
  )
}
