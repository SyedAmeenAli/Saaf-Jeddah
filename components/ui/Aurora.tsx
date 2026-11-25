/** Atmospheric backdrop: deep navy gradient, drifting teal / ice / champagne light, faint grain. No photography. */
export function Aurora() {
  return (
    <>
      <div className="backdrop" aria-hidden="true">
        <div className="orb a" />
        <div className="orb b" />
        <div className="orb c" />
        <div className="backdrop-horizon" />
      </div>
      <div className="grain" aria-hidden="true" />
    </>
  );
}
