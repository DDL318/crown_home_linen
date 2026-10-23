"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { SubscribeForm } from "@/components/store/subscribe-form";

const KEY = "chl-letter-dismissed";
// Pages where someone is busy buying or asking; the invitation never shows there.
const QUIET = ["/cart", "/orders", "/products/", "/wholesale", "/contact", "/unsubscribe"];

function dismissed() {
  try {
    return Boolean(localStorage.getItem(KEY));
  } catch {
    return false;
  }
}

// A gentle invitation to the letter list: only after the visitor has spent
// some time on the site and read most of a page, once, and never mid-order.
export function NewsletterPopup({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  const closed = useRef(false);
  const card = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const quiet = pathname === "/" || QUIET.some((path) => pathname.startsWith(path));

  useEffect(() => {
    if (quiet || closed.current || dismissed()) return;
    const started = Date.now();
    function onScroll() {
      if (closed.current || dismissed()) return;
      const read = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
      if (read > 0.6 && Date.now() - started > 25000) setOpen(true);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [quiet]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    card.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open]);

  function close() {
    closed.current = true;
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // Private browsing can block storage. The ref still keeps it closed for this visit.
    }
    setOpen(false);
  }

  if (!open || quiet) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:bottom-5 sm:left-5 sm:right-auto sm:w-[25rem] sm:p-0">
      <div
        ref={card}
        tabIndex={-1}
        role="dialog"
        aria-modal="false"
        aria-labelledby="letter-popup-title"
        className="rise-in crown-frame relative bg-paper p-6 text-navy shadow-[0_24px_60px_-20px_rgba(16,31,56,0.55)] outline-none"
      >
        <button type="button" onClick={close} className="absolute right-3 top-3 grid h-10 w-10 place-items-center text-muted hover:text-navy" aria-label="No thanks, close">
          <X size={18} />
        </button>
        <p className="eyebrow">The Crown list</p>
        <h2 id="letter-popup-title" className="gold-text mt-2 pr-8 font-serif text-3xl font-bold">
          {title}
        </h2>
        <p className="mt-2 font-serif italic leading-6 text-muted">{body}</p>
        <div className="mt-5">
          <SubscribeForm source="popup" />
        </div>
      </div>
    </div>
  );
}
