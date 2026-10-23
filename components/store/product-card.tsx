import Link from "next/link";
import { priceRange } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductVisual } from "@/components/store/product-plate";

export function ProductCard({ product, currency, priority = false }: { product: Product; currency: string; priority?: boolean }) {
  const { min, max } = priceRange(product);
  const sizes = product.options.find((option) => option.name === "Size")?.values ?? [];
  const colours = product.options.find((option) => option.name === "Colour")?.values ?? [];
  const facts = [sizes.length > 1 ? `${sizes.length} sizes` : sizes[0], colours.length > 1 ? `${colours.length} colours` : null].filter(Boolean).join(" · ");
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block focus-visible:outline-offset-4"
      data-track={product.title}
      data-track-id={`card-${product.slug}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-sand transition-shadow duration-500 group-hover:shadow-[0_18px_40px_-18px_rgba(16,31,56,0.45)]">
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.03]">
          <ProductVisual product={product} priority={priority} sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw" />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="font-serif text-[17px] leading-snug text-navy decoration-gold decoration-1 underline-offset-4 group-hover:underline">{product.title}</h3>
        <p className="tabular mt-1 font-serif text-[15px] font-bold text-brass">
          {min !== max ? <span className="mr-1 font-sans text-[11px] font-normal uppercase tracking-[0.14em] text-muted">From</span> : null}
          {formatMoney(min, currency)}
        </p>
        {facts ? <p className="label mt-1.5 text-[9px] text-muted">{facts}</p> : null}
      </div>
    </Link>
  );
}
