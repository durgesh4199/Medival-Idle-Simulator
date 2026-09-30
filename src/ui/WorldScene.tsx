/** Original layered vector scenery, independent of the reference game's assets. */
export function TreeArt({ variant = 'normal', className = '' }: { variant?: string; className?: string }) {
  const willow = variant.includes('willow')
  const color = willow ? '#8ab9a1' : variant.includes('yew') ? '#456e58' : variant.includes('oak') ? '#80ac62' : '#95bf57'
  return <svg viewBox="0 0 240 300" aria-hidden="true" className={className}>
    <ellipse cx="120" cy="282" rx="79" ry="12" fill="#102820" opacity=".35" />
    <path d="M91 281q24-50 16-119L64 118l12-13 42 38 36-54 15 10-38 67q-7 60 21 115Z" fill="#705747" stroke="#3d3d32" strokeWidth="5" />
    <path d="m111 257 6-73m7 45 7 41m-13-100-27-37" stroke="#aa8260" strokeWidth="5" fill="none" />
    {[ [67,97,46], [116,65,54], [169,103,49], [91,130,43], [149,139,43] ].map(([x,y,r], i) => <g key={i}>
      <circle cx={x} cy={y} r={r} fill={color} stroke="#375c4b" strokeWidth="3" />
      <ellipse cx={x-9} cy={y-13} rx={r*.65} ry={r*.42} fill="#d0e2a7" opacity=".22" />
      {willow && <path d={`M${x-r*.6} ${y+12}v65q8 20 16 0v-46m15-8v81q8 19 15 0v-77`} stroke={color} strokeWidth="15" strokeLinecap="round" fill="none" />}
    </g>)}
  </svg>
}
export function WorldScene({ kind, active = false }: { kind: 'lake' | 'forest' | 'combat' | 'cave' | 'workshop'; active?: boolean }) {
  const lake = kind === 'lake'
  return <div className={`world-scene world-${kind}`} aria-hidden="true">
    <div className={`illustrated-world scene-${kind}`}><img src={`${import.meta.env.BASE_URL}art/idle-world.webp`} alt="" /></div>
    {lake && <><svg viewBox="0 0 240 180" className={`fishing-boat ${active ? 'boat-working' : ''}`}><path d="M23 103h153l-24 42H53Z" fill="#d6b580" stroke="#5f5140" strokeWidth="4"/><path d="M35 117h129M65 95v-23h78v23" stroke="#7c6042" strokeWidth="7" fill="none"/><path d="m66 125-38 40" stroke="#c69b55" strokeWidth="10"/><circle cx="128" cy="113" r="11" fill="#ede5cd"/><path d="M164 104V47q0-35 53-35" stroke="#996c31" strokeWidth="6" fill="none"/><path d="M215 13v156" stroke="#cadbd6" strokeWidth="2"/><path d="m215 162-5 10q7 10 12-2" fill="none" stroke="#d6ab59" strokeWidth="3"/></svg><div className={`lake-fish ${active ? 'fish-swimming' : ''}`}>{Array.from({length:9},(_,i)=><svg key={i} viewBox="0 0 80 40" style={{left:`${10+(i*19)%70}%`,top:`${61+(i*7)%30}%`,animationDelay:`-${i*3}s`}}><path d="m12 20-11-13v26Zm0 0q26-27 61 0-35 27-61 0Z" fill={i%2?'#a8b866':'#77b4b6'}/><circle cx="60" cy="16" r="3" fill="#183c42"/><path d="m30 13 13-10 3 11" fill="#c9bd69"/></svg>)}</div></>}
  </div>
}
