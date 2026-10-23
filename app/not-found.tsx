import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-start justify-center px-6 py-20">
      <span className="crown-rule mb-4" aria-hidden />
      <p className="eyebrow">Page not found</p>
      <h1 className="gather gold-text mt-3 font-serif text-5xl font-bold">This page is not here</h1>
      <p className="mt-4 text-muted">The link may be old. Crown&apos;s bedsheets, towels, pillows, and duvets are all in the shop.</p>
      <Link href="/shop" className="btn-ink mt-8">
        Go to the shop
      </Link>
    </div>
  );
}
