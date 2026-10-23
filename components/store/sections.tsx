import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Camera, MapPin, MessageCircle, Phone } from "lucide-react";
import { countInCategory, heroBanners, pageSections, sizeGuide, visibleCategories } from "@/lib/catalog";
import { formatMoney, whatsappUrl } from "@/lib/format";
import { createSeed } from "@/lib/seed";
import type { Product, Section, Settings, StoreSnapshot } from "@/lib/types";
import { Reveal } from "@/components/store/motion";
import { Hero } from "@/components/store/hero";
import { InquiryForm, WholesaleForm } from "@/components/store/forms";
import { SubscribeForm } from "@/components/store/subscribe-form";
import { ProductCard } from "@/components/store/product-card";
import { PlateArt, categoryKind } from "@/components/store/product-plate";

export { ProductCard };

function pickProducts(snapshot: StoreSnapshot, source: "featured" | "bestsellers" | "new", limit: number) {
  const active = snapshot.products.filter((product) => product.status === "active").sort((a, b) => a.sort - b.sort);
  const list: Product[] =
    source === "featured"
      ? active.filter((product) => product.featured)
      : source === "bestsellers"
        ? active.filter((product) => product.bestseller)
        : [...active].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return list.slice(0, limit);
}

function paragraphs(body: string) {
  return body.split(/\n\n+/).filter(Boolean);
}

export function mapsUrl(settings: Settings) {
  const query = [settings.storeName, settings.address, settings.city, "Sri Lanka"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function telUrl(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return `tel:${digits.startsWith("0") ? `+94${digits.slice(1)}` : digits}`;
}

function SectionHeading({ eyebrow, title, subtitle, align = "left", as: Tag = "h2" }: { eyebrow?: string; title: string; subtitle?: string; align?: "left" | "center"; as?: "h1" | "h2" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <Tag className="gather gold-text font-serif text-[2.1rem] font-bold leading-[1.1] md:text-5xl">{title}</Tag>
      {subtitle ? <p className="mt-4 font-serif text-[17px] italic leading-7 text-muted">{subtitle}</p> : null}
    </div>
  );
}

export function PageSections({ snapshot, slug }: { snapshot: StoreSnapshot; slug: string }) {
  // A page added in a later release (wholesale, size guide) uses the built-in
  // copy until the house book has sections of its own for it.
  const saved = pageSections(snapshot, slug);
  const sections = saved.length ? saved : createSeed().sections.filter((section) => section.pageSlug === slug && section.visible).sort((a, b) => a.sort - b.sort);
  // The first heading on a page is its h1 (the hero has its own).
  const firstTitled = sections.find((section) => section.type !== "hero")?.id;
  const hasHero = sections.some((section) => section.type === "hero");
  const highlights = sections.find((section) => section.type === "highlights");
  const hasVisit = sections.some((section) => section.type === "visit");
  // On the home page the "about" story and the shop address read as one block.
  const story = slug === "home" && hasVisit ? sections.find((section) => section.type === "image_text") : undefined;
  const context: PageContext = {
    hasHero,
    heroPoints: highlights && highlights.type === "highlights" ? highlights.items.slice(0, 3).map((item) => item.title) : ["25 years in Colombo 11", "Retail and wholesale", "Price confirmed before you pay"],
    story: story && story.type === "image_text" ? story : undefined,
  };
  return (
    <>
      {sections
        .filter((section) => section.id !== story?.id)
        .map((section) => (
          <SectionBlock key={section.id} section={section} snapshot={snapshot} primary={!hasHero && section.id === firstTitled} context={context} />
        ))}
    </>
  );
}

type StorySection = Extract<Section, { type: "image_text" }>;
type PageContext = { hasHero: boolean; heroPoints: string[]; story?: StorySection };

// Shortcuts for the reasons people come to Crown, not just the product types.
const needs = [
  { label: "Hotel & guest house linen", href: "/shop?q=white" },
  { label: "Waterproof protection", href: "/shop?q=waterproof" },
  { label: "Everyday towels", href: "/collections/towels" },
  { label: "Buying in bulk", href: "/wholesale" },
];

function SectionBlock({ section, snapshot, primary, context }: { section: Section; snapshot: StoreSnapshot; primary: boolean; context: PageContext }) {
  const { settings } = snapshot;
  const currency = settings.currency;
  const chat = whatsappUrl(settings.whatsappNumber, settings.whatsappGreeting);
  const heading = primary ? "h1" : "h2";

  switch (section.type) {
    case "hero":
      return <Hero banner={heroBanners(snapshot)[0]} points={context.heroPoints} whatsappHref={chat} phone={settings.phoneDisplay} />;

    case "highlights":
      // Under a hero these points are already shown in it.
      if (context.hasHero) return null;
      return (
        <section aria-label={section.title} className="border-b border-line bg-white/70">
          <div className="stagger-load mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-5 py-10 md:px-8 lg:grid-cols-4 lg:py-12">
            {section.items.map((item) => (
              <div key={item.title} className="relative pl-5">
                <span className="absolute left-0 top-1.5 h-2 w-2 rotate-45 bg-gold" aria-hidden />
                <h3 className="font-serif text-lg font-bold leading-snug text-navy">{item.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-6 text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      );

    case "categories": {
      const categories = visibleCategories(snapshot);
      return (
        <Reveal as="section" className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading title={section.title} subtitle={section.subtitle} as={heading} />
            <Link href="/shop" className="label hidden items-center gap-2 border-b border-gold pb-1 text-[10px] text-navy hover:text-brass md:inline-flex">
              Shop all <ArrowRight size={13} aria-hidden />
            </Link>
          </div>
          <div className="stagger mt-10 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
            {categories.map((category) => {
              const count = countInCategory(snapshot, category.id);
              return (
                <Link
                  key={category.id}
                  href={`/collections/${category.slug}`}
                  className="group relative flex aspect-[4/5] flex-col overflow-hidden bg-navy text-[#fbf8f1]"
                  data-track={category.name}
                  data-track-id={`collection-${category.slug}`}
                >
                  {category.imageUrl ? (
                    <>
                      <Image src={category.imageUrl} alt={category.imageAlt || ""} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(min-width: 1024px) 25vw, 50vw" />
                      <span className="absolute inset-0 bg-gradient-to-t from-navy-deep/90 via-navy/30 to-transparent" aria-hidden />
                    </>
                  ) : (
                    <span className="navy-ground absolute inset-0 flex items-center justify-center pb-16" aria-hidden>
                      <PlateArt kind={categoryKind(category.name)} className="w-[62%] transition-transform duration-700 group-hover:-translate-y-1 group-hover:scale-105" />
                    </span>
                  )}
                  <span className="pointer-events-none absolute inset-[8px] border border-gold/40 transition-colors group-hover:border-gold/80" aria-hidden />
                  <span className="relative mt-auto p-5 md:p-6">
                    <span className="block font-serif text-2xl font-bold leading-tight md:text-[1.7rem]">{category.name}</span>
                    <span className="label mt-2 flex items-center gap-2 text-[9px] text-gold-strap">
                      {count} {count === 1 ? "item" : "items"}
                      <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" aria-hidden />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm text-muted">Shop by need:</span>
            {needs.map((need) => (
              <Link key={need.href} href={need.href} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-[13px] text-navy transition-colors hover:border-gold hover:text-brass" data-track={need.label} data-track-id="shop-by-need">
                {need.label} <ArrowRight size={13} aria-hidden />
              </Link>
            ))}
          </div>
        </Reveal>
      );
    }

    case "product_grid": {
      const products = pickProducts(snapshot, section.source, section.limit);
      if (products.length === 0) return null;
      return (
        <Reveal as="section" className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading title={section.title} subtitle={section.subtitle} as={heading} />
            <Link href="/shop" className="label inline-flex items-center gap-2 border-b border-gold pb-1 text-[10px] text-navy hover:text-brass" data-track="Shop all" data-track-id="shop-all">
              Shop all items <ArrowRight size={13} aria-hidden />
            </Link>
          </div>
          <div className="stagger mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} currency={currency} />
            ))}
          </div>
        </Reveal>
      );
    }

    case "steps":
      return (
        <Reveal as="section" className="border-y border-line bg-white/70">
          <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:py-24">
            <SectionHeading title={section.title} subtitle={section.subtitle} align="center" as={heading} />
            <ol className={`stagger relative mt-14 grid gap-10 md:gap-6 ${section.items.length >= 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}>
              <span className="draw-x absolute left-[12%] right-[12%] top-7 hidden h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent lg:block" aria-hidden />
              {section.items.map((item, index) => (
                <li key={item.title} className="relative text-center">
                  <span className="navy-ground relative mx-auto grid h-14 w-14 place-items-center rounded-full font-serif text-xl font-bold text-gold-hi ring-4 ring-paper">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 font-serif text-xl font-bold text-navy">{item.title}</h3>
                  <p className="mx-auto mt-2 max-w-[17rem] text-sm leading-6 text-muted">{item.text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <Link href="/shop" className="btn-ink">
                Start an order
              </Link>
              <a href={chat} target="_blank" rel="noreferrer" className="btn-line" data-track="WhatsApp steps" data-track-id="steps-whatsapp" data-track-type="whatsapp_click">
                <MessageCircle size={15} aria-hidden /> Ask a question first
              </a>
            </div>
          </div>
        </Reveal>
      );

    case "wholesale": {
      const onWholesalePage = section.pageSlug === "wholesale";
      const quoteText = "Hello Crown, I would like a wholesale quote for:";
      return (
        <Reveal as="section" id={onWholesalePage ? undefined : "wholesale"} className="navy-ground on-navy relative overflow-hidden">
          <div className={`mx-auto grid max-w-7xl gap-12 px-5 md:px-8 ${onWholesalePage ? "py-16 lg:grid-cols-[1fr_1.05fr] lg:py-20" : "py-20 lg:grid-cols-[1.1fr_1fr] lg:py-24"}`}>
            <div>
              <span className="crown-rule mb-4" aria-hidden />
              <p className="eyebrow">{section.eyebrow}</p>
              {onWholesalePage || primary ? (
                <h1 className="gather gold-text mt-3 font-serif text-[2.3rem] font-bold leading-[1.08] md:text-[3.4rem]">{section.title}</h1>
              ) : (
                <h2 className="gather gold-text mt-3 font-serif text-[2.1rem] font-bold leading-[1.1] md:text-5xl">{section.title}</h2>
              )}
              <p className="mt-5 max-w-xl font-serif text-lg italic leading-8 text-mist">{section.body}</p>
              <dl className="stagger mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {section.items.map((item) => (
                  <div key={item.title} className="border-t border-gold/35 pt-4">
                    <dt className="font-serif text-lg font-bold text-[#fbf8f1]">{item.title}</dt>
                    <dd className="mt-1 text-sm leading-6 text-mist">{item.text}</dd>
                  </div>
                ))}
              </dl>
              {!onWholesalePage ? (
                <div className="mt-10 flex flex-wrap gap-3">
                  <Link href="/wholesale" className="btn-brass" data-track="Wholesale quote" data-track-id="home-wholesale">
                    Get a wholesale quote
                  </Link>
                  <a
                    href={whatsappUrl(settings.whatsappNumber, quoteText)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-line border-gold/60 text-[#fbf8f1] hover:border-gold-hi hover:bg-[#fbf8f1] hover:text-navy"
                    data-track="Wholesale WhatsApp"
                    data-track-id="home-wholesale-whatsapp"
                    data-track-type="whatsapp_click"
                  >
                    <MessageCircle size={15} aria-hidden /> Send a list on WhatsApp
                  </a>
                </div>
              ) : null}
            </div>
            {onWholesalePage ? (
              <div id="quote" className="scroll-mt-28 bg-paper p-6 text-navy shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] md:p-9">
                <p className="eyebrow">Quote request</p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-navy">Send us your list</h2>
                <p className="mt-2 text-sm leading-6 text-muted">It is saved with us and opens in WhatsApp, so the quote comes back to your phone.</p>
                <div className="mt-6">
                  <WholesaleForm />
                </div>
              </div>
            ) : (
              <div className="relative hidden lg:block" aria-hidden>
                <div className="stagger absolute inset-0 grid grid-cols-2 gap-4">
                  {(["sheet", "duvet", "towel", "pillow"] as const).map((kind) => (
                    <div key={kind} className="relative grid place-items-center border border-gold/30 bg-[#fbf8f1]/[0.03]">
                      <PlateArt kind={kind} className="w-[62%]" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Reveal>
      );
    }

    case "size_guide": {
      const groups = sizeGuide(snapshot);
      if (groups.length === 0) return null;
      if (section.pageSlug === "home") return <SizeFinder groups={groups} title={section.title} subtitle={section.subtitle} whatsapp={settings.whatsappNumber} />;
      return (
        <Reveal as="section" id="sizes" className="mx-auto max-w-7xl scroll-mt-28 px-5 py-20 md:px-8 lg:py-24">
          <SectionHeading title={section.title} subtitle={section.subtitle} as={heading} />
          <div className="stagger mt-10 grid items-start gap-6 lg:grid-cols-2">
            {groups.map((group) => (
              <div key={group.categoryId} className="border border-line bg-white">
                <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
                  <h3 className="font-serif text-xl font-bold text-navy">{group.name}</h3>
                  <PlateArt kind={categoryKind(group.name)} tone="ivory" className="h-8 w-auto" />
                </div>
                <table className="tabular w-full text-left text-sm">
                  <caption className="sr-only">{group.name} sizes</caption>
                  <thead>
                    <tr className="label text-[9px] text-muted">
                      <th scope="col" className="whitespace-nowrap px-5 py-3 font-bold">Size (in)</th>
                      <th scope="col" className="whitespace-nowrap px-2 py-3 font-bold">Size (cm)</th>
                      <th scope="col" className="hidden px-2 py-3 font-bold sm:table-cell">Items</th>
                      <th scope="col" className="px-5 py-3 text-right font-bold">From</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => (
                      <tr key={row.size} className="border-t border-line/70 align-top">
                        <th scope="row" className="px-5 py-3 font-serif text-base font-bold text-navy">{row.size}</th>
                        <td className="whitespace-nowrap px-2 py-3 text-muted">{row.cm || "—"}</td>
                        <td className="hidden px-2 py-3 sm:table-cell">
                          {row.items.map((item, index) => (
                            <span key={item.slug}>
                              {index > 0 ? ", " : ""}
                              <Link href={`/products/${item.slug}`} className="text-navy underline decoration-gold/60 underline-offset-2 hover:text-brass">
                                {item.title}
                              </Link>
                            </span>
                          ))}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right font-serif font-bold text-brass">{formatMoney(row.from, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">
            Not sure which size fits?{" "}
            <a href={whatsappUrl(settings.whatsappNumber, "Hello Crown, which size fits a mattress of ")} target="_blank" rel="noreferrer" className="text-navy underline decoration-gold underline-offset-4 hover:text-brass">
              Send us your mattress size on WhatsApp
            </a>
            .
          </p>
        </Reveal>
      );
    }

    case "visit":
      return <VisitBlock settings={settings} title={section.title} subtitle={section.subtitle} heading={heading} story={context.story} />;

    case "image_text": {
      const copy = (
        <div className="flex flex-col justify-center lg:px-6">
          <SectionHeading eyebrow={section.eyebrow} title={section.title} as={heading} />
          <div className="prose-house mt-6 max-w-lg text-[15px] leading-8 text-ink/80">
            {paragraphs(section.body).map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
          {section.buttonLabel ? (
            <Link href={section.buttonHref || "/shop"} className="btn-line mt-9 w-fit" data-track={section.buttonLabel} data-track-id={`story-${section.id}`}>
              {section.buttonLabel} <ArrowRight size={14} aria-hidden />
            </Link>
          ) : null}
        </div>
      );
      const picture = (
        <div className="relative aspect-[4/3] w-full lg:aspect-[5/4]">
          <div className="absolute inset-0 border-2 border-navy" aria-hidden />
          <div className="unveil absolute inset-[9px] overflow-hidden bg-sand">
            {section.imageUrl ? (
              <div className="parallax absolute inset-0">
                <Image src={section.imageUrl} alt={section.imageAlt || ""} fill className="object-cover" sizes="(min-width: 1024px) 45vw, 100vw" />
              </div>
            ) : null}
          </div>
          <div className="pointer-events-none absolute inset-[9px] border border-gold/70" aria-hidden />
        </div>
      );
      return (
        <Reveal as="section" className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:px-8 lg:grid-cols-2 lg:gap-16 lg:py-24">
          {section.align === "left" ? picture : copy}
          {section.align === "left" ? copy : picture}
        </Reveal>
      );
    }

    case "values":
      return (
        <Reveal as="section" className="navy-ground on-navy">
          <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
            <span className="crown-rule mb-4" aria-hidden />
            {primary ? (
              <h1 className="gather gold-text font-serif text-[2.1rem] font-bold md:text-5xl">{section.title}</h1>
            ) : (
              <h2 className="gather gold-text font-serif text-[2.1rem] font-bold md:text-5xl">{section.title}</h2>
            )}
            <div className="stagger mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {section.items.map((item) => (
                <div key={item.title} className="border-t border-gold/35 pt-5">
                  <h3 className="font-serif text-xl font-bold text-[#fbf8f1]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-mist">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      );

    case "testimonials": {
      const quotes = snapshot.testimonials.filter((item) => item.visible).sort((a, b) => a.sort - b.sort);
      if (quotes.length === 0) return null;
      return (
        <Reveal as="section" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
          <SectionHeading title={section.title} subtitle={section.subtitle} as={heading} />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {quotes.map((quote) => (
              <figure key={quote.id} className="crown-frame bg-white p-8 text-navy">
                <blockquote className="font-serif text-2xl italic leading-snug">“{quote.quote}”</blockquote>
                <figcaption className="label mt-5 text-[9.5px] text-brass">
                  {quote.author}
                  {quote.detail ? ` · ${quote.detail}` : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      );
    }

    case "promo":
      return (
        <Reveal as="section" className="relative mx-auto my-10 max-w-7xl overflow-hidden bg-navy-deep md:my-16">
          {section.imageUrl ? <Image src={section.imageUrl} alt={section.imageAlt || ""} fill className="object-cover opacity-55" sizes="100vw" /> : null}
          <span className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/70 to-transparent" aria-hidden />
          <div className="relative z-10 flex min-h-[420px] flex-col justify-end p-8 text-white md:p-14">
            <p className="eyebrow text-gold-strap">{section.eyebrow}</p>
            <h2 className="gather gold-text-light mt-3 max-w-lg font-serif text-4xl font-bold md:text-5xl">{section.title}</h2>
            {section.body ? <p className="mt-3 max-w-md font-serif text-lg italic text-white/85">{section.body}</p> : null}
            <Link href={section.buttonHref} className="btn-brass mt-7 w-fit" data-track={section.buttonLabel} data-track-id={`promo-${section.id}`}>
              {section.buttonLabel}
            </Link>
          </div>
        </Reveal>
      );

    case "gallery":
      if (section.images.length === 0) return null;
      return (
        <Reveal as="section" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
          <SectionHeading title={section.title} subtitle={section.subtitle} as={heading} />
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {section.images.map((image) => (
              <div key={image.url} className="relative aspect-[3/4] bg-sand">
                <Image src={image.url} alt={image.alt} fill className="object-cover" sizes="(min-width: 768px) 25vw, 50vw" />
              </div>
            ))}
          </div>
        </Reveal>
      );

    case "newsletter":
      return (
        <Reveal as="section" className="border-t border-line bg-ivory">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-16 md:px-8 lg:grid-cols-[1fr_1fr] lg:py-20">
            <div>
              <span className="crown-rule mb-4" aria-hidden />
              <h2 className="gather gold-text font-serif text-3xl font-bold md:text-4xl">{section.title}</h2>
              <p className="mt-3 max-w-md font-serif text-[17px] italic leading-7 text-muted">{section.subtitle}</p>
            </div>
            <SubscribeForm source="home" buttonLabel={section.buttonLabel} inline />
          </div>
        </Reveal>
      );

    case "faq": {
      const faqs = snapshot.faqs.filter((faq) => faq.visible).sort((a, b) => a.sort - b.sort);
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
      };
      return (
        <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
          {faqs.length ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeading title={section.title} subtitle={section.subtitle} as={heading} />
            <div className="mt-8 border border-line bg-white p-6">
              <p className="font-serif text-lg font-bold text-navy">Still have a question?</p>
              <p className="mt-1 text-sm leading-6 text-muted">Message us and a person at Crown will reply.</p>
              <a href={chat} target="_blank" rel="noreferrer" className="btn-ink mt-5 w-full" data-track="WhatsApp FAQ" data-track-id="faq-whatsapp" data-track-type="whatsapp_click">
                <MessageCircle size={15} aria-hidden /> WhatsApp {settings.phoneDisplay}
              </a>
            </div>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {faqs.map((faq) => (
              <details key={faq.id} className="group py-1" id={faq.id}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-serif text-xl font-bold text-navy marker:hidden [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span className="relative h-3 w-3 shrink-0" aria-hidden>
                    <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gold" />
                    <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gold transition-transform group-open:scale-y-0" />
                  </span>
                </summary>
                <p className="pb-6 pr-8 text-[15px] leading-7 text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      );
    }

    case "contact":
      return (
        <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:py-20">
          <div>
            <SectionHeading title={section.title} subtitle={section.subtitle} as={heading} />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <a href={chat} target="_blank" rel="noreferrer" className="btn-brass" data-track="WhatsApp contact" data-track-id="contact-whatsapp" data-track-type="whatsapp_click">
                <MessageCircle size={15} aria-hidden /> WhatsApp
              </a>
              <a href={telUrl(settings.phoneDisplay)} className="btn-line" data-track="Call" data-track-id="contact-call">
                <Phone size={15} aria-hidden /> Call {settings.phoneDisplay}
              </a>
            </div>
            <ContactFacts settings={settings} />
          </div>
          <div className="border border-line bg-white p-6 md:p-9">
            <p className="eyebrow">Send a note</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-navy">We reply on WhatsApp</h2>
            <div className="mt-6">
              <InquiryForm type="contact" buttonLabel="Send on WhatsApp" pagePath="/contact" />
            </div>
          </div>
        </section>
      );

    case "rich_text":
      return (
        <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:px-8 lg:grid-cols-[1fr_20rem] lg:py-20">
          <div className="max-w-3xl">
            <span className="crown-rule mb-4" aria-hidden />
            {heading === "h1" ? (
              <h1 className="gather gold-text font-serif text-[2.4rem] font-bold leading-tight md:text-6xl">{section.title}</h1>
            ) : (
              <h2 className="gather gold-text font-serif text-[2.1rem] font-bold leading-tight md:text-5xl">{section.title}</h2>
            )}
            <div className="prose-house mt-8 text-[16px] leading-8 text-ink/85">
              {paragraphs(section.body).map((paragraph) => {
                const match = paragraph.match(/^([^:\n]{3,40}):\s([\s\S]+)$/);
                return match ? (
                  <p key={paragraph.slice(0, 32)}>
                    <strong className="font-serif text-[17px] text-navy">{match[1]}.</strong> {match[2]}
                  </p>
                ) : (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                );
              })}
            </div>
          </div>
          {section.pageSlug !== "shop" ? (
            <aside className="h-fit border border-line bg-white p-6 lg:sticky lg:top-32">
              <p className="font-serif text-lg font-bold text-navy">Questions?</p>
              <p className="mt-1 text-sm leading-6 text-muted">A person at Crown answers every message.</p>
              <a href={chat} target="_blank" rel="noreferrer" className="btn-ink mt-5 w-full" data-track="WhatsApp page" data-track-id={`page-${section.pageSlug}-whatsapp`} data-track-type="whatsapp_click">
                <MessageCircle size={15} aria-hidden /> WhatsApp us
              </a>
              <Link href="/faq" className="btn-line mt-3 w-full">
                Read the questions
              </Link>
            </aside>
          ) : null}
        </section>
      );
  }
}

function ContactFacts({ settings }: { settings: Settings }) {
  return (
    <dl className="mt-10 space-y-5 text-[15px]">
      <div className="flex gap-4">
        <MapPin size={18} className="mt-0.5 shrink-0 text-brass" aria-hidden />
        <div>
          <dt className="eyebrow">Shop</dt>
          <dd className="mt-1 text-navy">
            {settings.address}, {settings.city}
            <a href={mapsUrl(settings)} target="_blank" rel="noreferrer" className="label ml-2 text-[9.5px] text-brass underline underline-offset-4">
              Directions
            </a>
          </dd>
        </div>
      </div>
      <div className="flex gap-4">
        <MessageCircle size={18} className="mt-0.5 shrink-0 text-brass" aria-hidden />
        <div>
          <dt className="eyebrow">WhatsApp and phone</dt>
          <dd className="mt-1 text-navy">{settings.phoneDisplay}</dd>
        </div>
      </div>
      {settings.hours ? (
        <div className="flex gap-4">
          <Clock size={18} className="mt-0.5 shrink-0 text-brass" aria-hidden />
          <div>
            <dt className="eyebrow">Hours</dt>
            <dd className="mt-1 text-navy">{settings.hours}</dd>
          </div>
        </div>
      ) : null}
      {settings.email ? (
        <div className="flex gap-4">
          <span className="mt-0.5 w-[18px] shrink-0 text-center font-serif text-brass" aria-hidden>@</span>
          <div>
            <dt className="eyebrow">Email</dt>
            <dd className="mt-1">
              <a href={`mailto:${settings.email}`} className="text-navy underline decoration-gold underline-offset-4">
                {settings.email}
              </a>
            </dd>
          </div>
        </div>
      ) : null}
      {settings.instagram ? (
        <div className="flex gap-4">
          <Camera size={18} className="mt-0.5 shrink-0 text-brass" aria-hidden />
          <div>
            <dt className="eyebrow">Instagram</dt>
            <dd className="mt-1">
              <a href={settings.instagram} target="_blank" rel="noreferrer" className="text-navy underline decoration-gold underline-offset-4">
                @{settings.instagram.replace(/\/$/, "").split("/").pop()}
              </a>
            </dd>
          </div>
        </div>
      ) : null}
    </dl>
  );
}

function SizeFinder({ groups, title, subtitle, whatsapp }: { groups: ReturnType<typeof sizeGuide>; title: string; subtitle: string; whatsapp: string }) {
  return (
    <Reveal as="section" className="mx-auto max-w-7xl px-5 py-16 md:px-8 lg:py-20">
      <div className="grid items-center gap-10 border border-line bg-white p-7 md:p-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading title={title} subtitle={subtitle} />
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/pages/size-guide" className="btn-ink" data-track="Size guide" data-track-id="home-size-guide">
              Full size guide <ArrowRight size={14} aria-hidden />
            </Link>
            <a href={whatsappUrl(whatsapp, "Hello Crown, which size fits a mattress of ")} target="_blank" rel="noreferrer" className="btn-line" data-track-type="whatsapp_click" data-track="Size WhatsApp" data-track-id="home-size-whatsapp">
              <MessageCircle size={15} aria-hidden /> Ask us
            </a>
          </div>
        </div>
        <ul className="stagger grid gap-3 sm:grid-cols-2">
          {groups.map((group) => {
            const sizes = group.rows.filter((row) => /\d/.test(row.size)).map((row) => row.size);
            return (
              <li key={group.categoryId} className="flex items-start gap-4 rounded-sm bg-paper p-4">
                <PlateArt kind={categoryKind(group.name)} tone="ivory" className="mt-1 h-7 w-auto shrink-0" />
                <div className="min-w-0">
                  <p className="font-serif text-[17px] font-bold text-navy">{group.name}</p>
                  <p className="tabular mt-1 text-[13px] leading-6 text-muted">{sizes.length ? `${sizes[0]} to ${sizes[sizes.length - 1]} in` : "Ask for sizes"}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Reveal>
  );
}

function VisitBlock({ settings, title, subtitle, heading, story }: { settings: Settings; title: string; subtitle: string; heading: "h1" | "h2"; story?: StorySection }) {
  if (story) {
    const [lead] = paragraphs(story.body);
    return (
      <Reveal as="section" className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:px-8 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:py-24">
        <div>
          <SectionHeading eyebrow={story.eyebrow} title={story.title} as={heading} />
          {lead ? <p className="mt-6 max-w-lg text-[15px] leading-8 text-ink/80">{lead}</p> : null}
          <ContactFacts settings={settings} />
          <div className="mt-9 flex flex-wrap gap-3">
            <a href={mapsUrl(settings)} target="_blank" rel="noreferrer" className="btn-ink" data-track="Directions" data-track-id="visit-directions">
              <MapPin size={15} aria-hidden /> Get directions
            </a>
            <Link href={story.buttonHref || "/about"} className="btn-line" data-track={story.buttonLabel || "About Crown"} data-track-id="visit-about">
              {story.buttonLabel || "About Crown"} <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="relative aspect-[4/3] w-full lg:aspect-[5/4]">
            <div className="absolute inset-0 border-2 border-navy" aria-hidden />
            <div className="unveil absolute inset-[9px] overflow-hidden bg-sand">
              {story.imageUrl ? (
                <div className="parallax absolute inset-0">
                  <Image src={story.imageUrl} alt={story.imageAlt || ""} fill className="object-cover" sizes="(min-width: 1024px) 45vw, 100vw" />
                </div>
              ) : null}
            </div>
            <div className="pointer-events-none absolute inset-[9px] border border-gold/70" aria-hidden />
          </div>
          <div className="navy-ground relative -mt-14 ml-6 mr-6 flex items-center gap-4 px-6 py-5 shadow-[0_20px_40px_-20px_rgba(15,26,61,0.6)] sm:ml-auto sm:mr-[-12px] sm:w-[22rem]">
            <Image src="/images/brand/crown-mark.png" alt="" width={560} height={397} className="w-12 shrink-0" />
            <div>
              <p className="font-serif text-lg font-bold text-[#fbf8f1]">
                {settings.address}, {settings.city}
              </p>
              <p className="text-[12.5px] text-mist">{subtitle || title}</p>
            </div>
          </div>
        </div>
      </Reveal>
    );
  }
  return (
    <Reveal as="section" className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:py-24">
      <div className="grid overflow-hidden border border-line bg-white lg:grid-cols-2">
        <div className="p-7 md:p-12">
          <SectionHeading title={title} subtitle={subtitle} as={heading} />
          <ContactFacts settings={settings} />
          <div className="mt-9 flex flex-wrap gap-3">
            <a href={mapsUrl(settings)} target="_blank" rel="noreferrer" className="btn-ink" data-track="Directions" data-track-id="visit-directions">
              <MapPin size={15} aria-hidden /> Get directions
            </a>
            <a href={telUrl(settings.phoneDisplay)} className="btn-line" data-track="Call" data-track-id="visit-call">
              <Phone size={15} aria-hidden /> Call
            </a>
          </div>
        </div>
        <div className="navy-ground relative flex min-h-[320px] flex-col items-center justify-center p-10 text-center">
          <span className="pointer-events-none absolute inset-[12px] border border-gold/45" aria-hidden />
          <Image src="/images/brand/crown-mark.png" alt="" width={560} height={397} className="w-24" />
          <p className="mt-3 pl-[0.13em] font-serif text-3xl font-bold tracking-[0.13em] text-[#fbf8f1]">CROWN</p>
          <span className="crown-rule mx-auto my-5" aria-hidden />
          <p className="label text-[10px] text-gold-strap">Importers & wholesale dealers in textiles</p>
          <address className="mt-6 font-serif text-xl not-italic leading-8 text-[#fbf8f1]">
            {settings.address}
            <br />
            {settings.city}
          </address>
          <p className="label mt-6 text-[10px] text-mist">Specialists in bedsheets & towels</p>
        </div>
      </div>
    </Reveal>
  );
}
