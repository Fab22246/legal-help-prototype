// Print only the document with the given id. Restores the normal view after
// printing or cancelling. Does not send answers anywhere.
export function printDocument(id: string): void {
  const element = document.getElementById(id)
  if (!element) return

  element.classList.add('will-doc--active')
  document.body.classList.add('will-printing')

  const cleanup = () => {
    element.classList.remove('will-doc--active')
    document.body.classList.remove('will-printing')
    window.removeEventListener('afterprint', cleanup)
  }

  window.addEventListener('afterprint', cleanup)
  window.print()
}
