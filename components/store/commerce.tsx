"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Building2, MessageCircle, Search, SlidersHorizontal, Truck, X } from "lucide-react";
import { displayPrice, matchesQuery, priceRange, sizeInCm, variantInStock } from "@/lib/catalog";
import { formatMoney, whatsappUrl } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "@/components/store/cart";
import { InquiryForm } from "@/components/store/forms";
import { ProductCard } from "@/components/store/product-card";
import { ProductPlate } from "@/components/store/product-plate";
import { QuantityStepper } from "@/components/store/quantity";

function OptionGroup({
  name,
  values,
  selected,
  isAvailable,
  onSelect,
}: {
  name: string;
  values: string[];
  selected: string;
  isAvailable: (value: string) => boolean;
  onSelect: (value: string) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const cm = name === "Size" ? sizeInCm(selected) : "";
  // Arrow keys move between choices, as in a native radio group.
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + values.length) % values.length;
    onSelect(values[next]);
    refs.current[next]?.focus();
  }
  return (
    <fieldset>
      <legend className="field-label mb-2.5">
        {name}: <span className="font-sans text-[12px] font-semibold normal-case tracking-normal text-navy">{selected}{name === "Size" && /\d/.test(selected) ? " in" : ""}</span>
        {cm ? <span className="ml-2 font-sans text-[12px] font-normal normal-case tracking-normal text-muted">({cm})</span> : null}
      </legend>
      <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
        {values.map((value, index) => {
          const on = selected === value;
          const available = isAvailable(value);
          return (
            <button
              key={value}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              onKeyDown={(event) => onKeyDown(event, index)}
              onClick={() => onSelect(value)}
              className={`chip tabular min-h-11 px-4 text-[11px] tracking-[0.08em] ${available ? "" : "line-through opacity-50"}`}
            >
              {value}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ProductPurchase({
  product,
  currency,
  categoryName,
  whatsappNumber,
}: {
  product: Product;
  currency: string;
  categoryName: string;
  whatsappNumber: string;
}) {
  const cart = useCart();
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, string>>(() => Object.fromEntries(product.options.map((option) => [option.name, option.values[0] || ""])));
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [ask, setAsk] = useState(false);
  const [added, setAdded] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const actions = useRef<HTMLDivElement>(null);

  const variant = product.variants.find((item) => Object.entries(selected).every(([name, value]) => item.options[name] === value));
  const price = displayPrice(product, variant);
  const range = priceRange(product);
  const inStock = Boolean(variant && variantInStock(variant));
  const images = product.images;
  const activeImage = variant?.imageUrl ? images.find((image) => image.url === variant.imageUrl) || { url: variant.imageUrl, alt: product.title } : images[imageIndex] || images[0];
  // For people who would rather just message: the item, size, quantity, and price, ready to send.
  const orderText = `Hello Crown, I would like to order:\n${quantity} × ${product.title}${variant ? ` (${variant.title})` : ""} — ${formatMoney(price.price * quantity, currency)}\n\nMy name:\nDelivery address:`;

  // Show the slim add-to-bag bar on phones once the main buttons scroll away.
  useEffect(() => {
    const node = actions.current;
    if (!node || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setBarVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function choose(name: string, value: string) {
    const next = { ...selected, [name]: value };
    setSelected(next);
    const match = product.variants.find((item) => Object.entries(next).every(([key, optionValue]) => item.options[key] === optionValue));
    if (match?.imageUrl) {
      const index = images.findIndex((image) => image.url === match.imageUrl);
      if (index >= 0) setImageIndex(index);
    }
  }

  function isAvailable(name: string, value: string) {
    return product.variants.some((item) => item.options[name] === value && variantInStock(item));
  }

  function add(open: boolean) {
    if (!variant || !inStock) return false;
    cart.add(
      {
        productId: product.id,
        variantId: variant.id,
        title: product.title,
        variantTitle: variant.title,
        slug: product.slug,
        imageUrl: activeImage?.url || "",
        unitPrice: variant.price,
      },
      quantity,
      { open },
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
    return true;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.08fr_1fr] lg:gap-16">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="relative aspect-[4/5] overflow-hidden bg-sand">
          {activeImage ? (
            <Image src={activeImage.url} alt={activeImage.alt || product.title} fill className="object-cover" priority sizes="(min-width: 1024px) 50vw, 100vw" />
          ) : (
            <ProductPlate product={product} size="large" />
          )}
        </div>
        {images.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Photos">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                aria-label={`Show photo ${index + 1}`}
                aria-current={index === imageIndex}
                className={`relative h-20 w-16 shrink-0 bg-sand ${index === imageIndex ? "ring-2 ring-gold" : "opacity-80 hover:opacity-100"}`}
                onClick={() => setImageIndex(index)}
              >
                <Image src={image.url} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        ) : null}
        {images.length === 0 ? <p className="mt-3 text-xs text-muted">Photographs of this item are on the way. Ask on WhatsApp and we will send a picture of the stock.</p> : null}
      </div>

      <div>
        <p className="eyebrow">{categoryName}</p>
        <h1 className="gather gold-text mt-3 font-serif text-[2.3rem] font-bold leading-[1.1] md:text-5xl">{product.title}</h1>
        <div className="tabular mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="font-serif text-3xl font-bold text-brass" aria-live="polite">
            {formatMoney(price.price, currency)}
          </p>
          {price.compare ? <p className="text-muted line-through">{formatMoney(price.compare, currency)}</p> : null}
          {range.min !== range.max ? (
            <p className="text-sm text-muted">
              {formatMoney(range.min, currency)} – {formatMoney(range.max, currency)} by size
            </p>
          ) : null}
        </div>
        <p className="mt-5 max-w-lg font-serif text-lg italic leading-8 text-ink/80">{product.shortDescription}</p>

        <div className="mt-8 space-y-6">
          {product.options.map((option) => (
            <OptionGroup
              key={option.name}
              name={option.name}
              values={option.values}
              selected={selected[option.name]}
              isAvailable={(value) => isAvailable(option.name, value)}
              onSelect={(value) => choose(option.name, value)}
            />
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-4">
          <QuantityStepper value={quantity} label={product.title} onChange={setQuantity} />
          <p className={`label flex items-center gap-2 text-[10px] ${inStock ? "text-ok" : "text-danger"}`}>
            <span className={`h-2 w-2 rounded-full ${inStock ? "bg-ok" : "bg-danger"}`} aria-hidden />
            {inStock ? "In stock" : "Not available in this size"}
          </p>
        </div>

        <div ref={actions} className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={!inStock}
            onClick={() => add(true)}
            data-track="Add to bag"
            data-track-id="add-to-bag"
            data-track-type="add_to_cart"
            className="btn-ink min-h-[3.25rem] w-full disabled:opacity-40"
          >
            {added ? "Added to bag ✓" : "Add to bag"}
          </button>
          <button
            type="button"
            disabled={!inStock}
            onClick={() => {
              if (add(false)) router.push("/cart");
            }}
            data-track="Order now"
            data-track-id="order-now"
            data-track-type="add_to_cart"
            className="btn-brass min-h-[3.25rem] w-full disabled:opacity-40"
          >
            <MessageCircle size={15} aria-hidden /> Order now
          </button>
        </div>
        <a
          href={whatsappUrl(whatsappNumber, orderText)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm text-navy underline decoration-gold underline-offset-4 hover:text-brass"
          data-track="Ask on WhatsApp"
          data-track-id="product-whatsapp"
          data-track-type="whatsapp_click"
        >
          <MessageCircle size={14} aria-hidden /> Or order directly on WhatsApp
        </a>

        <ul className="mt-8 grid gap-3 border-y border-line py-5 text-sm sm:grid-cols-3">
          <li className="flex items-start gap-2.5">
            <BadgeCheck size={17} className="mt-0.5 shrink-0 text-brass" aria-hidden />
            <span className="leading-5 text-ink/80">Total confirmed on WhatsApp before you pay</span>
          </li>
          <li className="flex items-start gap-2.5">
            <Truck size={17} className="mt-0.5 shrink-0 text-brass" aria-hidden />
            <span className="leading-5 text-ink/80">Delivery or collection from Colombo 11</span>
          </li>
          <li className="flex items-start gap-2.5">
            <Building2 size={17} className="mt-0.5 shrink-0 text-brass" aria-hidden />
            <span className="leading-5 text-ink/80">
              <Link href="/wholesale" className="underline decoration-gold underline-offset-2 hover:text-brass">Wholesale prices</Link> for bulk
            </span>
          </li>
        </ul>

        <div className="mt-2 divide-y divide-line border-b border-line">
          {[
            ["Description", product.description],
            ["Sizes", product.dimensions],
            ["Material", product.material],
            ["Care", product.care],
          ]
            .filter(([, body]) => body?.trim())
            .map(([title, body]) => (
              <details key={title} className="group" open={title === "Description"}>
                <summary className="label flex cursor-pointer list-none items-center justify-between py-4 text-[10.5px] text-navy [&::-webkit-details-marker]:hidden">
                  {title}
                  <span className="relative h-2.5 w-2.5" aria-hidden>
                    <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gold" />
                    <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gold transition-transform group-open:scale-y-0" />
                  </span>
                </summary>
                <div className="space-y-3 pb-5 text-[15px] leading-7 text-ink/75">
                  {body.split(/\n\n+/).map((paragraph) => (
                    <p key={paragraph.slice(0, 20)}>{paragraph}</p>
                  ))}
                </div>
              </details>
            ))}
        </div>

        <button
          type="button"
          className="label mt-6 inline-flex items-center gap-2 text-[10.5px] text-navy hover:text-brass"
          aria-expanded={ask}
          onClick={() => setAsk((value) => !value)}
          data-track="Ask about this item"
          data-track-id="ask-product"
        >
          {ask ? <X size={13} aria-hidden /> : <MessageCircle size={13} aria-hidden />} {ask ? "Close the question form" : "Ask about this item"}
        </button>
        {ask ? (
          <div className="rise-in mt-4 border border-line bg-white p-5">
            <InquiryForm type="product" buttonLabel="Ask on WhatsApp" pagePath={`/products/${product.slug}`} productTitle={product.title} productSlug={product.slug} />
          </div>
        ) : null}
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 shadow-[0_-10px_30px_-15px_rgba(16,31,56,0.35)] backdrop-blur transition-transform duration-300 lg:hidden ${barVisible ? "translate-y-0" : "translate-y-full"}`}
        aria-hidden={!barVisible}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-[15px] font-bold text-navy">{product.title}</p>
            <p className="tabular text-xs text-muted">
              {variant?.title} · <span className="font-bold text-brass">{formatMoney(price.price, currency)}</span>
            </p>
          </div>
          <button type="button" tabIndex={barVisible ? 0 : -1} disabled={!inStock} onClick={() => add(true)} className="btn-ink shrink-0 px-5 disabled:opacity-40">
            {added ? "Added ✓" : "Add to bag"}
          </button>
        </div>
      </div>
    </div>
  );
}

type ShopCategory = { id: string; name: string; slug: string };

const sorts = [
  ["featured", "Featured"],
  ["price-asc", "Price, low to high"],
  ["price-desc", "Price, high to low"],
  ["name", "Name, A to Z"],
] as const;

export function ShopBrowser({
  products,
  currency,
  categories,
  initialCategory = "",
  initialQuery = "",
  initialSize = "",
  initialSort = "featured",
  heading,
  intro,
  collection,
  whatsappHref,
}: {
  products: Product[];
  currency: string;
  categories: ShopCategory[];
  initialCategory?: string;
  initialQuery?: string;
  initialSize?: string;
  initialSort?: string;
  heading: string;
  intro?: string;
  // On a collection page the category is fixed and the chips link to the other collections.
  collection?: string;
  whatsappHref: string;
}) {
  const [sort, setSort] = useState<string>(sorts.some(([value]) => value === initialSort) ? initialSort : "featured");
  const [category, setCategory] = useState(collection || initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const [size, setSize] = useState(initialSize);
  const names = useMemo(() => new Map(categories.map((item) => [item.id, item.name])), [categories]);

  const inCategory = useMemo(() => (category ? products.filter((product) => product.categoryId === category) : products), [category, products]);
  const sizes = useMemo(() => {
    const all = new Set<string>();
    for (const product of inCategory) for (const value of product.options.find((option) => option.name === "Size")?.values ?? []) if (/\d/.test(value)) all.add(value);
    const area = (value: string) => value.split(/[×x]/).reduce((total, part) => total * (Number(part) || 0), 1);
    return [...all].sort((a, b) => area(a) - area(b));
  }, [inCategory]);
  const activeSize = sizes.includes(size) ? size : "";

  const visible = useMemo(() => {
    const filtered = inCategory.filter(
      (product) =>
        matchesQuery(product, names.get(product.categoryId) || "", query) &&
        (!activeSize || product.options.some((option) => option.name === "Size" && option.values.includes(activeSize))),
    );
    const copy = [...filtered];
    if (sort === "price-asc") copy.sort((a, b) => displayPrice(a).price - displayPrice(b).price);
    if (sort === "price-desc") copy.sort((a, b) => displayPrice(b).price - displayPrice(a).price);
    if (sort === "name") copy.sort((a, b) => a.title.localeCompare(b.title));
    return copy;
  }, [activeSize, inCategory, names, query, sort]);

  // Keep the address bar in step, so a filtered list can be shared or reloaded.
  useEffect(() => {
    const params = new URLSearchParams();
    const slug = categories.find((item) => item.id === category)?.slug;
    if (!collection && slug) params.set("category", slug);
    if (query.trim()) params.set("q", query.trim());
    if (activeSize) params.set("size", activeSize);
    if (sort !== "featured") params.set("sort", sort);
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", next);
  }, [activeSize, categories, category, collection, query, sort]);

  const filtersOn = Boolean(query.trim() || activeSize || (!collection && category));
  const counts = useMemo(() => new Map(categories.map((item) => [item.id, products.filter((product) => product.categoryId === item.id).length])), [categories, products]);
  const clear = () => {
    setQuery("");
    setSize("");
    if (!collection) setCategory("");
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
      <nav aria-label="Breadcrumb" className="label text-[9.5px] text-muted">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/" className="hover:text-navy">Home</Link>
          </li>
          <li aria-hidden>/</li>
          {collection ? (
            <>
              <li>
                <Link href="/shop" className="hover:text-navy">Shop</Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-navy">{heading}</li>
            </>
          ) : (
            <li aria-current="page" className="text-navy">Shop</li>
          )}
        </ol>
      </nav>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <span className="crown-rule mb-4" aria-hidden />
          <h1 className="gather gold-text font-serif text-[2.4rem] font-bold leading-tight md:text-6xl">{heading}</h1>
          {intro ? <p className="mt-4 max-w-2xl font-serif text-lg italic leading-8 text-muted">{intro}</p> : null}
        </div>
        <label className="relative block w-full lg:w-80">
          <span className="sr-only">Search items</span>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search: white, 90x100, pillow…" className="field pl-10" />
        </label>
      </div>

      <div className="mt-8 border-y border-line py-3">
        <div className="flex items-center gap-3">
          <div className="no-scrollbar -my-1 flex flex-1 gap-2 overflow-x-auto py-1" role="group" aria-label="Collections">
            {collection ? (
              <>
                <Link href="/shop" className="chip">All</Link>
                {categories.map((item) => (
                  <Link key={item.id} href={`/collections/${item.slug}`} className="chip" aria-current={item.id === collection ? "page" : undefined} aria-pressed={item.id === collection}>
                    {item.name}
                  </Link>
                ))}
              </>
            ) : (
              <>
                <button type="button" className="chip" aria-pressed={category === ""} onClick={() => setCategory("")}>
                  All <span className="opacity-60">{products.length}</span>
                </button>
                {categories.map((item) => (
                  <button key={item.id} type="button" className="chip" aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>
                    {item.name} <span className="opacity-60">{counts.get(item.id)}</span>
                  </button>
                ))}
              </>
            )}
          </div>
          <label className="hidden shrink-0 items-center gap-2 md:flex">
            <span className="field-label mb-0">Sort</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-10 border border-line bg-white px-2 text-sm text-navy">
              {sorts.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          {sizes.length > 0 ? (
            <div className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto" role="group" aria-label="Size in inches">
              <SlidersHorizontal size={14} className="shrink-0 text-muted" aria-hidden />
              <span className="field-label mb-0 shrink-0">Size</span>
              {sizes.map((value) => (
                <button key={value} type="button" className="chip tabular min-h-8 px-3 text-[10px] tracking-[0.06em]" aria-pressed={activeSize === value} onClick={() => setSize(activeSize === value ? "" : value)}>
                  {value}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1" />
          )}
          <label className="flex shrink-0 items-center md:hidden">
            <span className="sr-only">Sort</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-9 border border-line bg-white px-2 text-xs text-navy">
              {sorts.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="label text-[9.5px] text-muted" aria-live="polite">
          {visible.length} {visible.length === 1 ? "item" : "items"}
          {activeSize ? ` in ${activeSize}` : ""}
          {query.trim() ? ` matching “${query.trim()}”` : ""}
        </p>
        {filtersOn ? (
          <button type="button" className="label inline-flex items-center gap-1.5 text-[9.5px] text-navy underline underline-offset-4" onClick={clear}>
            <X size={12} aria-hidden /> Clear filters
          </button>
        ) : null}
      </div>

      {visible.length > 0 ? (
        <div className="stagger-load mt-6 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {visible.map((product, index) => (
            <ProductCard key={product.id} product={product} currency={currency} priority={index < 4} />
          ))}
        </div>
      ) : (
        <div className="mt-8 border border-dashed border-line bg-white px-6 py-14 text-center">
          <p className="font-serif text-2xl font-bold text-navy">Nothing matches that yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Crown stocks more than is listed here. Tell us what you are looking for and we will check the shelves.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn-ink" data-track-type="whatsapp_click" data-track="WhatsApp empty search" data-track-id="shop-empty-whatsapp">
              <MessageCircle size={15} aria-hidden /> Ask on WhatsApp
            </a>
            <button type="button" className="btn-line" onClick={clear}>
              Show everything
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
