import { useEffect, useState } from 'react';

type UserInfo = {
  email?: string;
  isSuperAdmin?: boolean;
};

export default function SpaApp() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          setUser((await response.json()) as UserInfo);
        }
      } finally {
        setAuthChecked(true);
      }
    };

    void loadUser();
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">AWS AccessBridge</p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight">Cloudflare foundation and AWS account setup</h1>
        <p className="mb-8 max-w-2xl text-lg leading-8 text-gray-300">
          Week 1 establishes the Worker shell, D1/KV/secrets wiring, Zero Trust authentication, HMAC validation, encrypted credential
          storage, and the first half of the onboarding wizard.
        </p>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-sm text-gray-400">Current user</p>
          <p className="mt-1 text-lg font-semibold">{authChecked ? user?.email || 'Not signed in' : 'Checking authentication...'}</p>
          {user?.isSuperAdmin && <p className="mt-2 text-sm text-yellow-300">Superadmin access detected</p>}
        </div>
      </section>
    </main>
  );
}
