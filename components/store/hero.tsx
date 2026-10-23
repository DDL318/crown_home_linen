import Image from "next/image";
import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";
import type { Banner } from "@/lib/types";

const headline = "mt-4 max-w-xl font-serif text-[2.6rem] font-bold leading-[1.06] sm:text-6xl lg:text-[4.2rem]";

function step(order: number) {
  return { "--d": order } as React.CSSProperties;
}

// Each word rises from behind its own mask, a beat after the one before.
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(/\s+/).map((word, index) => (
        <span key={`${word}-${index}`}>
          <span className="word-mask">
            <span className="word-up" style={{ "--w": index } as React.CSSProperties}>
              <span className="gold-text-light hero-sheen">{word}</span>
            </span>
          </span>{" "}
        </span>
      ))}
    </>
  );
}

// The homepage opener: one message, two ways in (shop or WhatsApp), and the
// three reasons to trust Crown right underneath. The first active banner is
// used; the photograph is held in the gold-ruled frame.
export function Hero({ banner, points, whatsappHref, phone }: { banner?: Banner; points: string[]; whatsappHref: string; phone: string }) {
  if (!banner) return null;
  return (
    <section className="navy-ground on-navy relative overflow-hidden" aria-label="Welcome">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-10 md:px-8 lg:min-h-[620px] lg:grid-cols-[1.02fr_1fr] lg:gap-16 lg:py-16">
        <div>
          <span className="crown-rule hero-rule mb-5" aria-hidden />
          <p className="eyebrow hero-step">{banner.eyebrow}</p>
          <h1 className={headline}>
            <Words text={banner.title} />
          </h1>
          <p className="hero-step mt-6 max-w-lg font-serif text-lg italic leading-8 text-[#fbf8f1]/85 md:text-xl" style={step(4)}>
            {banner.subtitle}
          </p>
          <div className="hero-step mt-9 flex flex-wrap items-center gap-3" style={step(5)}>
            <Link href={banner.buttonHref} className="btn-brass" data-track={banner.buttonLabel} data-track-id={`hero-${banner.id}`}>
              {banner.buttonLabel}
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="btn-line border-gold/60 text-[#fbf8f1] hover:border-gold-hi hover:bg-[#fbf8f1] hover:text-navy"
              data-track="WhatsApp hero"
              data-track-id="hero-whatsapp"
              data-track-type="whatsapp_click"
            >
              <MessageCircle size={15} aria-hidden />
              WhatsApp {phone}
            </a>
          </div>
          {points.length ? (
            <ul className="hero-step mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-[#fbf8f1]/80" style={step(6)}>
              {points.map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <Check size={14} className="text-gold-bright" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div>
          <div className="relative mx-auto aspect-[16/10] w-full max-w-[600px] sm:aspect-[4/3] lg:aspect-[5/6]">
            <div className="hero-frame absolute inset-0 border-2 border-[#fbf8f1]/80" aria-hidden />
            <div className="hero-unveil absolute inset-[9px] overflow-hidden">
              <Image src={banner.imageUrl} alt={banner.imageAlt || banner.title} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
            <div className="hero-frame pointer-events-none absolute inset-[9px] border border-gold/70" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
