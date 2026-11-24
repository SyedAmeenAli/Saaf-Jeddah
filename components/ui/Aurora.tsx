import Image from "next/image";

/** Fixed page backdrop: darkened, blurred apron photo under a scrim, a horizon glow and film grain. */
export function Aurora() {
  return (
    <>
      <div className="backdrop" aria-hidden="true">
        <div className="backdrop-photo">
          <Image src="/images/hero-apron.webp" alt="" fill priority sizes="100vw" className="object-cover" />
        </div>
        <div className="orb a" />
        <div className="orb b" />
        <div className="backdrop-scrim" />
        <div className="backdrop-horizon" />
      </div>
      <div className="grain" aria-hidden="true" />
    </>
  );
}
