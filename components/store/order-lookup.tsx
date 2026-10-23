"use client";

import { useId, useState } from "react";
import { Check, MessageCircle, PackageSearch } from "lucide-react";
import { formatMoney, formatWhen } from "@/lib/format";
import { ORDER_FLOW, statusIndex } from "@/lib/order-status";
import type { OrderStatus } from "@/lib/types";

type Found = {
  number: string;
  status: OrderStatus;
  statusLabel: string;
  publicNote: string;
  customerName: string;
  city: string;
  createdAt: string;
  subtotal: number;
  items: { title: string; variantTitle: string; quantity: number; unitPrice: number }[];
  timeline: { id: string; at: string; message: string }[];
};

export function OrderLookup({ currency, initialNumber = "", whatsappHref }: { currency: string; initialNumber?: string; whatsappHref: string }) {
  const [order, setOrder] = useState<Found | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const numberId = useId();
  const phoneId = useId();
  const step = order ? statusIndex(order.status) : -1;

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ number: String(formData.get("number") || "").trim().toUpperCase(), phone: formData.get("phone") }),
      });
      const data = (await response.json().catch(() => ({}))) as { order?: Found; error?: string };
      if (!response.ok || !data.order) {
        setOrder(null);
        setError(data.error || "We could not find that order.");
        return;
      }
      setOrder(data.order);
    } catch {
      setError("You seem to be offline. Check the connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <span className="crown-rule mb-4" aria-hidden />
      <p className="eyebrow">Your orders</p>
      <h1 className="gather gold-text mt-3 font-serif text-4xl font-bold md:text-5xl">Track an order</h1>
      <p className="mt-4 max-w-xl font-serif text-lg italic leading-8 text-muted">Enter the order number from your confirmation (it starts with CHL-) and the phone number you used.</p>
      <form onSubmit={(event) => { event.preventDefault(); void onSubmit(new FormData(event.currentTarget)); }} className="mt-8 grid gap-4 border border-line bg-white p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end md:p-6">
        <div>
          <label htmlFor={numberId} className="field-label">Order number</label>
          <input id={numberId} name="number" required defaultValue={initialNumber} placeholder="CHL-1101" autoCapitalize="characters" className="field uppercase" />
        </div>
        <div>
          <label htmlFor={phoneId} className="field-label">Phone on the order</label>
          <input id={phoneId} name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="07X XXX XXXX" className="field" />
        </div>
        <button className="btn-ink h-[3.1rem]" disabled={pending} data-track="Look up order" data-track-id="order-lookup">
          <PackageSearch size={15} aria-hidden /> {pending ? "Looking…" : "Find order"}
        </button>
      </form>
      {error ? (
        <div className="mt-4 border border-danger/30 bg-[#fbf1ef] p-4 text-sm text-danger" role="alert">
          {error}{" "}
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="text-navy underline underline-offset-4">
            Ask us on WhatsApp
          </a>
          .
        </div>
      ) : null}
      {order ? (
        <article className="rise-in mt-10 border border-line bg-white" aria-live="polite">
          <header className="navy-ground flex flex-wrap items-end justify-between gap-4 p-6">
            <div>
              <p className="eyebrow">Order {order.number}</p>
              <h2 className="gather gold-text-light mt-2 font-serif text-3xl font-bold">{order.status === "cancelled" ? "Cancelled" : order.statusLabel}</h2>
            </div>
            <p className="text-sm text-mist">
              {order.customerName} · {order.city} · {formatWhen(order.createdAt)}
            </p>
          </header>
          <div className="p-6">
            {order.status !== "cancelled" ? (
              <ol className="relative space-y-0">
                {ORDER_FLOW.map((item, index) => {
                  const done = index <= step;
                  const current = index === step;
                  return (
                    <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                      {index < ORDER_FLOW.length - 1 ? <span className={`absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-px ${index < step ? "bg-gold" : "bg-line"}`} aria-hidden /> : null}
                      <span className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-full border ${done ? "border-gold bg-gold text-navy" : "border-line bg-white text-muted"}`} aria-hidden>
                        {done ? <Check size={14} strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-line" />}
                      </span>
                      <div>
                        <p className={`font-serif text-lg font-bold ${done ? "text-navy" : "text-muted"}`}>
                          {item.label}
                          {current ? <span className="label ml-3 align-middle text-[9px] text-brass">Now</span> : null}
                        </p>
                        <p className="text-sm text-muted">{item.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : null}
            {order.publicNote ? <p className="mt-8 border-l-2 border-gold bg-ivory p-4 font-serif text-lg italic leading-7 text-navy">{order.publicNote}</p> : null}
            <h3 className="field-label mt-8">Items</h3>
            <ul className="tabular divide-y divide-line border-y border-line text-sm">
              {order.items.map((item) => (
                <li key={`${item.title}-${item.variantTitle}`} className="flex justify-between gap-4 py-3">
                  <span>
                    {item.quantity} × {item.title} <span className="text-muted">({item.variantTitle})</span>
                  </span>
                  <span className="whitespace-nowrap text-navy">{formatMoney(item.unitPrice * item.quantity, currency)}</span>
                </li>
              ))}
            </ul>
            <p className="tabular mt-3 flex justify-between font-serif text-lg font-bold text-navy">
              <span>Items total</span>
              <span className="text-brass">{formatMoney(order.subtotal, currency)}</span>
            </p>
            {order.timeline.length ? (
              <>
                <h3 className="field-label mt-8">Updates</h3>
                <ul className="space-y-2 text-sm text-muted">
                  {order.timeline.map((entry) => (
                    <li key={entry.id}>
                      <span className="tabular text-navy">{formatWhen(entry.at)}</span> · {entry.message}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn-line mt-8 w-full" data-track-type="whatsapp_click" data-track="WhatsApp order" data-track-id="order-whatsapp-help">
              <MessageCircle size={15} aria-hidden /> Questions about this order? WhatsApp us
            </a>
          </div>
        </article>
      ) : null}
    </div>
  );
}
