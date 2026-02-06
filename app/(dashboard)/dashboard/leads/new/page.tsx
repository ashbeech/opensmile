"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LeadSource } from "@prisma/client";

export default function NewLeadPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const createLead = trpc.leads.create.useMutation({
    onSuccess: (lead) => {
      router.push(`/dashboard/leads/${lead.id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    createLead.mutate({
      practiceId: formData.get("practiceId") as string,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      source: formData.get("source") as LeadSource,
      urgency:
        (formData.get("urgency") as "low" | "medium" | "high") || "medium",
      notes: formData.get("notes") as string,
    });
  }

  return (
    <div className="p-8">
      <Link
        href="/dashboard/leads"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </Link>

      <h1 className="mb-8 text-2xl font-bold text-foreground">
        Create New Lead
      </h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-6 rounded-xl border border-border bg-background p-6"
      >
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-foreground">
              Practice ID
            </label>
            <input
              name="practiceId"
              required
              placeholder="Enter practice UUID"
              className="mt-1 block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              The practice this lead belongs to
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Full Name
            </label>
            <input
              name="name"
              required
              placeholder="John Smith"
              className="mt-1 block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="john@example.com"
              className="mt-1 block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Phone
            </label>
            <input
              name="phone"
              required
              placeholder="+44 7700 900000"
              className="mt-1 block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Source
            </label>
            <select
              name="source"
              required
              className="mt-1 block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
            >
              <option value="MANUAL_ENTRY">Manual Entry</option>
              <option value="FACEBOOK_AD">Facebook Ad</option>
              <option value="INSTAGRAM_AD">Instagram Ad</option>
              <option value="GOOGLE_AD">Google Ad</option>
              <option value="REFERRAL">Referral</option>
              <option value="ORGANIC">Organic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Urgency
            </label>
            <select
              name="urgency"
              className="mt-1 block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">
            Initial Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Any initial notes about this lead..."
            className="mt-1 block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={createLead.isPending}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {createLead.isPending ? "Creating..." : "Create Lead"}
          </button>
          <Link
            href="/dashboard/leads"
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-accent"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
