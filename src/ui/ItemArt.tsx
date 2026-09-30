import { useId } from 'react'

const palettes: Record<string, [string, string]> = {
  bronze: ['#dcad68', '#76502d'],
  iron: ['#d4dee5', '#657184'],
  steel: ['#e7f4f8', '#708f9d'],
  mithril: ['#a4d8fb', '#365ba5'],
  adamant: ['#b5e1ad', '#3d785a'],
  rune: ['#d8bbfa', '#7358b9'],
}
function shapeFor(name: string) {
  if (name === 'bones') return 'bones'
  if (name === 'ash') return 'ash'
  if (name === 'junk') return 'scrap'
  if (name === 'burnt_food') return 'burnt'
  if (/eel/.test(name)) return 'eel'
  if (/herring|trout|silverfin/.test(name)) return name.startsWith('cooked') ? 'meal' : 'fish'
  if (/sword|dagger/.test(name)) return 'sword'
  if (/helmet/.test(name)) return 'helmet'
  if (/shield/.test(name)) return 'shield'
  if (/boots/.test(name)) return 'boots'
  if (/body/.test(name)) return 'body'
  if (/legs/.test(name)) return 'legs'
  if (/gloves/.test(name)) return 'gloves'
  if (/crown/.test(name)) return 'crown'
  if (/ring/.test(name)) return 'ring'
  if (/amulet|emblem/.test(name)) return 'amulet'
  if (/ore|coal|core/.test(name)) return 'ore'
  if (/_bar$/.test(name)) return 'bar'
  if (/rune|essence/.test(name)) return 'rune'
  if (/logs/.test(name)) return 'logs'
  if (/seed/.test(name)) return 'seed'
  if (/carrot/.test(name)) return 'carrot'
  if (/potato/.test(name)) return 'potato'
  if (/pumpkin/.test(name)) return 'pumpkin'
  if (/barley|wheat/.test(name)) return 'wheat'
  if (/bread/.test(name)) return 'bread'
  if (/cake/.test(name)) return 'cake'
  if (/egg/.test(name)) return 'egg'
  if (/milk/.test(name)) return 'milk'
  if (/horseshoe/.test(name)) return 'horseshoe'
  if (/chicken/.test(name)) return 'chicken'
  if (name === 'warhorse') return 'horse'
  if (name === 'sheep') return 'sheep'
  if (name === 'goat') return 'goat'
  if (name === 'cow') return 'animal'
  if (/fur|pelt|hide|wool/.test(name)) return 'pelt'
  if (/meat/.test(name)) return 'meat'
  if (/feather/.test(name)) return 'feather'
  if (/coin/.test(name)) return 'coin'
  if (/tail|fang|ear|tusk/.test(name)) return 'fang'
  return 'satchel'
}

/** Original scalable item illustrations; silhouettes, materials and accents identify loot. */
export function ItemArt({ name, className }: { name: string; className: string }) {
  const id = useId().replaceAll(':', '')
  const shape = shapeFor(name)
  const material = Object.keys(palettes).find((m) => name.startsWith(`${m}_`))
  const colors = material
    ? palettes[material]
    : /fish|eel/.test(shape)
      ? /trout/.test(name)
        ? ['#ffcd97', '#a45859']
        : /silverfin/.test(name)
          ? ['#c7f1ee', '#399b9e']
          : ['#a9dfe7', '#428397']
      : /rune|ore/.test(shape)
        ? /fire|molten|copper|infernal/.test(name)
          ? ['#ffb56b', '#a04d35']
          : /air|tin/.test(name)
            ? ['#ecf0e0', '#7b999a']
            : ['#c9b1f0', '#5b548d']
        : /wheat|seed|carrot|pumpkin/.test(shape)
          ? ['#efcb77', '#9b7439']
          : ['#d8ad7f', '#7e513f']
  const fill = `url(#item-${id})`
  const ink = '#2a2424'
  const common = { fill, stroke: ink, strokeWidth: 1.8, strokeLinejoin: 'round' as const }
  let artwork
  switch (shape) {
    case 'bones':
      artwork = (
        <>
          <path
            d="m15 46 30-28m-28 0 28 28"
            stroke="#dfd1af"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="m10 46 4 7m31-40 8 5m-40-6-3 7m35 27 5 7"
            stroke="#e8dcc0"
            strokeWidth="9"
            strokeLinecap="round"
          />
        </>
      )
      break
    case 'ash':
      artwork = (
        <>
          <path
            d="m8 49 12-15 12 2 11-11 14 23-20 8Z"
            fill="#8b8c83"
            stroke={ink}
            strokeWidth="2"
          />
          <path d="m18 45 7-4m8 7 7-3m4-7 6 4" stroke="#b2b3a6" strokeWidth="3" />
        </>
      )
      break
    case 'scrap':
      artwork = (
        <>
          <path
            d="m12 30 15-16 10 7-14 16 8 14-10 7-17-16Z"
            fill="#80654f"
            stroke={ink}
            strokeWidth="2"
          />
          <path d="m35 15 19 12-8 25-16-10Z" fill="#9c9987" stroke={ink} strokeWidth="2" />
          <path d="m39 29 10 3m-13 6 10 3" stroke="#c4bd9d" strokeWidth="2" />
        </>
      )
      break
    case 'burnt':
      artwork = (
        <>
          <ellipse cx="32" cy="43" rx="25" ry="12" fill="#a6a08a" stroke={ink} />
          <path d="m13 40 7-14 23-6 10 24-24 6Z" fill="#514239" stroke={ink} strokeWidth="2" />
          <path d="m21 33 8 7m8-13 5 13" stroke="#98734d" strokeWidth="3" />
        </>
      )
      break
    case 'fish':
      artwork = (
        <>
          <path {...common} d="M10 33Q25 12 46 31l11-10v23L46 35Q25 52 10 33Z" />
          <path d="M27 23 34 16l6 10M25 41l9 7 7-9" fill={colors[1]} stroke={ink} />
          <path d="M30 25q8 8 0 16M37 26q8 7 0 13" fill="none" stroke={colors[0]} opacity=".7" />
          <circle cx="19" cy="30" r="2.2" fill={ink} />
          <path d="M14 36h6" stroke={ink} />
        </>
      )
      break
    case 'eel':
      artwork = (
        <>
          <path
            {...common}
            d="M12 19q25-13 35 1t-17 17q-18 3-7 10t30-7q-10 21-34 15T18 29q26-4 18-8T12 25Z"
          />
          <circle cx="14" cy="21" r="2" fill="#fff1c7" />
        </>
      )
      break
    case 'meal':
      artwork = (
        <>
          <ellipse cx="32" cy="40" rx="27" ry="15" fill="#c3ac83" stroke={ink} strokeWidth="2" />
          <ellipse cx="32" cy="37" rx="23" ry="11" fill="#eee0ba" />
          <path d="M13 34q17-19 35-5l7-5v15l-8-4q-21 14-34-1Z" {...common} />
          <path d="m26 27 3 10m5-12 3 10" stroke="#694737" strokeWidth="3" />
          <path d="m20 45 5-5 5 7m14-7 6 5" stroke="#637c45" strokeWidth="3" />
        </>
      )
      break
    case 'sword':
      artwork = (
        <>
          <path {...common} d="m19 44 27-34 10-2-1 11-31 31Z" />
          <path d="m24 41 27-27" stroke={colors[0]} strokeWidth="2" />
          <path d="m12 39 17 15 4-5-17-15Z" fill="#c9a566" stroke={ink} strokeWidth="2" />
          <path d="m8 55 10-12 6 5-9 12Z" fill="#795541" stroke={ink} strokeWidth="2" />
          <circle cx="12" cy="55" r="4" fill="#d9ba7c" stroke={ink} />
        </>
      )
      break
    case 'helmet':
      artwork = (
        <>
          <path {...common} d="M12 46V29q0-22 20-22t20 22v17L39 57l-7-12-7 12Z" />
          <path d="M32 10v34M15 28h34" stroke={colors[0]} strokeWidth="3" />
          <path d="m17 33 10 3m10 0 10-3" stroke={ink} strokeWidth="5" />
          <path d="M30 13h4v31h-4" fill="#c9ac6a" />
        </>
      )
      break
    case 'shield':
      artwork = (
        <>
          <path {...common} d="M32 6 54 15v22Q49 52 32 60 15 52 10 37V15Z" />
          <path d="M32 11v43M15 27h34" stroke="#e4c994" strokeWidth="4" />
          <path d="m32 22 9 11-9 11-9-11Z" fill={colors[1]} stroke={ink} />
          <circle cx="16" cy="19" r="2" fill="#f2d899" />
          <circle cx="48" cy="19" r="2" fill="#f2d899" />
        </>
      )
      break
    case 'boots':
      artwork = (
        <>
          <path {...common} d="M10 13h17v28l8 7v9H8V42Z" />
          <path {...common} d="M35 8h17v28l8 7v9H33V37Z" />
          <path d="M10 21h16M35 16h16M9 50h25M34 45h25" stroke="#dfc599" strokeWidth="3" />
        </>
      )
      break
    case 'body':
      artwork = (
        <>
          <path {...common} d="m19 9 13 7 13-7 13 15-12 10-1 22H19l-1-22L6 24Z" />
          <path d="M32 18v33m-13-9h26M20 17l-3 14m27-14 3 14" stroke={colors[0]} strokeWidth="3" />
          <path d="M18 47h28v8H18Z" fill="#5e4437" />
          <rect x="28" y="47" width="8" height="8" fill="#d9b673" />
        </>
      )
      break
    case 'legs':
      artwork = (
        <>
          <path {...common} d="M14 9h36l-4 47H33l-1-28-4 28H15Z" />
          <path d="M15 17h34M20 22l-1 25m22-25-2 25" stroke={colors[0]} strokeWidth="3" />
        </>
      )
      break
    case 'gloves':
      artwork = (
        <>
          <path
            {...common}
            d="m8 34 9-9V13h7v17l5-8 5 4-7 23H12ZM36 35l8-9V10h7v19l5-7 5 4-7 26H39Z"
          />
          <path d="M11 46h16m11 3h16" stroke="#e2c58e" strokeWidth="4" />
        </>
      )
      break
    case 'crown':
      artwork = (
        <>
          <path
            d="M10 19 22 31l10-20 10 20 12-12-6 32H16Z"
            fill="#d5ab4f"
            stroke={ink}
            strokeWidth="2"
          />
          <path d="M16 44h32v10H16Z" fill="#f2d388" stroke={ink} />
          <path d="m32 31 5 7-5 7-5-7Z" fill={/frozen/.test(name) ? '#6cd0f2' : '#e96c46'} />
        </>
      )
      break
    case 'ring':
      artwork = (
        <>
          <circle cx="32" cy="37" r="18" fill="none" stroke="#c29b59" strokeWidth="8" />
          <circle cx="32" cy="37" r="19" fill="none" stroke="#f0d698" strokeWidth="2" />
          <path {...common} d="m32 6 12 10-12 13-12-13Z" />
        </>
      )
      break
    case 'amulet':
      artwork = (
        <>
          <path d="M12 8q0 33 20 31T52 8" fill="none" stroke="#ceae72" strokeWidth="4" />
          <path {...common} d="m32 28 16 12-16 20-16-20Z" />
          <path d="m32 34 8 7-8 11-8-11Z" fill={colors[0]} />
        </>
      )
      break
    case 'ore':
      artwork = (
        <>
          <path {...common} d="m6 42 8-23 22-11 20 18 3 19-19 13-25-3Z" />
          <path
            d="m14 19 17 16 5-27m-5 27 25-9m-25 9 9 23M6 42l25-7"
            fill="none"
            stroke={colors[0]}
            strokeWidth="2"
          />
          <path d="m19 21 7-5 2 12Z" fill="#fff3cc" opacity=".55" />
        </>
      )
      break
    case 'bar':
      artwork = (
        <>
          <path {...common} d="m8 28 13-13h32l6 23-13 12H5Z" />
          <path
            d="M8 28h34l11-13M42 28l4 22M5 50l3-22"
            fill="none"
            stroke={colors[0]}
            strokeWidth="2"
          />
        </>
      )
      break
    case 'rune':
      artwork = (
        <>
          <path {...common} d="m13 16 20-9 19 12 4 26-21 13-23-12Z" />
          <path
            d="m34 17-12 15 19 3-11 14m-8-24 18-4"
            fill="none"
            stroke="#f8eace"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )
      break
    case 'logs':
      artwork = (
        <>
          <path d="m11 39 27-25 18 8-25 28Z" fill="#86573a" stroke={ink} strokeWidth="2" />
          <path d="m18 38 23-19m-17 26 24-22" stroke="#c19560" strokeWidth="2" />
          <ellipse cx="21" cy="44" rx="14" ry="10" fill="#dbb67c" stroke={ink} strokeWidth="2" />
          <ellipse cx="21" cy="44" rx="8" ry="5" fill="none" stroke="#a17544" strokeWidth="2" />
        </>
      )
      break
    case 'seed':
      artwork = (
        <>
          <path {...common} d="M17 22h30l7 28q-22 13-44 0Z" />
          <path d="M20 13h24l-5 10H25Z" fill="#92734c" />
          <path
            d="M32 44V28m0 8q-13 0-11-10 11 0 11 10m0 5q13 0 11-10-11 0-11 10"
            stroke="#739252"
            strokeWidth="3"
            fill="#a9ba6c"
          />
        </>
      )
      break
    case 'carrot':
      artwork = (
        <>
          <path d="m24 23 20 7-28 29Z" fill="#e9964b" stroke={ink} strokeWidth="2" />
          <path d="m29 23-5-16m11 19 10-18m-12 16 1-20" stroke="#8cac58" strokeWidth="5" />
          <path d="m23 35 7 3m-10 8 6 2" stroke="#a95b2c" strokeWidth="2" />
        </>
      )
      break
    case 'potato':
      artwork = (
        <>
          <path {...common} d="M14 18q25-17 38 8 10 24-21 29-26 3-24-15Z" />
          <path d="M18 29h2m14-9h2m7 21h2m-20 4h2" stroke="#785138" strokeWidth="3" />
        </>
      )
      break
    case 'pumpkin':
      artwork = (
        <>
          <path d="m31 20 3-13 7-2" stroke="#6a8443" strokeWidth="5" fill="none" />
          <ellipse cx="32" cy="38" rx="26" ry="20" fill="#d8863d" stroke={ink} strokeWidth="2" />
          <ellipse
            cx="32"
            cy="38"
            rx="13"
            ry="20"
            fill="#edaa51"
            stroke="#a66a34"
            strokeWidth="2"
          />
        </>
      )
      break
    case 'wheat':
      artwork = (
        <>
          <path d="M29 57 36 9m-11 48L17 19m17 38 16-33" stroke="#d3b86c" strokeWidth="3" />
          <path
            d="m34 21-10-10 13 2m-5 18-12-9 15 2m-5 18-12-9 15 2m4-9 12-10-13 3m-1 17 12-10-13 3"
            fill="#e8cb7b"
            stroke="#ae8d45"
            strokeWidth="2"
          />
        </>
      )
      break
    case 'bread':
      artwork = (
        <>
          <path d="M7 43q0-32 27-30 27-2 25 30v10H7Z" fill="#d7a560" stroke={ink} strokeWidth="2" />
          <path
            d="m17 26 6 8m7-12 6 9m7-7 6 9"
            stroke="#f1d29a"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path d="M9 45h48" stroke="#9e6a38" strokeWidth="2" />
        </>
      )
      break
    case 'cake':
      artwork = (
        <>
          <path d="M10 31h44v22H10Z" fill="#d2a46b" stroke={ink} strokeWidth="2" />
          <path d="M10 34h44v10H10Z" fill="#954f57" />
          <ellipse cx="32" cy="30" rx="22" ry="9" fill="#f3dec0" stroke={ink} />
          <circle cx="32" cy="23" r="5" fill="#b3524e" />
          <path d="m32 19 5-6" stroke="#78904c" strokeWidth="2" />
        </>
      )
      break
    case 'egg':
      artwork = (
        <path d="M32 9C14 9 3 56 32 56S50 9 32 9Z" fill="#ead6b2" stroke={ink} strokeWidth="2" />
      )
      break
    case 'milk':
      artwork = (
        <>
          <path d="M23 8h18v12l8 11v25H15V31l8-11Z" fill="#c6d2cc" stroke={ink} strokeWidth="2" />
          <path d="M18 36h28v17H18Z" fill="#f0e4ca" />
          <path d="M23 8h18v9H23Z" fill="#ac8b5d" />
        </>
      )
      break
    case 'horseshoe':
      artwork = (
        <>
          <path {...common} d="M12 9h11v23q0 17 18 0V9h11v24q0 37-40 0Z" />
          <path d="M17 17h1m0 14h1m4 13h1m19-27h1m-1 14h1m-5 13h1" stroke={ink} strokeWidth="3" />
        </>
      )
      break
    case 'chicken':
      artwork = (
        <>
          <ellipse cx="29" cy="37" rx="21" ry="17" fill="#e2d3b2" stroke={ink} strokeWidth="2" />
          <path d="M42 31V17q9-10 15 2v16" fill="#efdfba" stroke={ink} />
          <path d="m56 20 7 4-7 3" fill="#d7a251" />
          <path d="m46 16-3-7 8 2 4-5 4 8" fill="#bd5a4f" />
          <circle cx="52" cy="20" r="2" fill={ink} />
          <path d="M20 52v8m17-8v8" stroke="#c29559" strokeWidth="3" />
        </>
      )
      break
    case 'animal':
      artwork = (
        <>
          <path {...common} d="M9 30q2-16 30-7l9-12 12 8-5 21-12 1-3 17h-7l-2-17-8 17h-7l2-18Z" />
          <path d="m46 12-3-8m9 10 6-8" stroke={colors[0]} strokeWidth="4" />
          <circle cx="53" cy="23" r="2" fill={ink} />
          <path d="M15 29q10-7 16 0" stroke={colors[0]} strokeWidth="4" fill="none" />
        </>
      )
      break
    case 'horse':
      artwork = (
        <>
          <path {...common} d="M12 52 14 27l14-11 6-10 12 1 3 10 11 10-4 12-12-6-2 23Z" />
          <path d="m30 9-9 7-5 19m19-25 2 10" stroke="#644536" strokeWidth="6" fill="none" />
          <circle cx="44" cy="21" r="2" fill={ink} />
          <path d="m40 29 15 5" stroke="#be9765" strokeWidth="3" />
        </>
      )
      break
    case 'sheep':
      artwork = (
        <>
          <path d="M18 45v13m21-13v13" stroke="#735941" strokeWidth="6" />
          <path
            d="M8 27q-3-13 11-14 3-10 14-5 11-5 13 9 12 5 8 17 0 18-17 18-14 8-21-3-13-4-8-22Z"
            fill="#ece1c8"
            stroke={ink}
            strokeWidth="2"
          />
          <path d="m42 22 16 2-3 20-15-4Z" fill="#867661" stroke={ink} />
          <circle cx="51" cy="29" r="2" fill={ink} />
          <path d="M17 25q7-7 11 0m-4 13q7-7 11 0" fill="none" stroke="#cdbf9f" strokeWidth="2" />
        </>
      )
      break
    case 'goat':
      artwork = (
        <>
          <path {...common} d="m15 20 17-5 17 5 5 22-13 10-9 9-9-9-13-10Z" />
          <path d="M22 20Q5 3 15 5m27 15Q59 3 49 5" fill="none" stroke="#bdad8b" strokeWidth="5" />
          <path d="m15 25-9-7m43 7 9-7" stroke={colors[0]} strokeWidth="6" />
          <path d="m22 31 6 3m8 0 6-3" stroke={ink} strokeWidth="3" />
          <path d="m26 44 6 4 6-4" fill="none" stroke={ink} />
        </>
      )
      break
    case 'pelt':
      artwork = (
        <path {...common} d="m15 9 12 6 10-6 13 7-5 13 11 16-15 9-9-4-12 6-12-9 11-15-9-12Z" />
      )
      break
    case 'meat':
      artwork = (
        <>
          <path
            d="M11 40q-11-25 17-29 28-3 27 22 0 20-27 23Z"
            fill="#af675f"
            stroke={ink}
            strokeWidth="2"
          />
          <path d="M15 37q-5-17 15-20 19-3 18 16" fill="none" stroke="#e5b09a" strokeWidth="4" />
          <path d="m33 26 10 13-10 7-8-13Z" fill="#e8d7b5" />
        </>
      )
      break
    case 'feather':
      artwork = (
        <>
          <path {...common} d="M12 54Q3 24 43 7q23 21-16 43Z" />
          <path d="m9 58 36-42M18 44l-3-16m12 10 17-3" stroke="#efe0be" strokeWidth="2" />
        </>
      )
      break
    case 'coin':
      artwork = (
        <>
          <circle cx="32" cy="32" r="24" fill="#d6ad5f" stroke={ink} strokeWidth="2" />
          <circle cx="32" cy="32" r="19" fill="none" stroke="#f5da93" strokeWidth="2" />
          <path d="m32 17 12 15-12 15-12-15Z" fill="#b4823a" stroke="#f3d492" />
        </>
      )
      break
    case 'fang':
      artwork = (
        <path d="M19 10h28q9 25-32 48 13-27 4-48Z" fill="#e5d6b3" stroke={ink} strokeWidth="2" />
      )
      break
    default:
      artwork = (
        <>
          <path {...common} d="m18 19-4 33q18 13 36 0l-4-33Z" />
          <path d="M17 18h30M23 9l5 9m13-9-5 9" stroke="#dab87d" strokeWidth="3" />
          <circle cx="32" cy="38" r="9" fill="#d1b377" stroke={ink} />
        </>
      )
  }
  return (
    <svg
      viewBox="0 0 64 64"
      className={`item-art shrink-0 ${className}`}
      aria-hidden="true"
      data-art-kind={shape}
      data-art-material={material ?? 'natural'}
    >
      <defs>
        <linearGradient id={`item-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={colors[0]} />
          <stop offset="1" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="55" rx="23" ry="5" fill="#000" opacity=".25" />
      {artwork}
    </svg>
  )
}
