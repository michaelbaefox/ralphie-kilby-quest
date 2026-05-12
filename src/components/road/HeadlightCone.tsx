type HeadlightConeProps = {
  /** Whether Ralphie is heading west (true = nose pointing left). */
  headingWest: boolean
  /** Pixel position of the Prius nose along the bottom of the road stage. */
  noseLeft: number
  noseTop: number
}

/**
 * A soft golden cone that radiates from the front of the Prius. Only useful at
 * night — the parent decides whether to render it based on `sun.tod === 'night'`.
 */
export const HeadlightCone = ({ headingWest, noseLeft, noseTop }: HeadlightConeProps) => {
  // Width and height come from the .headlightCone CSS class; we just position it.
  // When heading east, the sprite is mirrored, so the cone needs to flip too.
  return (
    <div
      className={`headlightCone${headingWest ? ' headlightCone--west' : ''}`}
      style={{
        left: headingWest ? noseLeft - 110 : noseLeft,
        top: noseTop - 14,
      }}
      aria-hidden
    />
  )
}
