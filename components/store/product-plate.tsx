import Image from "next/image";
import type { Product } from "@/lib/types";

// Until real photographs of Crown stock are uploaded, each product shows a
// "plate": a drawn outline of the item on a brand ground. Following the Crown
// look, white and pale items sit on navy and coloured items on ivory. Once a
// product has a photo in the house book, the photo is shown instead.

export type Kind = "sheet" | "towel" | "pool" | "serviette" | "pillow" | "gel" | "cover" | "pillow-protector" | "mattress-protector" | "duvet" | "duvet-cover";

export function plateKind(product: Pick<Product, "title">): Kind {
  const title = product.title.toLowerCase();
  if (title.includes("mattress")) return "mattress-protector";
  if (title.includes("pillow protector")) return "pillow-protector";
  if (title.includes("duvet cover")) return "duvet-cover";
  if (title.includes("duvet")) return "duvet";
  if (title.includes("pillow cover")) return "cover";
  if (title.includes("gel")) return "gel";
  if (title.includes("pillow")) return "pillow";
  if (title.includes("pool")) return "pool";
  if (title.includes("serviette")) return "serviette";
  if (title.includes("towel")) return "towel";
  return "sheet";
}

export function plateTone(product: Pick<Product, "title" | "material">): "navy" | "ivory" {
  const text = `${product.title} ${product.material}`.toLowerCase();
  if (/colour|color|pool|mixed/.test(text) && !/white/.test(product.title.toLowerCase())) return "ivory";
  return "navy";
}

const swatches = ["#b24a3b", "#2f6f8f", "#d9a441", "#4f7a4a", "#7b5aa6", "#c46d8e"];

function Drawing({ kind, tone }: { kind: Kind; tone: "navy" | "ivory" }) {
  const line = tone === "navy" ? "url(#plate-gold-light)" : "url(#plate-gold-dark)";
  const fill = tone === "navy" ? "rgba(251,248,241,0.06)" : "rgba(23,43,77,0.04)";
  const common = { fill, stroke: line, strokeWidth: 1.6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (kind) {
    case "towel":
      return (
        <g {...common}>
          <rect x="22" y="52" width="76" height="14" rx="3" />
          <rect x="26" y="38" width="68" height="14" rx="3" />
          <rect x="30" y="24" width="60" height="14" rx="3" />
          <path d="M30 31h60M26 45h68M22 59h76" strokeDasharray="2 3" fill="none" />
        </g>
      );
    case "pool":
      return (
        <g {...common}>
          <rect x="18" y="26" width="84" height="40" rx="4" />
          <path d="M34 26v40M50 26v40M66 26v40M82 26v40" fill="none" />
        </g>
      );
    case "serviette":
      return (
        <g {...common}>
          <rect x="36" y="28" width="48" height="36" rx="3" />
          <path d="M36 28l48 36" fill="none" />
          <path d="M40 58h20" strokeDasharray="2 3" fill="none" />
        </g>
      );
    case "pillow":
    case "gel":
      return (
        <g {...common}>
          <path d="M20 30c6-6 74-6 80 0 4 8 4 26 0 34-6 6-74 6-80 0-4-8-4-26 0-34z" />
          {kind === "gel" ? <path d="M34 47c6-5 12 5 18 0s12 5 18 0 12 5 18 0" fill="none" /> : <path d="M28 47h64" strokeDasharray="2 4" fill="none" />}
        </g>
      );
    case "cover":
      return (
        <g {...common}>
          <rect x="22" y="28" width="76" height="38" rx="3" />
          <path d="M80 28v38" fill="none" />
          <path d="M84 36h10M84 44h10M84 52h10" strokeDasharray="2 2" fill="none" />
        </g>
      );
    case "pillow-protector":
      return (
        <g {...common}>
          <rect x="22" y="30" width="76" height="34" rx="3" />
          <path d="M60 38c-6 7-8 11-8 14a8 8 0 0016 0c0-3-2-7-8-14z" />
        </g>
      );
    case "mattress-protector":
      return (
        <g {...common}>
          <path d="M16 54l20-20h68l-20 20z" />
          <path d="M16 54v10h68V54M84 64l20-20V34" fill="none" />
          <path d="M60 38c-4 5-5 7-5 9a5 5 0 0010 0c0-2-1-4-5-9z" />
        </g>
      );
    case "duvet":
    case "duvet-cover":
      return (
        <g {...common}>
          <rect x="20" y="22" width="80" height="50" rx="5" />
          {kind === "duvet" ? (
            <path d="M46.7 22v50M73.3 22v50M20 47h80" strokeDasharray="3 3" fill="none" />
          ) : (
            <path d="M20 64h80M32 68h4M48 68h4M64 68h4M80 68h4" fill="none" />
          )}
        </g>
      );
    default:
      return (
        <g {...common}>
          <rect x="18" y="44" width="84" height="20" rx="3" />
          <rect x="22" y="30" width="76" height="14" rx="3" />
          <rect x="28" y="16" width="30" height="14" rx="4" />
          <rect x="62" y="16" width="30" height="14" rx="4" />
          <path d="M18 54h84" strokeDasharray="2 3" fill="none" />
        </g>
      );
  }
}

export function ProductPlate({
  product,
  size = "card",
  className = "",
}: {
  product: Pick<Product, "title" | "material" | "options">;
  size?: "card" | "large" | "thumb";
  className?: string;
}) {
  const tone = plateTone(product);
  const kind = plateKind(product);
  const colours = product.options.find((option) => option.name === "Colour")?.values ?? [];
  const mixed = /colour|mixed/i.test(product.title) || /mixed/i.test(product.material) || colours.some((value) => /mixed/i.test(value));
  const navy = tone === "navy";
  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden ${navy ? "navy-ground" : "ivory-ground"} ${className}`}
      aria-hidden
    >
      {size !== "thumb" ? <div className={`pointer-events-none absolute inset-[10px] border transition-all duration-700 ease-out group-hover:inset-[7px] ${navy ? "border-gold/45 group-hover:border-gold/80" : "border-gold/55 group-hover:border-gold"}`} /> : null}
      <svg viewBox="0 0 120 90" className={`transition-transform duration-700 ease-out group-hover:-translate-y-1.5 ${size === "thumb" ? "w-[78%]" : size === "large" ? "w-[58%]" : "w-[64%]"}`}>
        <Drawing kind={kind} tone={tone} />
      </svg>
      {size !== "thumb" ? (
        <>
          {mixed ? (
            <div className="mt-4 flex gap-1.5">
              {swatches.map((colour) => (
                <span key={colour} className="h-2.5 w-2.5 rounded-full ring-1 ring-white/60" style={{ background: colour }} />
              ))}
            </div>
          ) : kind === "pool" ? (
            <div className="mt-4 flex gap-1.5">
              {["#2f6f8f", "#7a5236"].map((colour) => (
                <span key={colour} className="h-2.5 w-6 rounded-full" style={{ background: `repeating-linear-gradient(90deg, ${colour} 0 4px, #fbf8f1 4px 7px)` }} />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

// The first product photo when there is one, otherwise the plate.
export function ProductVisual({
  product,
  sizes,
  priority = false,
  plateSize = "card",
  imageUrl,
}: {
  product: Pick<Product, "title" | "material" | "options" | "images">;
  sizes: string;
  priority?: boolean;
  plateSize?: "card" | "large" | "thumb";
  imageUrl?: string;
}) {
  const url = imageUrl || product.images[0]?.url;
  if (!url) return <ProductPlate product={product} size={plateSize} />;
  return <Image src={url} alt={product.images[0]?.alt || product.title} fill priority={priority} className="object-cover" sizes={sizes} />;
}

// Just the outline drawing, for collection tiles and empty states.
export function PlateArt({ kind, tone = "navy", className = "" }: { kind: Kind; tone?: "navy" | "ivory"; className?: string }) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden>
      <Drawing kind={kind} tone={tone} />
    </svg>
  );
}

export function categoryKind(name: string): Kind {
  const text = name.toLowerCase();
  if (text.includes("towel")) return "towel";
  if (text.includes("pillow")) return "pillow";
  if (text.includes("duvet") || text.includes("protector")) return "duvet";
  return "sheet";
}

// The two gold gradients the drawings use, defined once per page (in the shop
// layout) rather than inside every drawing, so element ids stay unique.
export function PlateGradients() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
      <defs>
        <linearGradient id="plate-gold-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff1bf" />
          <stop offset="1" stopColor="#e3b23c" />
        </linearGradient>
        <linearGradient id="plate-gold-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c4389" />
          <stop offset="1" stopColor="#1a2b5f" />
        </linearGradient>
      </defs>
    </svg>
  );
}
