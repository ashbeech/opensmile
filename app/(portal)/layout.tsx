import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Portal Header */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
          <Link href="/portal/dashboard" className="text-xl font-bold">
            Open<span className="text-primary">Smile</span>
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              Practice Portal
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/portal/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-8 py-8">{children}</main>
    </div>
  );
}
