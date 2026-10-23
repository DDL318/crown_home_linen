import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PlateArt } from "@/components/store/product-plate";

export default function StoreNotFound() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
      <div>
        <span className="crown-rule mb-4" aria-hidden />
        <p className="eyebrow">Page not found</p>
        <h1 className="gather gold-text mt-3 font-serif text-4xl font-bold leading-tight md:text-6xl">That item is not on the shelf</h1>
        <p className="mt-5 max-w-lg font-serif text-lg italic leading-8 text-muted">The link may be old, or the item may have been renamed. Everything Crown sells is in the shop, and we stock more than is listed.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/shop" className="btn-ink">
            Shop all items <ArrowRight size={14} aria-hidden />
          </Link>
          <Link href="/contact" className="btn-line">
            Ask Crown
          </Link>
        </div>
        <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {[
            ["Bedsheets", "/collections/bedsheets"],
            ["Towels", "/collections/towels"],
            ["Pillows", "/collections/pillows"],
            ["Duvets & protectors", "/collections/duvets"],
            ["Wholesale", "/wholesale"],
          ].map(([label, href]) => (
            <li key={href}>
              <Link href={href} className="text-navy underline decoration-gold underline-offset-4 hover:text-brass">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="navy-ground relative hidden aspect-square place-items-center lg:grid" aria-hidden>
        <span className="absolute inset-[12px] border border-gold/45" />
        <PlateArt kind="sheet" className="w-1/2" />
      </div>
    </section>
  );
}
