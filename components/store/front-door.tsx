"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageCircle } from "lucide-react";

const CROWN = { src: "/images/brand/crown-mark.png", width: 560, height: 397 };
// The doors slide apart and the navy dissolves in about 1.65 s; the shop is
// shown once only the cream page is left.
const OPEN_MS = 1700;
// The arrival plays once per visit (per browser tab).
const SEEN = "crown-door-seen";

function readSeen() {
  try {
    return sessionStorage.getItem(SEEN) === "1";
  } catch {
    return false;
  }
}
function markSeen() {
  try {
    sessionStorage.setItem(SEEN, "1");
  } catch {
    // Storage blocked: the arrival simply plays every time.
  }
}
const noSubscribe = () => () => {};

function step(order: number) {
  return { "--d": order } as React.CSSProperties;
}

// The home page: one screen, the crown in the middle on the navy ground.
// On the first visit the crown fades up and the letters of CROWN glide
// together. "Shop now" slides the two halves of the crown apart like sliding
// doors while the navy quietly dissolves into the cream of the shop.
export function FrontDoor({
  headline,
  line,
  whatsappHref,
  phone,
}: {
  headline: string;
  line: string;
  whatsappHref: string;
  phone: string;
}) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const returning = useSyncExternalStore(noSubscribe, readSeen, () => false);

  // Remember the arrival once it has played (or the door is opened), not on
  // load: marking it straight away would cut the first arrival short.
  // The shop itself is fetched in the background by the prefetching links
  // below, so it is ready by the time the doors have opened.
  useEffect(() => {
    const timer = window.setTimeout(markSeen, 3200);
    return () => window.clearTimeout(timer);
  }, []);

  function enter(event: React.MouseEvent) {
    // Let people open the shop in a new tab as usual.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    if (opening) return;
    markSeen();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push("/shop");
      return;
    }
    setOpening(true);
    window.setTimeout(() => router.push("/shop"), OPEN_MS);
    // On a slow connection the shop may not be there yet: show a quiet loader.
    window.setTimeout(() => setWaiting(true), OPEN_MS + 250);
  }

  return (
    <>
    <section
      className={`front-door navy-ground relative isolate flex h-svh min-h-[520px] flex-col overflow-hidden text-[#fbf8f1] ${opening ? "is-opening" : ""} ${returning ? "is-returning" : ""}`}
      aria-label="Crown"
    >
      {/* Soft gold glow behind the crown, and the double frame of the brand. */}
      <span className="door-aura pointer-events-none absolute left-1/2 top-[42%] -z-10 h-[90vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden />
      <span className="pointer-events-none absolute inset-3 border-2 border-[#fbf8f1]/70 sm:inset-5" aria-hidden />
      <span className="pointer-events-none absolute inset-[18px] border border-gold/60 sm:inset-[29px]" aria-hidden />
      {["left-3 top-3 sm:left-5 sm:top-5", "right-3 top-3 sm:right-5 sm:top-5", "bottom-3 left-3 sm:bottom-5 sm:left-5", "bottom-3 right-3 sm:bottom-5 sm:right-5"].map((corner) => (
        <span key={corner} className={`pointer-events-none absolute ${corner} h-2 w-2 -translate-x-[3px] -translate-y-[3px] rotate-45 bg-gold`} aria-hidden />
      ))}

      <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
        <Link href="/shop" prefetch onClick={enter} aria-label="Open the shop" className="door-stage door-in relative block" data-track="Crown door" data-track-id="door-crown">
          <span className="door-crown crown-gleam relative block">
            <Image src={CROWN.src} alt="" width={CROWN.width} height={CROWN.height} priority className="door-half door-left" />
            <Image src={CROWN.src} alt="" width={CROWN.width} height={CROWN.height} priority className="door-half door-right absolute inset-0" />
          </span>
        </Link>

        <div className="door-copy">
          <h1 className="door-word mt-[3.2svh] whitespace-nowrap font-serif text-[clamp(2.1rem,7.5svh,4.4rem)] font-bold leading-none text-[#fbf8f1]">
            CROWN
            <span className="sr-only"> — {headline}</span>
          </h1>
          <span className="door-in mx-auto mt-[2.4svh] block h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent" style={step(5)} aria-hidden />
          <p className="door-in mx-auto mt-[2.4svh] max-w-md text-balance font-serif text-[clamp(1.05rem,2.7svh,1.45rem)] italic leading-snug text-gold-hi" style={step(6)}>
            {headline}
          </p>
          <p className="door-in mx-auto mt-2 max-w-md text-balance text-[clamp(0.8rem,1.85svh,0.95rem)] leading-relaxed text-mist" style={step(7)}>
            {line}
          </p>
          <div className="door-in mt-[4.2svh]" style={step(8)}>
            <Link href="/shop" prefetch onClick={enter} className="btn-brass min-h-[3.2rem] px-9 text-[0.74rem]" data-track="Shop now" data-track-id="door-shop-now">
              Shop now <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      <nav aria-label="More" className="door-copy door-in relative flex flex-wrap items-center justify-center gap-x-5 gap-y-1 px-8 pb-[max(2.6rem,calc(env(safe-area-inset-bottom)+2rem))] text-[12.5px] text-[#fbf8f1]/75 sm:pb-12" style={step(9)}>
        <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-gold-hi" data-track-type="whatsapp_click" data-track="WhatsApp door" data-track-id="door-whatsapp">
          <MessageCircle size={13} aria-hidden /> {phone}
        </a>
        <Link href="/wholesale" className="hover:text-gold-hi">
          Wholesale
        </Link>
        <Link href="/about" className="hover:text-gold-hi">
          About
        </Link>
        <Link href="/contact" className="hover:text-gold-hi">
          Visit the shop
        </Link>
      </nav>
    </section>
    {waiting ? (
      <div className="door-wait fixed inset-0 grid place-items-center" role="status" aria-label="Opening the shop">
        <div className="house-loader" />
      </div>
    ) : null}
    </>
  );
}
