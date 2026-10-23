"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/store/cart";
import { ProductPlate } from "@/components/store/product-plate";
import { QuantityStepper } from "@/components/store/quantity";
import { formatMoney } from "@/lib/format";

function token() {
  return crypto.randomUUID();
}

// Browsers only allow a new tab straight from a click. The request to save the
// order takes a moment, so a blank tab is opened on submit and pointed at
// WhatsApp once the order number is back. If the browser blocks even that,
// the success panel shows a button instead.
function openPendingTab() {
  try {
    const tab = window.open("", "_blank");
    if (!tab) return null;
    tab.opener = null;
    tab.document.title = "Opening WhatsApp…";
    tab.document.body.style.cssText = "font-family:system-ui,sans-serif;padding:2rem;color:#1a2b5f;background:#faf7f0";
    tab.document.body.textContent = "Opening WhatsApp…";
    return tab;
  } catch {
    return null;
  }
}

function sendTab(tab: Window | null, url: string) {
  if (tab && !tab.closed) {
    tab.location.href = url;
    return true;
  }
  return false;
}

type FieldErrors = Partial<Record<string, string>>;

function Field({
  label,
  name,
  error,
  optional,
  textarea,
  rows,
  ...rest
}: {
  label: string;
  name: string;
  error?: string;
  optional?: boolean;
  textarea?: boolean;
  rows?: number;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const errorId = `${id}-error`;
  const shared = {
    id,
    name,
    className: `field ${textarea ? "min-h-28" : ""}`,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
  };
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {optional ? <span className="ml-1 font-normal normal-case tracking-normal text-muted/80"> (optional)</span> : null}
      </label>
      {textarea ? (
        <textarea {...shared} rows={rows} required={rest.required} placeholder={rest.placeholder} maxLength={rest.maxLength} defaultValue={rest.defaultValue as string | undefined} />
      ) : (
        <input {...shared} {...rest} />
      )}
      {error ? (
        <p id={errorId} className="mt-1.5 text-[13px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Honeypot() {
  return (
    <div className="hidden" aria-hidden>
      <label>
        Company
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

function SentPanel({ title, body, whatsappUrl, opened, children }: { title: string; body: string; whatsappUrl: string; opened: boolean; children?: React.ReactNode }) {
  return (
    <div className="rise-in border border-ok/30 bg-[#f3f8f4] p-6" role="status">
      <CheckCircle2 className="text-ok" size={26} aria-hidden />
      <p className="mt-3 font-serif text-2xl font-bold text-navy">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
      <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-ink mt-5 w-full" data-track-type="whatsapp_click">
        <MessageCircle size={15} aria-hidden /> {opened ? "Open WhatsApp again" : "Open WhatsApp"}
      </a>
      {children}
    </div>
  );
}

async function post(url: string, body: unknown) {
  try {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = (await response.json().catch(() => ({}))) as Record<string, string | undefined>;
    return { ok: response.ok, data };
  } catch {
    return { ok: false, data: { error: "You seem to be offline. Check the connection and try again." } as Record<string, string | undefined> };
  }
}

export function InquiryForm({
  type,
  buttonLabel,
  pagePath,
  productTitle = "",
  productSlug = "",
}: {
  type: "contact" | "product" | "newsletter";
  buttonLabel: string;
  pagePath: string;
  productTitle?: string;
  productSlug?: string;
}) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState<{ url: string; opened: boolean } | null>(null);

  async function onSubmit(formData: FormData) {
    setErrors({});
    setPending(true);
    const tab = openPendingTab();
    const { ok, data } = await post("/api/inquiries", {
      clientToken: token(),
      type,
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email") || "",
      message: formData.get("message"),
      productTitle,
      productSlug,
      pagePath,
      company: formData.get("company") || "",
    });
    setPending(false);
    if (!ok || !data.whatsappUrl) {
      tab?.close();
      setErrors({ [data.field || "form"]: data.error || "The note did not send. Try again, or message us on WhatsApp." });
      return;
    }
    setSent({ url: data.whatsappUrl, opened: sendTab(tab, data.whatsappUrl) });
  }

  if (sent) {
    return (
      <SentPanel
        title="Your note is with us"
        body={sent.opened ? "WhatsApp has opened in a new tab with your message. Press send there and we will reply on your phone." : "Press the button to open WhatsApp with your message, then press send."}
        whatsappUrl={sent.url}
        opened={sent.opened}
      >
        <button type="button" className="label mt-4 text-[10px] text-navy underline underline-offset-4" onClick={() => setSent(null)}>
          Send another note
        </button>
      </SentPanel>
    );
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); void onSubmit(new FormData(event.currentTarget)); }} className="space-y-4" noValidate={false}>
      <Honeypot />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" required autoComplete="name" maxLength={80} error={errors.name} />
        <Field label="WhatsApp number" name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="07X XXX XXXX" maxLength={32} error={errors.phone} />
      </div>
      <Field label="Email" name="email" type="email" autoComplete="email" optional maxLength={120} error={errors.email} />
      <Field
        label={productTitle ? `Your question about ${productTitle}` : "Your message"}
        name="message"
        textarea
        rows={4}
        required
        maxLength={1200}
        placeholder={productTitle ? "Colours in stock, a size, a quantity…" : "What you need, sizes, quantities…"}
        error={errors.message}
      />
      {errors.form ? <p className="text-sm text-danger" role="alert">{errors.form}</p> : null}
      <button type="submit" disabled={pending} data-track={buttonLabel} data-track-id="send-inquiry" className="btn-ink w-full disabled:opacity-60">
        <MessageCircle size={15} aria-hidden /> {pending ? "Saving…" : buttonLabel}
      </button>
      <p className="text-xs leading-5 text-muted">Your note is saved with Crown and opens in WhatsApp. We never share your number.</p>
    </form>
  );
}

export function WholesaleForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState<{ url: string; opened: boolean } | null>(null);

  async function onSubmit(formData: FormData) {
    setErrors({});
    const list = String(formData.get("list") || "").trim();
    if (list.length < 4) {
      setErrors({ message: "List the items, sizes, and quantities you need." });
      return;
    }
    setPending(true);
    const tab = openPendingTab();
    const business = String(formData.get("business") || "").trim();
    const town = String(formData.get("town") || "").trim();
    const message = [business ? `Business: ${business}` : "", town ? `Town: ${town}` : "", "", list].filter((part, index) => part || index === 2).join("\n").trim();
    const { ok, data } = await post("/api/inquiries", {
      clientToken: token(),
      type: "wholesale",
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email") || "",
      message,
      pagePath: "/wholesale",
      company: formData.get("company") || "",
    });
    setPending(false);
    if (!ok || !data.whatsappUrl) {
      tab?.close();
      setErrors({ [data.field || "form"]: data.error || "The list did not send. Try again, or send it on WhatsApp." });
      return;
    }
    setSent({ url: data.whatsappUrl, opened: sendTab(tab, data.whatsappUrl) });
  }

  if (sent) {
    return (
      <SentPanel
        title="Your list is with us"
        body={sent.opened ? "WhatsApp has opened with your list. Press send there, and we will reply with wholesale prices and stock." : "Press the button to open WhatsApp with your list, then press send."}
        whatsappUrl={sent.url}
        opened={sent.opened}
      />
    );
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); void onSubmit(new FormData(event.currentTarget)); }} className="space-y-4">
      <Honeypot />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" name="name" required autoComplete="name" maxLength={80} error={errors.name} />
        <Field label="WhatsApp number" name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="07X XXX XXXX" maxLength={32} error={errors.phone} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hotel, guest house, or shop" name="business" optional autoComplete="organization" maxLength={80} />
        <Field label="Town" name="town" optional autoComplete="address-level2" maxLength={60} />
      </div>
      <Field label="Email" name="email" type="email" optional autoComplete="email" maxLength={120} error={errors.email} />
      <Field
        label="Your list"
        name="list"
        textarea
        rows={6}
        required
        maxLength={1000}
        placeholder={"e.g.\n20 × white sheet set 100×110\n20 × mattress protector 72×78\n40 × white towel 30×60"}
        error={errors.message}
      />
      {errors.form ? <p className="text-sm text-danger" role="alert">{errors.form}</p> : null}
      <button type="submit" disabled={pending} className="btn-brass w-full disabled:opacity-60" data-track="Get a wholesale quote" data-track-id="send-wholesale">
        <MessageCircle size={15} aria-hidden /> {pending ? "Saving…" : "Get a wholesale quote"}
      </button>
    </form>
  );
}



export function CartView() {
  const cart = useCart();
  const [placed, setPlaced] = useState<{ number: string; url: string; opened: boolean } | null>(null);

  if (placed) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 md:py-24">
        <SentPanel
          title={`Order ${placed.number} is saved`}
          body={
            placed.opened
              ? "WhatsApp has opened in a new tab with your order. Press send there. We will reply with availability, delivery, and the total before you pay."
              : "Press the button to open WhatsApp with your order, then press send. We will reply with availability, delivery, and the total before you pay."
          }
          whatsappUrl={placed.url}
          opened={placed.opened}
        >
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link href={`/orders?number=${encodeURIComponent(placed.number)}`} className="btn-line">
              Track this order
            </Link>
            <Link href="/shop" className="btn-line">
              Keep shopping
            </Link>
          </div>
        </SentPanel>
        <p className="mt-6 text-center text-sm text-muted">Keep the order number {placed.number}. You can look it up any time under Your orders with the phone number you gave.</p>
      </div>
    );
  }

  if (cart.ready && cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center md:py-28">
        <ShoppingBag className="mx-auto text-gold" size={34} aria-hidden />
        <h1 className="gather gold-text mt-5 font-serif text-4xl font-bold md:text-5xl">Your bag is empty</h1>
        <p className="mt-3 font-serif text-lg italic text-muted">Add the sizes you need, then send the order on WhatsApp.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/collections/bedsheets" className="btn-ink">Bedsheets</Link>
          <Link href="/collections/towels" className="btn-line">Towels</Link>
          <Link href="/shop" className="btn-line">Shop all</Link>
        </div>
      </div>
    );
  }

  const pieces = cart.count;
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:py-16">
      <div>
        <span className="crown-rule mb-4" aria-hidden />
        <h1 className="gather gold-text font-serif text-4xl font-bold md:text-5xl">Your bag</h1>
        <p className="mt-2 text-sm text-muted">{pieces} {pieces === 1 ? "piece" : "pieces"} · prices are Crown&apos;s retail prices in LKR</p>
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {cart.lines.map((line) => (
            <li key={line.key} className="flex gap-4 py-6">
              <Link href={`/products/${line.slug}`} className="relative h-28 w-24 shrink-0 overflow-hidden bg-sand" tabIndex={-1} aria-hidden>
                {line.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ProductPlate product={{ title: line.title, material: "", options: [] }} size="thumb" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/products/${line.slug}`} className="font-serif text-lg font-bold leading-snug text-navy hover:text-brass">
                      {line.title}
                    </Link>
                    <p className="label mt-1 text-[9.5px] text-muted">{line.variantTitle}</p>
                  </div>
                  <p className="tabular whitespace-nowrap font-serif font-bold text-navy">{formatMoney(line.unitPrice * line.quantity, cart.currency)}</p>
                </div>
                <p className="tabular mt-1 text-xs text-muted">{formatMoney(line.unitPrice, cart.currency)} each</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  <QuantityStepper value={line.quantity} label={line.title} onChange={(value) => cart.setQuantity(line.key, value)} />
                  <button type="button" className="label inline-flex items-center gap-1.5 text-[9.5px] text-muted hover:text-danger" onClick={() => cart.remove(line.key)}>
                    <Trash2 size={13} aria-hidden /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Link href="/shop" className="label inline-flex items-center gap-2 text-[10px] text-navy hover:text-brass">
            <ArrowRight size={13} className="rotate-180" aria-hidden /> Keep shopping
          </Link>
          <Link href="/wholesale" className="text-sm text-muted underline decoration-gold underline-offset-4 hover:text-navy">
            Buying in bulk? Ask for wholesale prices
          </Link>
        </div>
      </div>
      <div className="lg:sticky lg:top-28 lg:self-start">
        <CheckoutForm onPlaced={setPlaced} />
      </div>
    </div>
  );
}

// A returning customer's details, kept only in their own browser.
const CUSTOMER_KEY = "crown-customer";
const REMEMBERED = ["name", "phone", "address", "city", "email"] as const;

export function CheckoutForm({ onPlaced }: { onPlaced: (order: { number: string; url: string; opened: boolean }) => void }) {
  const form = useRef<HTMLFormElement>(null);

  // Fill the fields from last time (only empty ones, so nothing typed is lost).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || "null") as Record<string, string> | null;
      if (!saved || !form.current) return;
      for (const name of REMEMBERED) {
        const field = form.current.elements.namedItem(name) as HTMLInputElement | null;
        if (field && !field.value && saved[name]) field.value = saved[name];
      }
    } catch {
      // Storage blocked or unreadable: start with an empty form.
    }
  }, []);

  const cart = useCart();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [unavailable, setUnavailable] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [clientToken] = useState(token);

  async function onSubmit(formData: FormData) {
    setErrors({});
    setUnavailable("");
    setFallbackUrl("");
    setPending(true);
    const tab = openPendingTab();
    const { ok, data } = await post("/api/orders", {
      clientToken,
      customerName: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email") || "",
      address: formData.get("address"),
      city: formData.get("city"),
      notes: formData.get("notes") || "",
      sourcePath: "/cart",
      company: formData.get("company") || "",
      items: cart.lines.map((line) => ({ productId: line.productId, variantId: line.variantId, quantity: line.quantity })),
    });
    setPending(false);
    if (!ok || !data.whatsappUrl || !data.orderNumber) {
      // A 503 still hands back a WhatsApp link, so the order can go by hand.
      if (data.whatsappUrl && sendTab(tab, data.whatsappUrl)) setFallbackUrl(data.whatsappUrl);
      else tab?.close();
      if (data.unavailable) setUnavailable(data.unavailable);
      setErrors({ [data.field || "form"]: data.error || "The order did not save. Try again." });
      return;
    }
    try {
      if (formData.get("remember")) localStorage.setItem(CUSTOMER_KEY, JSON.stringify(Object.fromEntries(REMEMBERED.map((name) => [name, String(formData.get(name) || "")]))));
      else localStorage.removeItem(CUSTOMER_KEY);
    } catch {
      // Storage blocked: nothing is remembered.
    }
    const opened = sendTab(tab, data.whatsappUrl);
    cart.clear();
    onPlaced({ number: data.orderNumber, url: data.whatsappUrl, opened });
  }

  return (
    <form ref={form} onSubmit={(event) => { event.preventDefault(); void onSubmit(new FormData(event.currentTarget)); }} className="border border-line bg-white p-6 md:p-8">
      <Honeypot />
      <h2 className="font-serif text-2xl font-bold text-navy">Send your order</h2>
      <p className="mt-1 text-sm leading-6 text-muted">No payment here. We confirm the total on WhatsApp first.</p>
      <div className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" required autoComplete="name" maxLength={80} error={errors.customerName} />
          <Field label="WhatsApp number" name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="07X XXX XXXX" maxLength={32} error={errors.phone} />
        </div>
        <Field label="Delivery address" name="address" required autoComplete="street-address" maxLength={200} error={errors.address} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Town or city" name="city" required autoComplete="address-level2" maxLength={80} error={errors.city} />
          <Field label="Email" name="email" type="email" optional autoComplete="email" maxLength={120} error={errors.email} />
        </div>
        <Field label="Note" name="notes" textarea rows={3} optional maxLength={500} placeholder="Colours you would like, delivery time, collect from the shop…" />
        <label className="flex items-start gap-2.5 text-sm text-muted">
          <input type="checkbox" name="remember" defaultChecked className="mt-1 accent-[var(--color-navy)]" />
          Remember my details on this device for next time
        </label>
      </div>
      <dl className="tabular mt-6 space-y-2 border-t border-line pt-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Items ({cart.count})</dt>
          <dd className="text-navy">{formatMoney(cart.subtotal, cart.currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Delivery</dt>
          <dd className="text-muted">Confirmed on WhatsApp</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-serif text-lg font-bold text-navy">Subtotal</dt>
          <dd className="font-serif text-2xl font-bold text-brass">{formatMoney(cart.subtotal, cart.currency)}</dd>
        </div>
      </dl>
      {errors.form || errors.items ? (
        <div className="mt-4 border border-danger/30 bg-[#fbf1ef] p-3 text-sm text-danger" role="alert">
          {errors.form || errors.items}
          {unavailable ? (
            <button
              type="button"
              className="label mt-2 block text-[10px] underline underline-offset-4"
              onClick={() => {
                const line = cart.lines.find((item) => item.variantId === unavailable);
                if (line) cart.remove(line.key);
                setUnavailable("");
                setErrors({});
              }}
            >
              Remove it from the bag
            </button>
          ) : null}
          {fallbackUrl ? <p className="mt-2 text-muted">WhatsApp has opened so you can send the order by hand.</p> : null}
        </div>
      ) : null}
      <button type="submit" disabled={pending || cart.lines.length === 0} data-track="Order on WhatsApp" data-track-id="order-whatsapp" className="btn-brass mt-6 w-full min-h-[3.4rem] disabled:opacity-60">
        <MessageCircle size={16} aria-hidden /> {pending ? "Saving your order…" : "Send order on WhatsApp"}
      </button>
      <p className="mt-3 text-center text-xs leading-5 text-muted">You will get an order number to track it. Payment is arranged in the chat, never on this site.</p>
    </form>
  );
}
