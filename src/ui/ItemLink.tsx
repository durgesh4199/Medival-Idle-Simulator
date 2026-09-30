import { useGameNavigation } from './gameNavigation'

export function ItemLink({
  itemId,
  children,
  label,
}: {
  itemId: string
  children: React.ReactNode
  label?: string
}) {
  const { inspectItem } = useGameNavigation()
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => inspectItem(itemId)}
      className="text-left text-gold underline decoration-gold/30 underline-offset-4 hover:decoration-gold"
    >
      {children}
    </button>
  )
}
