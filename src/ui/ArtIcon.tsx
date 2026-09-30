import { EnemyArt } from './EnemyArt'
import { enemiesById, items } from '../data'
import { ItemArt } from './ItemArt'
/** Small original vector illustrations: one palette and stroke style on every device. */
const drawings: Record<string, string> = {
  fish: 'M10 32c8-14 25-14 36 0-11 14-28 14-36 0Zm36 0 10-10v20ZM20 28h1M28 24l6-7 5 9M28 40l6 7 5-9',
  flame:
    'M32 8c5 15 20 17 17 34-2 9-9 14-17 14S15 50 15 40c0-9 6-16 11-21 0 9 3 12 6 12 5-7 2-15 0-23ZM32 35c8 8 11 19 0 21-12-2-7-13 0-21',
  axe: 'M21 55 41 11M36 15c-11-4-21 1-25 13l20 8M40 14l12 6-4 14-11-4',
  pick: 'M16 55 39 16M9 23c17-15 34-13 48 3L35 21Z',
  hammer: 'M28 53 38 24M22 11l30 9-5 14-30-9ZM24 50l9 3-2 7-9-3Z',
  cooking:
    'M12 30h40v9c0 12-40 12-40 0ZM6 32h6M52 32h6M21 23c-8-8 8-9 0-17M33 23c-8-8 8-9 0-17M45 23c-8-8 8-9 0-17M18 55h28',
  bow: 'M16 8c39 5 39 43 0 48l10-24ZM8 32h45M46 25l8 7-8 7',
  rune: 'M32 6 53 20v25L32 58 11 45V20ZM32 16l-8 14 16 4-9 15M22 25l21-6',
  sword: 'M15 49 43 10l10 1-1 10-32 32ZM12 37l17 16M9 56l9-10',
  key: 'M35 21a12 12 0 1 0-24 0 12 12 0 0 0 24 0ZM32 30l23 23M45 42l-7 7M50 47l-7 7M23 17h1',
  wheat:
    'M32 58V9M32 22c-12 0-15-7-15-12 10 0 15 5 15 12ZM32 34c-12 0-15-7-15-12 10 0 15 5 15 12ZM32 46c-12 0-15-7-15-12 10 0 15 5 15 12ZM32 28c12 0 15-7 15-12-10 0-15 5-15 12ZM32 40c12 0 15-7 15-12-10 0-15 5-15 12Z',
  ranch:
    'M13 20 9 10l13 6M51 20l4-10-13 6M17 20h30l6 17-8 17H19L11 37ZM23 30h1M40 30h1M22 42h20v10H22ZM27 47h1M36 47h1',
  bag: 'M23 9h18l-3 12 12 16c16 26-52 26-36 0l12-16ZM22 21h20M25 39h15M32 32v18',
  shop: 'M10 27V13h44v14M8 27h48L50 7H14ZM13 30v26h38V30M20 56V39h13v17M39 36h7v9h-7',
  scroll: 'M16 12h33c-10 0-10 13 0 13h6V12c0-9-16-9-16 0v40H15c-8 0-8-12 0-12h24M21 22h11M21 30h11',
  trophy:
    'M19 9h26v18c0 20-26 20-26 0ZM19 14H9v9c0 10 9 10 13 10M45 14h10v9c0 10-9 10-13 10M32 42v12M20 56h24',
  paw: 'M20 49c0-19 24-19 24 0 0 14-24 14-24 0ZM19 28a5 8 0 1 0-10 0 5 8 0 0 0 10 0ZM30 17a5 8 0 1 0-10 0 5 8 0 0 0 10 0ZM44 17a5 8 0 1 0-10 0 5 8 0 0 0 10 0ZM55 28a5 8 0 1 0-10 0 5 8 0 0 0 10 0',
  book: 'M32 17c-8-7-16-7-25-4v39c9-3 17-3 25 4 8-7 16-7 25-4V13c-9-3-17-3-25 4v39M14 23l11 3M39 26l11-3M14 33l11 3M39 36l11-3',
  gear: 'M25 7h14l2 10 10 2 7 12-7 8-3 10-13 8-7-7-12-2-7-12 7-8 2-12 12-2ZM42 32a10 10 0 1 0-20 0 10 10 0 0 0 20 0',
  helmet: 'M13 48V30c0-27 38-27 38 0v18l-13 8-6-12-6 12ZM32 12v32M19 32h9M36 32h9',
  shield: 'M32 7 53 15v20c0 12-21 23-21 23S11 47 11 35V15ZM32 13v36M20 29h24',
  tree: 'M32 5 12 27h10L9 43h18v15h10V43h18L42 27h10Z',
  ore: 'M9 41 17 18l22-9 18 22-7 23H20ZM17 18l15 16 7-25M9 41l23-7 18 20M32 34l25-3',
  bread: 'M8 41c0-35 48-35 48 0v10H8ZM20 25l7 9M32 22l7 9M43 25l7 9',
  castle: 'M9 55V21h13v12h20V21h13v34ZM9 21V9h5v5h3V9h5v12M42 21V9h5v5h3V9h5v12M27 55V43h10v12',
}
function kind(name: string): string {
  const n = name.toLowerCase()
  if (/fishing|herring|trout|silverfin|eel/.test(n)) return 'fish'
  if (/firemaking|fire/.test(n)) return 'flame'
  if (/woodcutting/.test(n)) return 'axe'
  if (/mining/.test(n)) return 'pick'
  if (/smithing/.test(n)) return 'hammer'
  if (/cooking/.test(n)) return 'cooking'
  if (/hunting/.test(n)) return 'bow'
  if (/runecrafting|rune|essence/.test(n) && !/sword|helmet|shield|boots/.test(n)) return 'rune'
  if (/combat|sword|dagger/.test(n)) return 'sword'
  if (/dungeon/.test(n)) return 'key'
  if (/farming|barley|seed|wheat|carrot|potato|pumpkin/.test(n)) return 'wheat'
  if (/ranching|chicken|goat|cow|horse|sheep|egg|milk|wool/.test(n)) return 'ranch'
  if (/bank/.test(n)) return 'bag'
  if (/shop/.test(n)) return 'shop'
  if (/quest/.test(n)) return 'scroll'
  if (/achievement/.test(n)) return 'trophy'
  if (/pet/.test(n)) return 'paw'
  if (/codex/.test(n)) return 'book'
  if (/setting/.test(n)) return 'gear'
  if (/helmet/.test(n)) return 'helmet'
  if (/shield|body|legs|gloves|boots|ring|amulet/.test(n)) return 'shield'
  if (/logs|wood/.test(n)) return 'tree'
  if (/ore|bar|coal/.test(n)) return 'ore'
  if (/bread|cake|meat/.test(n)) return 'bread'
  if (/medieval|castle/.test(n)) return 'castle'
  return 'bag'
}
export function ArtIcon({ name, className = 'h-7 w-7' }: { name: string; className?: string }) {
  if (Object.hasOwn(enemiesById, name)) return <EnemyArt name={name} className={className} />
  if (Object.hasOwn(items, name)) return <ItemArt name={name} className={className} />
  return (
    <svg
      viewBox="0 0 64 64"
      className={`shrink-0 text-gold ${className}`}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={drawings[kind(name)]} />
    </svg>
  )
}

export function LocationArt({ name, skillId }: { name: string; skillId: string }) {
  const region = `${name} ${skillId}`.toLowerCase()
  const scene = /frost|frozen|snow|mining|quarry/.test(region)
    ? 'mountain'
    : /ember|forge|smith|firemaking|cooking|crucible/.test(region)
      ? 'forge'
      : /wood|forest|hunting|marsh|crypt|rune|dungeon/.test(region)
        ? 'forest'
        : 'shore'
  const atmosphere = /marsh|crypt/.test(region) ? 'mist' : /deepwater/.test(region) ? 'night' : ''
  return (
    <div className={`location-scene scene-${scene} atmosphere-${atmosphere}`} data-scene={scene}>
      <img
        src={`${import.meta.env.BASE_URL}art/medieval-world.webp`}
        alt=""
        className="scene-atlas"
        decoding="async"
      />
      <div className="scene-shade" />
      <div className="scene-caption">
        <span className="scene-eyebrow">The realm awaits</span>
        <p className="scene-title">{name}</p>
        <span className="scene-description">
          {scene === 'shore'
            ? 'Quiet waters. A new adventure.'
            : scene === 'forest'
              ? 'Beyond the paths, something stirs.'
              : scene === 'forge'
                ? 'From raw materials to legendary craft.'
                : 'Fortune favors those who venture higher.'}
        </span>
      </div>
    </div>
  )
}
