import { EnemyArt } from './EnemyArt'
/** Full-body original beast silhouettes for the combat scene. */
export function EnemyFigure({ id }: { id: string }) {
  if (!/wolf|rat/.test(id)) return <EnemyArt name={id} className="enemy-stage-art" />
  const rat = id.includes('rat')
  const body = rat ? '#92877a' : '#899ba0'
  return <svg viewBox="0 0 420 360" className="enemy-stage-art" aria-hidden="true">
    <ellipse cx="211" cy="326" rx="157" ry="20" fill="#0b2527" opacity=".4" />
    <path d={rat ? 'M326 233q114-92 54 39t-87 40' : 'm302 162 87-38-12 61 22 40-60 23-45-47Z'} fill={rat ? 'none' : body} stroke={rat ? '#bba895' : '#304249'} strokeWidth={rat ? 10 : 5} strokeLinecap="round" />
    <path d="m129 162 96-23 91 47 10 73-43 14-80-23-70 1-30-37Z" fill={body} stroke="#304249" strokeWidth="5" />
    <path d="m157 229-10 93-30 3-10-14 7-92m89 20 8 83h-28l-16-76m103-17 23 83h-29l-34-67m69-24 20 86-28 8-27-92" fill={body} stroke="#304249" strokeWidth="5" />
    <path d="m96 117 13-72 36 40 23-42 20 83-9 77-43 46-70-63-36-27 56-14Z" fill={body} stroke="#304249" strokeWidth="5" />
    <path d="m114 65 17 38-21-6m56-35 6 40-20-7" fill="#c8b5a6"/>
    <path d="m174 147 23 29-14 7 13 25-20-4 8 28-25-12-24 21-23-33-34-14 31-20Z" fill="#c4cdc7"/>
    <path d="m84 151-31 9 32 31 38-5 4-20Z" fill="#d4d0ba" stroke="#304249" strokeWidth="3"/>
    <path d="m51 159 13-5 4 10-12 6Z" fill="#273a3f"/>
    <path d="m108 136 19-6-8 12Z" fill="#edcd7e"/><circle cx="116" cy="135" r="3" fill="#173239"/>
    <path d="m226 156 15 35 25 7-15 9 47 33-25 4m-73-76 13 25-17 20m-49-94-18 19" stroke="#617780" strokeWidth="8" fill="none" />
    <path d="m111 321 4-7m12 10 3-10m58 9 4-8m81 9 3-9m45 3 4-8" stroke="#dae0cd" strokeWidth="3" />
  </svg>
}
