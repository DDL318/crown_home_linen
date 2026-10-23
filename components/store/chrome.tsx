"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Camera, MapPin, Menu, MessageCircle, PackageSearch, Phone, Search, ShoppingBag, X } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/components/store/cart";
import { ProductPlate } from "@/components/store/product-plate";

export type NavLink = { label: string; href: string };
export type SearchProduct = {
  title: string;
  slug: string;
  price: number;
  imageUrl: string;
  currency: string;
  // Sizes, colours, collection, and material, for matching.
  keywords: string;
};

export function CrownGlyph({ className = "", priority = false, gleam = false }: { className?: string; priority?: boolean; gleam?: boolean }) {
  const image = <Image src="/images/brand/crown-mark.png" alt="" width={560} height={397} priority={priority} className={gleam ? "h-full w-auto" : className} />;
  if (!gleam) return image;
  // The crown catches the light once on arrival and again on hover (.crown-gleam).
  return <span className={`crown-gleam ${className}`}>{image}</span>;
}

function Mark({ name, logoUrl, tone = "light", compact = false }: { name: string; logoUrl?: string; tone?: "light" | "navy"; compact?: boolean }) {
  return (
    <Link href="/" aria-label={`${name}, home`} className="flex flex-col items-center" data-track="Logo" data-track-id="logo">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} className="h-14 w-auto max-w-[180px] object-contain" />
      ) : (
        <>
          <CrownGlyph priority gleam className={compact ? "h-9" : "h-11"} />
          <span className={`mt-1 block pl-[0.13em] font-serif font-bold leading-none tracking-[0.13em] ${compact ? "text-[13px]" : "text-[15px]"} ${tone === "navy" ? "text-[#fbf8f1]" : "text-navy"}`}>CROWN</span>
        </>
      )}
    </Link>
  );
}

// The announcement is for occasional news (new stock, a holiday closing).
// A visitor can close it; it stays closed for them until the wording changes.
const NOTICE_KEY = "crown-notice-closed";
const noticeListeners = new Set<() => void>();

function readClosedNotice() {
  try {
    return localStorage.getItem(NOTICE_KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribeNotice(listener: () => void) {
  noticeListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    noticeListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function Announcement({ text }: { text: string }) {
  const closed = useSyncExternalStore(subscribeNotice, readClosedNotice, () => "") === text;
  if (closed) return null;
  return (
    <div className="navy-ground fade-in" role="region" aria-label="Announcement">
      <div className="relative mx-auto flex max-w-7xl items-center justify-center px-12 py-2 md:px-14">
        <p className="label text-center text-[9.5px] leading-5 text-gold-strap">{text}</p>
        <button
          type="button"
          aria-label="Close the announcement"
          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-[#fbf8f1]/70 transition-colors hover:text-gold-hi md:right-6"
          onClick={() => {
            try {
              localStorage.setItem(NOTICE_KEY, text);
            } catch {
              // Storage can be blocked; it still closes for this page view.
            }
            noticeListeners.forEach((listener) => listener());
          }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Escape closes, the page behind stops scrolling, and focus returns to the
// button that opened the panel.
function useModal(open: boolean, close: () => void, initialFocus?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    initialFocus?.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, close, initialFocus]);
}

export function Header({
  storeName,
  logoUrl,
  announcement,
  announcementEnabled,
  nav,
  products,
  whatsappHref,
  phone,
  address,
}: {
  storeName: string;
  logoUrl?: string;
  announcement: string;
  announcementEnabled: boolean;
  nav: NavLink[];
  products: SearchProduct[];
  whatsappHref: string;
  phone: string;
  address: string;
}) {
  const cart = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const menuClose = useRef<HTMLButtonElement>(null);
  const [openedOn, setOpenedOn] = useState(pathname);

  // Close the panels when the page changes.
  if (openedOn !== pathname) {
    setOpenedOn(pathname);
    setMenu(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // "/" opens search from anywhere, as on most shops.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "/" && !/input|textarea|select/i.test(target.tagName) && !target.isContentEditable) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeMenu = useMemo(() => () => setMenu(false), []);
  const closeSearch = useMemo(() => () => setSearchOpen(false), []);
  useModal(menu, closeMenu, menuClose);
  useModal(searchOpen, closeSearch, searchInput);

  const results = useMemo(() => {
    const words = query
      .toLowerCase()
      .replace(/(\d)\s*[x×*]\s*(\d)/g, "$1×$2")
      .split(/\s+/)
      .filter(Boolean);
    if (words.length === 0) return products.slice(0, 6);
    return products.filter((product) => words.every((word) => `${product.title} ${product.keywords}`.toLowerCase().includes(word.replace(/s$/, "")))).slice(0, 8);
  }, [products, query]);

  function submitSearch() {
    setSearchOpen(false);
    router.push(query.trim() ? `/shop?q=${encodeURIComponent(query.trim())}` : "/shop");
  }

  // The front door (home page) is a full-screen welcome with its own links.
  if (pathname === "/") return null;

  return (
    <>
      <a href="#main" className="sr-only z-[60] bg-navy px-4 py-3 text-paper focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      {announcementEnabled && announcement.trim() ? <Announcement text={announcement.trim()} /> : null}
      <header className={`sticky top-0 z-40 border-b bg-paper/95 backdrop-blur transition-shadow duration-300 ${scrolled ? "border-gold/30 shadow-[0_10px_30px_-20px_rgba(16,31,56,0.45)]" : "border-gold/25"}`}>
        <div className={`mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 transition-[height] duration-500 ease-out md:px-8 lg:grid-cols-[auto_1fr_auto] ${scrolled ? "h-[4.1rem]" : "h-[4.75rem]"}`}>
          <div className="flex items-center lg:hidden">
            <button type="button" className="-ml-2 grid h-11 w-11 place-items-center text-navy" aria-label="Open menu" aria-expanded={menu} onClick={() => setMenu(true)}>
              <Menu size={22} />
            </button>
          </div>
          <div className={`justify-self-center transition-transform duration-500 ease-out lg:justify-self-start ${scrolled ? "scale-[0.86]" : ""}`}>
            <Mark name={storeName} logoUrl={logoUrl} compact />
          </div>
          <nav aria-label="Main" className="hidden items-center justify-center gap-7 lg:flex">
            {nav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`label relative py-2 text-[10.5px] transition-colors hover:text-brass ${active ? "text-navy" : "text-navy/70"}`}
                  data-track={item.label}
                  data-track-id={`nav-${item.label}`}
                >
                  {item.label}
                  <span className={`absolute inset-x-0 -bottom-0.5 h-px origin-left bg-gold transition-transform duration-300 ${active ? "scale-x-100" : "scale-x-0"}`} aria-hidden />
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center justify-end gap-1">
            <button type="button" aria-label="Search" className="grid h-11 w-11 place-items-center text-navy hover:text-brass" data-track="Search" data-track-id="open-search" onClick={() => setSearchOpen(true)}>
              <Search size={19} />
            </button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              aria-label={`WhatsApp ${phone}`}
              title={`WhatsApp ${phone}`}
              className="hidden h-11 min-w-11 items-center justify-center gap-2 px-1 text-navy hover:text-brass sm:flex"
              data-track-type="whatsapp_click"
              data-track="WhatsApp header"
              data-track-id="header-whatsapp"
            >
              <MessageCircle size={19} aria-hidden />
              <span className="label tabular hidden text-[10px] xl:inline">{phone}</span>
            </a>
            <Link
              href="/orders"
              aria-label="Track an order"
              title="Track an order"
              aria-current={pathname === "/orders" ? "page" : undefined}
              className="hidden h-11 w-11 place-items-center text-navy hover:text-brass lg:grid"
              data-track="Track order"
              data-track-id="header-track"
            >
              <PackageSearch size={19} aria-hidden />
            </Link>
            <button
              type="button"
              aria-label={`Open bag${cart.count ? `, ${cart.count} ${cart.count === 1 ? "item" : "items"}` : ""}`}
              className="relative grid h-11 w-11 place-items-center text-navy hover:text-brass"
              data-track="Bag"
              data-track-id="open-bag"
              onClick={() => cart.setOpen(true)}
            >
              <ShoppingBag size={19} />
              {cart.count > 0 ? (
                <span key={cart.count} className="bump tabular absolute right-0.5 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold-bright px-1 text-[10px] font-bold text-navy" aria-hidden>
                  {cart.count > 99 ? "99+" : cart.count}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </header>

      {menu ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" tabIndex={-1} aria-hidden className="fade-in absolute inset-0 bg-navy-deep/50" onClick={() => setMenu(false)} />
          <div className="navy-ground on-navy menu-in absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4">
              <Mark name={storeName} logoUrl={logoUrl} tone="navy" compact />
              <button ref={menuClose} type="button" aria-label="Close menu" className="grid h-11 w-11 place-items-center text-[#fbf8f1]" onClick={() => setMenu(false)}>
                <X size={22} />
              </button>
            </div>
            <span className="crown-rule mx-5" aria-hidden />
            <nav aria-label="Menu" className="stagger-load mt-4 flex flex-col px-5">
              {nav.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className="flex items-center justify-between border-b border-gold/20 py-4 font-serif text-[1.65rem] font-bold text-[#fbf8f1] aria-[current=page]:text-gold-hi"
                  onClick={() => setMenu(false)}
                >
                  {item.label}
                  <ArrowRight size={18} className="text-gold" aria-hidden />
                </Link>
              ))}
              <Link href="/orders" className="flex items-center justify-between border-b border-gold/20 py-4 font-serif text-xl text-mist" onClick={() => setMenu(false)}>
                Track an order
              </Link>
            </nav>
            <div className="mt-auto space-y-3 p-5">
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn-brass w-full" data-track-type="whatsapp_click" data-track="WhatsApp menu" data-track-id="menu-whatsapp">
                <MessageCircle size={15} aria-hidden /> WhatsApp {phone}
              </a>
              <p className="flex items-start gap-2 text-sm leading-6 text-mist">
                <MapPin size={15} className="mt-1 shrink-0 text-gold" aria-hidden /> {address}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {searchOpen ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Search">
          <button type="button" tabIndex={-1} aria-hidden className="fade-in absolute inset-0 bg-navy-deep/55 backdrop-blur-[2px]" onClick={() => setSearchOpen(false)} />
          <div className="rise-in relative mx-auto max-w-2xl bg-paper shadow-2xl sm:mt-20">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitSearch();
              }}
              className="flex items-center gap-3 border-b-2 border-gold px-5"
            >
              <Search size={18} className="text-brass" aria-hidden />
              <label htmlFor="site-search" className="sr-only">
                Search Crown
              </label>
              <input
                id="site-search"
                ref={searchInput}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search sheets, towels, sizes like 90x100…"
                className="h-16 min-w-0 flex-1 bg-transparent font-serif text-lg text-navy outline-none placeholder:text-muted/70"
                autoComplete="off"
              />
              <button type="button" aria-label="Close search" className="grid h-10 w-10 place-items-center text-navy" onClick={() => setSearchOpen(false)}>
                <X size={18} />
              </button>
            </form>
            <div className="max-h-[60vh] overflow-y-auto p-3">
              <p className="label px-2 py-2 text-[9px] text-muted">{query.trim() ? `${results.length} ${results.length === 1 ? "match" : "matches"}` : "Popular"}</p>
              {results.length ? (
                <ul>
                  {results.map((product) => (
                    <li key={product.slug}>
                      <Link
                        href={`/products/${product.slug}`}
                        className="flex items-center gap-4 px-2 py-2.5 hover:bg-ivory focus-visible:bg-ivory"
                        onClick={() => setSearchOpen(false)}
                        data-track={product.title}
                        data-track-id="search-result"
                        data-track-type="search"
                      >
                        <span className="relative h-14 w-12 shrink-0 overflow-hidden bg-sand">
                          {product.imageUrl ? (
                            <Image src={product.imageUrl} alt="" fill className="object-cover" sizes="48px" />
                          ) : (
                            <ProductPlate product={{ title: product.title, material: "", options: [] }} size="thumb" />
                          )}
                        </span>
                        <span className="flex-1 font-serif text-[16px] font-bold text-navy">{product.title}</span>
                        <span className="tabular text-sm text-brass">from {formatMoney(product.price, product.currency)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-2 py-6 text-sm text-muted">
                  No match on the site. Crown stocks more than is listed:{" "}
                  <a href={whatsappHref} target="_blank" rel="noreferrer" className="text-navy underline decoration-gold underline-offset-4">
                    ask on WhatsApp
                  </a>
                  .
                </p>
              )}
              {query.trim() ? (
                <button type="button" onClick={submitSearch} className="btn-line mt-3 w-full">
                  See all results in the shop <ArrowRight size={14} aria-hidden />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function Footer({
  storeName,
  note,
  email,
  phone,
  address,
  city,
  hours,
  instagram,
  whatsappHref,
  mapsHref,
  telHref,
  shop,
  help,
  company,
}: {
  storeName: string;
  note: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  hours: string;
  instagram: string;
  whatsappHref: string;
  mapsHref: string;
  telHref: string;
  shop: NavLink[];
  help: NavLink[];
  company: NavLink[];
}) {
  const pathname = usePathname();
  const columns = [
    ["Shop", shop],
    ["Help", help],
    ["Crown", company],
  ] as const;
  // The product page has its own sticky bar on phones; keep the float out of its way.
  const hideFloat = pathname.startsWith("/products/") || pathname === "/cart";
  if (pathname === "/") return null;
  return (
    <footer className="navy-ground on-navy mt-auto border-t-2 border-gold">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:px-8 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <div className="w-fit">
            <CrownGlyph className="mx-auto h-16 w-auto" />
            <p className="mt-2 pl-[0.13em] text-center font-serif text-2xl font-bold tracking-[0.13em] text-[#fbf8f1]">CROWN</p>
          </div>
          <p className="sr-only">{storeName}</p>
          <span className="crown-rule mt-5" aria-hidden />
          <p className="mt-5 max-w-xs font-serif text-[15px] italic leading-7 text-mist">{note}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn-brass min-h-10 px-4 text-[9.5px]" data-track-type="whatsapp_click" data-track="WhatsApp footer" data-track-id="footer-whatsapp">
              <MessageCircle size={14} aria-hidden /> WhatsApp
            </a>
            <a href={telHref} className="btn-line min-h-10 border-gold/50 px-4 text-[9.5px] text-[#fbf8f1] hover:bg-[#fbf8f1] hover:text-navy">
              <Phone size={14} aria-hidden /> Call
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-3">
          {columns.map(([title, links]) => (
            <nav key={title} aria-label={`${title} links`}>
              <p className="eyebrow">{title}</p>
              <ul className="mt-5 space-y-3 text-[15px]">
                {links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="text-[#fbf8f1]/85 transition-colors hover:text-gold-hi" data-track={link.label} data-track-id={`footer-${link.label}`}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-gold/25">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 pb-24 text-sm text-mist md:flex-row md:items-center md:justify-between md:px-8 md:pb-6">
          <a href={mapsHref} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2 hover:text-gold-hi">
            <MapPin size={15} className="mt-0.5 shrink-0 text-gold" aria-hidden />
            <span>
              {address}, {city}
              {hours ? ` · ${hours}` : ""}
            </span>
          </a>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href={telHref} className="tabular hover:text-gold-hi">
              {phone}
            </a>
            {email ? (
              <a href={`mailto:${email}`} className="hover:text-gold-hi">
                {email}
              </a>
            ) : null}
            {instagram ? (
              <a href={instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-gold-hi">
                <Camera size={14} aria-hidden /> Instagram
              </a>
            ) : null}
            <span className="text-mist/70">© {new Date().getFullYear()} Crown</span>
          </p>
        </div>
      </div>
      {!hideFloat ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          aria-label={`Chat with Crown on WhatsApp, ${phone}`}
          data-track="WhatsApp"
          data-track-id="float-whatsapp"
          data-track-type="whatsapp_click"
          className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-[#187a42] text-white shadow-[0_10px_28px_-6px_rgba(16,31,56,0.55)] ring-2 ring-gold-bright/80 transition-transform hover:scale-105 md:h-auto md:w-auto md:px-5 md:py-3.5"
        >
          <MessageCircle size={20} aria-hidden />
          <span className="label hidden text-[10px] md:inline">WhatsApp us</span>
        </a>
      ) : null}
    </footer>
  );
}
