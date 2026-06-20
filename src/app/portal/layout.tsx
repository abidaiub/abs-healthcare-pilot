import Link from "next/link";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
              ABSHealthcareLite Patient Portal
            </p>
            <p className="text-sm text-slate-500">Al Baraka Medical Group</p>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-teal-700 hover:text-teal-800"
          >
            Staff login
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
