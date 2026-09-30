# Medieval environment artwork

`medieval-world.webp` is an original generated environment sheet, encoded as WebP
at quality 84 for the game (approximately 479 KB). Its four equally sized quadrants
are fishing shores, ancient woodland, a blacksmith forge, and a snowy fortress.

`LocationArt` displays each quadrant using CSS clipping, sharing one cached image
across the game. Marsh/crypt and deepwater locations use atmospheric color treatments.
The image is decorative; location names and useful information remain readable HTML.

Item and bestiary illustrations are original scalable SVG components in
`src/ui/ItemArt.tsx` and `src/ui/EnemyArt.tsx`. Equipment materials use bronze,
iron, steel, mithril, adamant, and rune palettes.

`idle-world.webp` is an original generated four-quadrant environment atlas: lake (top left), woodland (top right), cavern (bottom left), workshop (bottom right). It is used by WorldScene with animated original SVG boat/fish overlays. No artwork was extracted from the reference screenshots.
