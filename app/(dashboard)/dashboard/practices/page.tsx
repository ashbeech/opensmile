"use client";

import { Building2 } from "lucide-react";

export default function PracticesPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Practices</h1>
        <p className="text-muted-foreground">
          Manage dental practices and their configurations
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-background p-16">
        <Building2 className="mb-4 h-16 w-16 text-muted-foreground/50" />
        <h2 className="text-lg font-semibold text-foreground">
          Practice Management
        </h2>
        <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
          Practice management features are available after connecting to
          Supabase. Use the seed script to create demo practices, then manage
          them here.
        </p>
      </div>
    </div>
  );
}
