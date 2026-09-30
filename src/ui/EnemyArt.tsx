/** Illustrated bestiary portraits share the item palette and ink outlines. */
export function EnemyArt({ name, className }: { name: string; className: string }) {
  const beast = /rat|wolf|fang/.test(name)
  const ghost = /wraith|ghost|spirit/.test(name)
  const bones = /skeleton/.test(name)
  const hood = /cultist|raider/.test(name)
  const frost = /frost|ice|frozen/.test(name)
  const ember = /infernal|ember|ash/.test(name)
  const skin = frost
    ? '#b5cbd3'
    : ember
      ? '#bc7966'
      : /goblin|troll/.test(name)
        ? '#99a76c'
        : '#bead90'
  return (
    <svg viewBox="0 0 64 64" className={`item-art shrink-0 ${className}`} aria-hidden="true">
      <ellipse cx="32" cy="57" rx="25" ry="4" fill="#000" opacity=".25" />
      {ghost ? (
        <>
          <path
            d="M12 58V30q0-25 20-25t20 25v28l-10-7-10 8-10-8Z"
            fill={ember ? '#a77669' : '#91bdc3'}
            stroke="#25383c"
            strokeWidth="2"
          />
          <path d="m19 28 10 3m7 0 10-3" stroke="#ecedd4" strokeWidth="4" />
          <path d="m26 46 6-10 6 10" fill="#38565b" />
        </>
      ) : beast ? (
        <>
          <path
            d="m10 27 3-20 15 14 8-1L51 7l4 23-11 23-12 9-12-9Z"
            fill={/wolf/.test(name) ? '#b4bec6' : '#ae967c'}
            stroke="#352e29"
            strokeWidth="2"
          />
          <path d="m18 30 11 4m6 0 11-4" stroke="#edd596" strokeWidth="3" />
          <path d="m21 44 11-9 12 9-12 14Z" fill="#e0d1b5" stroke="#352e29" />
          <path d="m28 44 4 4 5-4Z" fill="#43382f" />
          <path d="m11 41-6 3m47-3 7 3" stroke="#d3bc99" strokeWidth="2" />
        </>
      ) : (
        <>
          <path
            d="M8 60V38Q5 8 32 6q27 2 24 32v22Z"
            fill={hood ? '#615346' : '#574f3e'}
            stroke="#302923"
            strokeWidth="2"
          />
          <path
            d={
              bones
                ? 'M15 29q0-19 17-19t17 19v14l-7 6v9H22v-9l-7-6Z'
                : 'm16 20 16-9 16 9 3 24-12 12H25L13 44Z'
            }
            fill={bones ? '#e0d1af' : skin}
            stroke="#302923"
            strokeWidth="2"
          />
          {!bones && <path d="m14 28-10-8 3 16m43-8 10-8-3 16" fill={skin} stroke="#302923" />}
          <path d="m20 31 9 3m6 0 9-3" stroke={bones ? '#41372e' : '#f2d8a2'} strokeWidth="5" />
          <path
            d="m29 39 3-4 4 4m-14 8h20m-14-1v7m8-7v7"
            fill="none"
            stroke="#473a30"
            strokeWidth="2"
          />
          {hood && (
            <path
              d="M10 31Q10-2 32 6q22-8 22 25L32 15Z"
              fill="#6c5860"
              stroke="#302923"
              strokeWidth="2"
            />
          )}
        </>
      )}
    </svg>
  )
}
