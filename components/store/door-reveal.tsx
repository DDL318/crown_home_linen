"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export const CROWN = { src: "/images/brand/crown-mark.png", width: 1120, height: 794 };
// How long the two halves of the navy take to slide apart.
const PART_MS = 1250;
// If the shop never arrives, open anyway rather than hold the doors shut.
const GIVE_UP_MS = 8000;

type Opening = { to: string; crown: DOMRect };

const DoorContext = createContext<(opening: Opening) => void>(() => {});

export function useOpenDoors() {
  return useContext(DoorContext);
}

// The navy ground of the front door with its double frame and corner
// diamonds. The front door and both sliding doors draw the same one, so the
// hand-over between them cannot be seen.
export function DoorGround() {
  return (
    <>
      <span className="door-aura pointer-events-none absolute left-1/2 top-[42%] -z-10 h-[90vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden />
      <span className="pointer-events-none absolute inset-3 border-2 border-[#fbf8f1]/70 sm:inset-5" aria-hidden />
      <span className="pointer-events-none absolute inset-[18px] border border-gold/60 sm:inset-[29px]" aria-hidden />
      {["left-3 top-3 sm:left-5 sm:top-5", "right-3 top-3 sm:right-5 sm:top-5", "bottom-3 left-3 sm:bottom-5 sm:left-5", "bottom-3 right-3 sm:bottom-5 sm:right-5"].map((corner) => (
        <span key={corner} className={`pointer-events-none absolute ${corner} h-2 w-2 -translate-x-[3px] -translate-y-[3px] rotate-45 bg-gold`} aria-hidden />
      ))}
    </>
  );
}

// Lives in the store layout, so it outlasts the change of page. "Shop now"
// hands it the crown's position; it covers the screen with two doors that
// look exactly like the front door, moves to the shop underneath, and once
// the shop is there slides the doors apart to show it.
export function DoorReveal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [opening, setOpening] = useState<Opening | null>(null);
  const [parting, setParting] = useState(false);

  const open = useCallback(
    (next: Opening) => {
      setParting(false);
      setOpening(next);
      router.push(next.to);
    },
    [router],
  );

  const arrived = opening !== null && pathname === opening.to;

  // Wait until the shop has been drawn underneath, then part the doors.
  useEffect(() => {
    if (!opening) return;
    let frame = 0;
    if (arrived) {
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => setParting(true));
      });
    }
    const giveUp = window.setTimeout(() => setParting(true), GIVE_UP_MS);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(giveUp);
    };
  }, [opening, arrived]);

  useEffect(() => {
    if (!parting) return;
    const done = window.setTimeout(() => {
      setOpening(null);
      setParting(false);
    }, PART_MS + 100);
    return () => window.clearTimeout(done);
  }, [parting]);

  return (
    <DoorContext.Provider value={open}>
      {children}
      {opening ? (
        <div className={`sliding-doors fixed inset-0 z-[70] overflow-hidden ${parting ? "is-parting" : ""}`} aria-hidden>
          <Door side="left" opening={opening} />
          <Door side="right" opening={opening} />
        </div>
      ) : null}
    </DoorContext.Provider>
  );
}

function Door({ side, opening }: { side: "left" | "right"; opening: Opening }) {
  const { crown } = opening;
  return (
    <div className={`sliding-door sliding-door-${side} absolute inset-y-0 overflow-hidden`}>
      {/* The whole front door, of which this door shows one half. */}
      <div className="navy-ground absolute inset-y-0 isolate">
        <DoorGround />
        {/* eslint-disable-next-line @next/next/no-img-element -- already loaded by the front door; must paint at once */}
        <img
          src={CROWN.src}
          alt=""
          className={`door-half door-${side} absolute max-w-none`}
          // Centred, as on the front door, so a scrollbar appearing on the
          // shop underneath cannot pull the halves out of line.
          style={{ left: `calc(50% - ${crown.width / 2}px)`, top: crown.top, width: crown.width, height: crown.height }}
        />
      </div>
    </div>
  );
}
