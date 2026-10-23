import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPurchase } from "@/components/store/commerce";
import { ProductCard } from "@/components/store/product-card";
import { activeProducts, priceRange, productBySlug, relatedProducts, variantInStock } from "@/lib/catalog";
import { getStorefront } from "@/lib/repo";
import { siteUrl } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const snapshot = await getStorefront();
  const product = productBySlug(snapshot, slug);
  if (!product) return { title: "Item not found" };
  const image = product.images[0]?.url;
  return {
    title: product.seoTitle || product.title,
    description: product.seoDescription || product.shortDescription,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.title,
      description: product.seoDescription || product.shortDescription,
      ...(image ? { images: [{ url: image, alt: product.images[0]?.alt || product.title }] } : {}),
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const snapshot = await getStorefront();
  const product = productBySlug(snapshot, slug);
  if (!product) notFound();
  const category = snapshot.categories.find((item) => item.id === product.categoryId);
  // Same collection first, then anything else, so there is always a full row.
  const related = [...relatedProducts(snapshot, product, 4), ...activeProducts(snapshot).filter((item) => item.id !== product.id && item.categoryId !== product.categoryId)].slice(0, 4);
  const { min, max } = priceRange(product);
  const base = siteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.description || product.shortDescription,
      sku: product.sku,
      category: category?.name,
      url: `${base}/products/${product.slug}`,
      ...(product.images.length ? { image: product.images.map((image) => (image.url.startsWith("http") ? image.url : `${base}${image.url}`)) } : {}),
      brand: { "@type": "Brand", name: snapshot.settings.storeName },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: snapshot.settings.currency,
        lowPrice: (min / 100).toFixed(2),
        highPrice: (max / 100).toFixed(2),
        offerCount: product.variants.length,
        availability: product.variants.some(variantInStock) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: snapshot.settings.storeName },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
        ...(category ? [{ "@type": "ListItem", position: 2, name: category.name, item: `${base}/collections/${category.slug}` }] : []),
        { "@type": "ListItem", position: category ? 3 : 2, name: product.title, item: `${base}/products/${product.slug}` },
      ],
    },
  ];

  return (
    <article className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="label mb-8 text-[9.5px] text-muted">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/" className="hover:text-navy">Home</Link>
          </li>
          <li aria-hidden>/</li>
          {category ? (
            <>
              <li>
                <Link href={`/collections/${category.slug}`} className="hover:text-navy">{category.name}</Link>
              </li>
              <li aria-hidden>/</li>
            </>
          ) : null}
          <li aria-current="page" className="text-navy">{product.title}</li>
        </ol>
      </nav>
      <ProductPurchase product={product} currency={snapshot.settings.currency} categoryName={category?.name || "Crown"} whatsappNumber={snapshot.settings.whatsappNumber} />
      {related.length > 0 ? (
        <section className="mt-24 border-t border-line pt-16" aria-labelledby="related-title">
          <span className="crown-rule mb-4" aria-hidden />
          <h2 id="related-title" className="gather gold-text font-serif text-3xl font-bold md:text-4xl">
            Goes well with
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} currency={snapshot.settings.currency} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
