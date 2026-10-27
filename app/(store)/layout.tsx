import { Suspense } from "react";
import type { Metadata } from "next";
import { Analytics } from "@/components/store/analytics";
import { CartProvider } from "@/components/store/cart";
import { DoorReveal } from "@/components/store/door-reveal";
import { Footer, Header } from "@/components/store/chrome";
import { NewsletterPopup } from "@/components/store/newsletter-popup";
import { PageFade } from "@/components/store/page-fade";
import { PlateGradients } from "@/components/store/product-plate";
import { mapsUrl, telUrl } from "@/components/store/sections";
import { activeProducts, lowestPrice, navItems } from "@/lib/catalog";
import { whatsappUrl } from "@/lib/format";
import { getStorefront } from "@/lib/repo";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getStorefront();
  return {
    // absolute: the home title is used as is, without the root "— Crown" suffix.
    title: {
      absolute: settings.metaTitle,
      template: `%s — ${settings.storeName}`,
    },
    description: settings.metaDescription,
    openGraph: {
      type: "website",
      siteName: settings.storeName,
      locale: "en_LK",
      title: settings.metaTitle,
      description: settings.metaDescription,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: `${settings.storeName}, ${settings.city}` }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const snapshot = await getStorefront();
  const { settings } = snapshot;
  const categoryNames = new Map(snapshot.categories.map((category) => [category.id, category.name]));
  const products = activeProducts(snapshot).map((product) => ({
    title: product.title,
    slug: product.slug,
    price: lowestPrice(product),
    imageUrl: product.images[0]?.url || "",
    currency: settings.currency,
    keywords: [categoryNames.get(product.categoryId), product.material, product.sku, ...product.options.flatMap((option) => option.values)].join(" ").toLowerCase(),
  }));
  const chat = whatsappUrl(settings.whatsappNumber, settings.whatsappGreeting);
  const base = siteUrl();
  const business = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${base}/#store`,
    name: settings.storeName,
    description: settings.metaDescription,
    url: base,
    logo: `${base}/images/brand/crown-mark.png`,
    image: `${base}/og.png`,
    telephone: settings.phoneDisplay,
    priceRange: "LKR",
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressLocality: settings.city,
      addressCountry: "LK",
    },
    ...(settings.instagram ? { sameAs: [settings.instagram] } : {}),
  };

  return (
    <CartProvider currency={settings.currency}>
      <DoorReveal>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(business).replace(/</g, "\\u003c") }} />
      <PlateGradients />
      <Suspense fallback={null}>
        <Analytics measurementId={settings.gaMeasurementId} />
      </Suspense>
      <Header
        storeName={settings.storeName}
        logoUrl={settings.logoUrl}
        announcement={settings.announcement}
        announcementEnabled={settings.announcementEnabled}
        nav={navItems(snapshot, "header")}
        products={products}
        whatsappHref={chat}
        phone={settings.phoneDisplay}
        address={[settings.address, settings.city].filter(Boolean).join(", ")}
      />
      <main id="main" className="flex-1" tabIndex={-1}>
        <PageFade>{children}</PageFade>
      </main>
      {settings.popupEnabled ? <NewsletterPopup title={settings.popupTitle} body={settings.popupBody} /> : null}
      <Footer
        storeName={settings.storeName}
        note={settings.footerNote}
        email={settings.email}
        phone={settings.phoneDisplay}
        address={settings.address}
        city={settings.city}
        hours={settings.hours}
        instagram={settings.instagram}
        whatsappHref={chat}
        mapsHref={mapsUrl(settings)}
        telHref={telUrl(settings.phoneDisplay)}
        shop={navItems(snapshot, "footer_shop")}
        help={navItems(snapshot, "footer_help")}
        company={navItems(snapshot, "footer_company")}
      />
      </DoorReveal>
    </CartProvider>
  );
}
