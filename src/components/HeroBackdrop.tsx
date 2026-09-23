/* The backdrop behind the hero: a soft glow in the accent colour at the top
   over a fine dot grid, spanning the whole document column and fading out
   before the first plate.  Rendered as the first child of .doc so the rail and
   the grid never clip it.  Static under reduced motion; hidden with `bg flat`
   and in print. */
export function HeroBackdrop() {
  return (
    <div className="hero-backdrop" aria-hidden="true">
      <span className="glow" />
    </div>
  );
}
