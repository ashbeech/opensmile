"use client";

import { trpc } from "@/lib/trpc";
import { Users, Calendar, TrendingUp, Building2 } from "lucide-react";

export default function PortalDashboardPage() {
  const { data: summary, isLoading } =
    trpc.analytics.getDashboardSummary.useQuery();

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Practice Dashboard</h1>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-border bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Practice Dashboard
        </h1>
        <p className="text-muted-foreground">
          Read-only overview of your patient acquisition performance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-background p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Leads (30d)</p>
              <p className="text-2xl font-bold">
                {summary?.totalLeads30d ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/20">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">New (7d)</p>
              <p className="text-2xl font-bold">{summary?.newLeads7d ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/20">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Appointments</p>
              <p className="text-2xl font-bold">
                {summary?.appointmentsThisMonth ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/20">
              <Building2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-bold">
                {summary?.upcomingAppointments ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-background p-6">
        <h2 className="mb-4 text-lg font-semibold">About This Portal</h2>
        <p className="text-sm text-muted-foreground">
          This is a read-only view of your practice&apos;s patient acquisition
          performance. The OpenSmile team manages your leads and appointments.
          Contact your assigned salesperson for any changes or questions.
        </p>
      </div>
    </div>
  );
}
