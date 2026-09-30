import { useGameNavigation } from './gameNavigation'

export function ItemLink({ itemId, children }: { itemId: string; children: React.ReactNode }) {
  const { inspectItem } = useGameNavigation()
  return (
    <button
      type="button"
      onClick={() => inspectItem(itemId)}
      className="text-left text-gold underline decoration-gold/30 underline-offset-4 hover:decoration-gold"
    >
      {children}
    </button>
  )
}
