import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { knownOptions } from "@/lib/catalog";
import { getSnapshot } from "@/lib/repo";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snapshot = await getSnapshot();
  const product = snapshot.products.find((item) => item.id === id);
  if (!product) notFound();
  return (
    <div>
      <h1 className="mb-8 font-serif text-5xl">{product.title}</h1>
      <ProductForm product={product} categories={snapshot.categories} currency={snapshot.settings.currency} known={knownOptions(snapshot)} canDelete />
    </div>
  );
}
