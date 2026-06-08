import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function logout() {
  'use server';
  const session = await getSession();
  session.destroy();
  redirect('/login');
}

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-black">
      <nav className="border-b border-zinc-800 bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/feed" className="text-xl font-bold text-white">
                BepBet
              </Link>
              <div className="flex gap-4">
                <Link
                  href="/feed"
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Feed
                </Link>
                <Link
                  href="/ledger"
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Ledger
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-400">
                {session.user.username}
              </span>
              <form action={logout}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
