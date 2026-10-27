import { ProductForm } from "@/components/admin/product-form";
import { knownOptions } from "@/lib/catalog";
import { getSnapshot } from "@/lib/repo";
import type { Product } from "@/lib/types";

export default async function NewProductPage() {
  const snapshot = await getSnapshot();
  const now = new Date().toISOString();
  const product: Product = {
    id: crypto.randomUUID(),
    title: "",
    slug: "",
    description: "",
    shortDescription: "",
    price: 0,
    compareAtPrice: null,
    sku: "",
    categoryId: snapshot.categories[0]?.id || "",
    images: [],
    options: [],
    variants: [],
    material: "",
    care: "",
    dimensions: "",
    featured: false,
    bestseller: false,
    status: "draft",
    seoTitle: "",
    seoDescription: "",
    sort: snapshot.products.length + 1,
    createdAt: now,
    updatedAt: now,
  };
  return (
    <div>
      <h1 className="mb-8 font-serif text-5xl">New piece</h1>
      <ProductForm product={product} categories={snapshot.categories} currency={snapshot.settings.currency} known={knownOptions(snapshot)} canDelete={false} />
    </div>
  );
}
