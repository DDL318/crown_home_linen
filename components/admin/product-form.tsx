"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProductAction, saveProductAction, uploadImageAction } from "@/app/actions/admin";
import { sizeOrder, type KnownOptions } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import type { Category, Product, ProductOption, ProductVariant } from "@/lib/types";

const SIZE = "Size";
const COLOUR = "Colour";

function cartesian(options: ProductOption[]) {
  return options.reduce<Record<string, string>[]>(
    (rows, option) => rows.flatMap((row) => option.values.map((value) => ({ ...row, [option.name]: value }))),
    [{}],
  );
}

// "90x100", "90 X 100" and "90×100" are all the same size.
function cleanSize(value: string) {
  return value.trim().replace(/\s*[x×]\s*/i, "×");
}

// Prices are kept in cents; the form shows and takes plain rupees.
function rupees(cents: number | null) {
  return cents === null ? "" : String(cents / 100);
}
function cents(value: string) {
  return Math.round((Number(value) || 0) * 100);
}

function valuesOf(product: Product, name: string) {
  return product.options.find((option) => option.name === name)?.values ?? [];
}

// Sizes and colours replace their own option groups, keeping their place;
// any other group a piece already has is left as it is.
function withChoices(product: Product, sizes: string[], colours: string[]): Product {
  const chosen: Record<string, string[]> = { [SIZE]: sizes, [COLOUR]: colours };
  const options = product.options.map((option) => (option.name in chosen ? { ...option, values: chosen[option.name] } : option));
  for (const name of [SIZE, COLOUR]) {
    if (!options.some((option) => option.name === name)) options.push({ name, values: chosen[name] });
  }
  const groups = options.filter((option) => option.values.length);
  const combos = groups.length ? cartesian(groups) : [{}];
  const variants = combos.map((selected): ProductVariant => {
    const same = (variant: ProductVariant) => groups.every((group) => variant.options[group.name] === selected[group.name]);
    const existing = product.variants.find(same);
    if (existing) return existing;
    // A new colour of an existing size starts at that size's price.
    const sibling = selected[SIZE] ? product.variants.find((variant) => variant.options[SIZE] === selected[SIZE]) : undefined;
    const title = Object.values(selected).join(" / ") || "Default";
    const key = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "default";
    return {
      id: `${product.id}-${key}`,
      title,
      sku: `${product.sku || "SKU"}-${key}`.toUpperCase(),
      price: sibling?.price ?? product.price,
      compareAtPrice: sibling?.compareAtPrice ?? product.compareAtPrice,
      options: selected,
      available: true,
      stock: 12,
    };
  });
  return { ...product, options: groups, variants };
}

function Choice({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`border px-3 py-1.5 text-sm transition-colors ${on ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink"}`}
    >
      {label}
    </button>
  );
}

// Tap the ready-made choices, or type a new one and press Add (or Enter).
function ChoiceGroup({
  title,
  hint,
  chosen,
  suggested,
  more,
  moreLabel,
  placeholder,
  clean,
  onChange,
}: {
  title: string;
  hint: string;
  chosen: string[];
  suggested: string[];
  more?: string[];
  moreLabel?: string;
  placeholder: string;
  clean: (value: string) => string;
  onChange: (values: string[]) => void;
}) {
  const [typed, setTyped] = useState("");
  const [showMore, setShowMore] = useState(false);
  const toggle = (value: string) => onChange(chosen.includes(value) ? chosen.filter((item) => item !== value) : [...chosen, value]);
  const first = [...suggested, ...chosen.filter((value) => !suggested.includes(value))];
  const rest = (more ?? []).filter((value) => !first.includes(value));
  function add() {
    const value = clean(typed);
    if (value && !chosen.includes(value)) onChange([...chosen, value]);
    setTyped("");
  }
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted">{hint}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {first.map((value) => (
          <Choice key={value} on={chosen.includes(value)} label={value} onClick={() => toggle(value)} />
        ))}
        {rest.length && !showMore ? (
          <button type="button" className="px-2 text-sm text-muted underline" onClick={() => setShowMore(true)}>
            {moreLabel}
          </button>
        ) : null}
        {showMore ? rest.map((value) => <Choice key={value} on={false} label={value} onClick={() => toggle(value)} />) : null}
      </div>
      <div className="mt-3 flex max-w-sm gap-2">
        <input
          className="field"
          value={typed}
          placeholder={placeholder}
          onChange={(event) => setTyped(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn-line shrink-0" onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
}

export function ProductForm({
  product,
  categories,
  currency,
  known,
  canDelete,
}: {
  product: Product;
  categories: Category[];
  currency: string;
  known: KnownOptions;
  canDelete: boolean;
}) {
  const router = useRouter();
  // A new piece starts with its single "Default" variant, so it can be
  // ordered even before any sizes are chosen.
  const [draft, setDraft] = useState(() => (product.variants.length ? product : withChoices(product, [], [])));
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const sizes = valuesOf(draft, SIZE);
  const colours = valuesOf(draft, COLOUR);
  const hasChoices = draft.options.length > 0;
  const allSizes = [...new Set(Object.values(known.sizes).flat())].sort(sizeOrder);

  function choose(nextSizes: string[], nextColours: string[]) {
    setDraft(withChoices(draft, [...nextSizes].sort(sizeOrder), nextColours));
  }

  // With no sizes or colours, the one variant simply follows the price.
  function setPrice(price: number) {
    setDraft({ ...draft, price, variants: hasChoices ? draft.variants : draft.variants.map((variant) => ({ ...variant, price })) });
  }

  async function save() {
    setPending(true);
    // The price shown on the shop cards is the lowest size's.
    const price = hasChoices && draft.variants.length ? Math.min(...draft.variants.map((variant) => variant.price)) : draft.price;
    const result = await saveProductAction({ ...draft, price });
    setPending(false);
    setMessage("error" in result ? result.error || "Could not save." : "Saved.");
    if ("ok" in result && result.slug) router.replace(`/admin/products/${draft.id}`);
  }

  async function upload(file: File) {
    const body = new FormData();
    body.set("file", file);
    const result = await uploadImageAction(body);
    if ("error" in result) {
      setMessage(result.error || "Upload failed.");
      return;
    }
    setDraft({
      ...draft,
      images: [...draft.images, { id: crypto.randomUUID(), url: result.url, alt: draft.title, sort: draft.images.length }],
    });
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">Title
          <input className="field mt-1" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        </label>
        <label className="text-sm">Address
          <input className="field mt-1" value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} />
        </label>
        <label className="text-sm">Collection
          <select className="field mt-1" value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">Status
          <select className="field mt-1" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Product["status"] })}>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
        </label>
        <label className="text-sm md:col-span-2">Short description
          <textarea className="field mt-1 min-h-20" value={draft.shortDescription} onChange={(event) => setDraft({ ...draft, shortDescription: event.target.value })} />
        </label>
        <label className="text-sm md:col-span-2">Description
          <textarea className="field mt-1 min-h-36" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        </label>
        <label className="text-sm">{hasChoices ? "Usual price, Rs" : "Price, Rs"}
          <input className="field mt-1" type="number" min="0" step="any" inputMode="decimal" value={rupees(draft.price)} onChange={(event) => setPrice(cents(event.target.value))} />
          <span className="mt-1 block text-xs text-muted">
            {formatMoney(draft.price, currency)}.{hasChoices ? " New sizes start at this; set each size below." : " Type 2450 for Rs 2,450."}
          </span>
        </label>
        <label className="text-sm">Was, Rs (optional)
          <input className="field mt-1" type="number" min="0" step="any" inputMode="decimal" value={rupees(draft.compareAtPrice)} onChange={(event) => setDraft({ ...draft, compareAtPrice: event.target.value === "" ? null : cents(event.target.value) })} />
          <span className="mt-1 block text-xs text-muted">Shown crossed out, for a sale.</span>
        </label>
        <label className="text-sm">SKU
          <input className="field mt-1" value={draft.sku} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} />
        </label>
        <label className="text-sm">Sort
          <input className="field mt-1" type="number" value={draft.sort} onChange={(event) => setDraft({ ...draft, sort: Number(event.target.value) })} />
        </label>
        <label className="text-sm md:col-span-2">Material
          <input className="field mt-1" value={draft.material} onChange={(event) => setDraft({ ...draft, material: event.target.value })} />
        </label>
        <label className="text-sm md:col-span-2">Care
          <textarea className="field mt-1 min-h-20" value={draft.care} onChange={(event) => setDraft({ ...draft, care: event.target.value })} />
        </label>
        <label className="text-sm md:col-span-2">Measurements
          <input className="field mt-1" value={draft.dimensions} onChange={(event) => setDraft({ ...draft, dimensions: event.target.value })} />
        </label>
        <label className="text-sm">Search title
          <input className="field mt-1" value={draft.seoTitle} onChange={(event) => setDraft({ ...draft, seoTitle: event.target.value })} />
        </label>
        <label className="text-sm">Search description
          <input className="field mt-1" value={draft.seoDescription} onChange={(event) => setDraft({ ...draft, seoDescription: event.target.value })} />
        </label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} /> Featured</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.bestseller} onChange={(event) => setDraft({ ...draft, bestseller: event.target.checked })} /> Often asked for</label>
      </div>

      <section>
        <h2 className="font-serif text-3xl">Photographs</h2>
        <p className="mt-2 text-sm text-muted">One set of photographs for the piece, shown for every size and colour.</p>
        <div className="mt-4 space-y-3">
          {draft.images.map((image, index) => (
            <div key={image.id} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
              <input className="field" value={image.url} onChange={(event) => {
                const images = draft.images.slice();
                images[index] = { ...image, url: event.target.value };
                setDraft({ ...draft, images });
              }} />
              <input className="field" value={image.alt} placeholder="Alt" onChange={(event) => {
                const images = draft.images.slice();
                images[index] = { ...image, alt: event.target.value };
                setDraft({ ...draft, images });
              }} />
              <button type="button" className="text-sm" onClick={() => setDraft({ ...draft, images: draft.images.filter((item) => item.id !== image.id) })}>Remove</button>
            </div>
          ))}
        </div>
        <label className="btn-line mt-4 cursor-pointer">
          Upload a photograph
          <input type="file" accept="image/*" className="hidden" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }} />
        </label>
      </section>

      <section>
        <h2 className="font-serif text-3xl">Sizes &amp; prices</h2>
        <div className="mt-4 space-y-6">
          <ChoiceGroup
            title="Sizes"
            hint="Tap every size this piece comes in. Sizes used in this collection are shown first."
            chosen={sizes}
            suggested={known.sizes[draft.categoryId] ?? []}
            more={allSizes}
            moreLabel="More sizes"
            placeholder="New size, e.g. 90×100"
            clean={cleanSize}
            onChange={(next) => choose(next, colours)}
          />
          <ChoiceGroup
            title="Colours (optional)"
            hint="Only if the customer chooses a colour. The same photographs are used for all of them."
            chosen={colours}
            suggested={known.colours}
            placeholder="New colour, e.g. Blue & White"
            clean={(value) => value.trim()}
            onChange={(next) => choose(sizes, next)}
          />
        </div>
        {hasChoices ? (
          <div className="mt-6 overflow-auto">
            <table className="admin-table">
              <thead><tr><th>{draft.options.map((option) => option.name).join(" · ")}</th><th>Price, Rs</th><th>Available</th></tr></thead>
              <tbody>
                {draft.variants.map((variant, index) => (
                  <tr key={variant.id}>
                    <td>{variant.title}</td>
                    <td><input className="field max-w-36" type="number" min="0" step="any" inputMode="decimal" aria-label={`Price for ${variant.title}`} value={rupees(variant.price)} onChange={(event) => {
                      const variants = draft.variants.slice();
                      variants[index] = { ...variant, price: cents(event.target.value) };
                      setDraft({ ...draft, variants });
                    }} /></td>
                    <td><input type="checkbox" aria-label={`${variant.title} available`} checked={variant.available} onChange={(event) => {
                      const variants = draft.variants.slice();
                      variants[index] = { ...variant, available: event.target.checked };
                      setDraft({ ...draft, variants });
                    }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">No sizes chosen: the piece is sold as one item at the price above.</p>
        )}
      </section>

      {message ? <p className="text-sm">{message}</p> : null}
      <div className="flex gap-3">
        <button type="button" className="btn-ink" disabled={pending} onClick={() => void save()}>{pending ? "Saving" : "Save piece"}</button>
        {canDelete ? (
          <button type="button" className="btn-line" onClick={() => {
            if (!confirm("Remove this piece from the shop?")) return;
            void deleteProductAction(draft.id).then(() => router.push("/admin/products"));
          }}>Delete</button>
        ) : null}
      </div>
    </div>
  );
}
