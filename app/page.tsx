import Link from 'next/link';

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">AWS AccessBridge</p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight">Cloudflare foundation and AWS account setup</h1>
        <p className="mb-8 max-w-2xl text-lg leading-8 text-gray-300">
          Week 1 establishes the Worker shell, D1/KV/secrets wiring, Cloudflare Access authentication, HMAC validation, encrypted credential
          storage, and the first half of the admin onboarding flow.
        </p>
        <Link
          href="/admin"
          className="inline-flex w-fit rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Open admin setup
        </Link>
      </section>
    </main>
  );
}
