import type { Product, ProductVariant, StoreSnapshot } from "@/lib/types";

// Per size, per order. Enough for a guest house; larger runs go through a wholesale quote.
export const MAX_LINE_QUANTITY = 500;

export function visibleCategories(snapshot: StoreSnapshot) {
  return snapshot.categories.filter((category) => category.visible).sort((a, b) => a.sort - b.sort);
}

export function activeProducts(snapshot: StoreSnapshot) {
  return snapshot.products
    .filter((product) => product.status === "active")
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title));
}

export function productBySlug(snapshot: StoreSnapshot, slug: string) {
  return activeProducts(snapshot).find((product) => product.slug === slug) ?? null;
}

export function categoryBySlug(snapshot: StoreSnapshot, slug: string) {
  return visibleCategories(snapshot).find((category) => category.slug === slug) ?? null;
}

export function productsInCategory(snapshot: StoreSnapshot, categoryId: string) {
  return activeProducts(snapshot).filter((product) => product.categoryId === categoryId);
}

export function relatedProducts(snapshot: StoreSnapshot, product: Product, limit = 4) {
  return activeProducts(snapshot)
    .filter((item) => item.categoryId === product.categoryId && item.id !== product.id)
    .slice(0, limit);
}

// Lower-case, "90x100" / "90 * 100" -> "90×100", "colours" -> "colour".
function normalizeSearch(text: string) {
  return text
    .toLowerCase()
    .replace(/(\d)\s*[x×*]\s*(\d)/g, "$1×$2")
    .replace(/colors?|colours/g, "colour");
}

// Every word in the query has to appear somewhere on the product: title,
// descriptions, material, SKU, collection name, or a size or colour.
export function matchesQuery(product: Product, categoryName: string, query: string) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeSearch(
    [product.title, product.shortDescription, product.description, product.material, product.sku, categoryName, ...product.options.flatMap((option) => option.values)].join(" "),
  );
  return words.every((word) => haystack.includes(word.replace(/s$/, "")));
}

export function searchProducts(snapshot: StoreSnapshot, query: string) {
  const names = new Map(snapshot.categories.map((category) => [category.id, category.name]));
  return activeProducts(snapshot).filter((product) => matchesQuery(product, names.get(product.categoryId) || "", query));
}

export function navItems(snapshot: StoreSnapshot, location: StoreSnapshot["navigation"][number]["location"]) {
  return snapshot.navigation
    .filter((item) => item.visible && item.location === location)
    .sort((a, b) => a.sort - b.sort);
}

export function pageSections(snapshot: StoreSnapshot, slug: string) {
  return snapshot.sections
    .filter((section) => section.pageSlug === slug && section.visible)
    .sort((a, b) => a.sort - b.sort);
}

export function heroBanners(snapshot: StoreSnapshot) {
  return snapshot.banners
    .filter((banner) => banner.active && banner.placement === "hero")
    .sort((a, b) => a.sort - b.sort);
}

export function lowestPrice(product: Product) {
  if (product.variants.length === 0) return product.price;
  return Math.min(...product.variants.map((variant) => variant.price));
}

export function displayPrice(product: Product, variant?: ProductVariant | null) {
  const price = variant?.price ?? lowestPrice(product);
  const compare = variant?.compareAtPrice ?? product.compareAtPrice;
  return {
    price,
    compare: compare && compare > price ? compare : null,
  };
}

export function variantInStock(variant: ProductVariant) {
  return variant.available && variant.stock > 0;
}

export function countInCategory(snapshot: StoreSnapshot, categoryId: string) {
  return activeProducts(snapshot).filter((product) => product.categoryId === categoryId).length;
}

// "90×100" (inches) -> "229 × 254 cm". Returns "" for sizes like "Large".
export function sizeInCm(size: string) {
  const match = size.match(/^(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)$/i);
  if (!match) return "";
  return `${Math.round(Number(match[1]) * 2.54)} × ${Math.round(Number(match[2]) * 2.54)} cm`;
}

// Measured sizes smallest first; named sizes ("Large") after them.
export function sizeOrder(a: string, b: string) {
  const area = (size: string) => (/\d/.test(size) ? size.split(/[×x]/).reduce((total, part) => total * (Number(part) || 0), 1) : Number.MAX_SAFE_INTEGER);
  return area(a) - area(b) || a.localeCompare(b);
}

// The sizes (per collection) and colours already used anywhere in the
// catalogue, offered as ready-made choices when adding a piece.
export function knownOptions(snapshot: StoreSnapshot) {
  const sizes: Record<string, string[]> = {};
  const colours = new Set<string>();
  for (const product of snapshot.products) {
    for (const variant of product.variants) {
      const size = variant.options.Size;
      if (size && !(sizes[product.categoryId] ??= []).includes(size)) sizes[product.categoryId].push(size);
      if (variant.options.Colour) colours.add(variant.options.Colour);
    }
  }
  for (const list of Object.values(sizes)) list.sort(sizeOrder);
  return { sizes, colours: [...colours].sort() };
}

export type KnownOptions = ReturnType<typeof knownOptions>;

export type SizeRow = { size: string; cm: string; from: number; items: { title: string; slug: string }[] };
export type SizeGroup = { categoryId: string; name: string; rows: SizeRow[] };

// Every Size value in the active catalogue, grouped by collection, with the
// lowest price at that size and the items that come in it.
export function sizeGuide(snapshot: StoreSnapshot): SizeGroup[] {
  return visibleCategories(snapshot)
    .map((category) => {
      const rows = new Map<string, SizeRow>();
      for (const product of productsInCategory(snapshot, category.id)) {
        for (const variant of product.variants) {
          const size = variant.options.Size;
          if (!size || !variant.available) continue;
          const row = rows.get(size) ?? { size, cm: sizeInCm(size), from: variant.price, items: [] };
          row.from = Math.min(row.from, variant.price);
          if (!row.items.some((item) => item.slug === product.slug)) row.items.push({ title: product.title, slug: product.slug });
          rows.set(size, row);
        }
      }
      return { categoryId: category.id, name: category.name, rows: [...rows.values()].sort((a, b) => sizeOrder(a.size, b.size)) };
    })
    .filter((group) => group.rows.length > 0);
}

export function priceRange(product: Product) {
  const prices = product.variants.length ? product.variants.map((variant) => variant.price) : [product.price];
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
