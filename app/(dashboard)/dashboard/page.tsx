"use client";

import { trpc } from "@/lib/trpc";
import {
  Users,
  UserPlus,
  Calendar,
  CalendarCheck,
  Building2,
} from "lucide-react";

function MetricCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = trpc.analytics.getDashboardSummary.useQuery();

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[...Array(5)].map((_, i) => (
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your patient acquisition performance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          title="Leads (30d)"
          value={data?.totalLeads30d ?? 0}
          icon={Users}
          description="Total leads this month"
        />
        <MetricCard
          title="New (7d)"
          value={data?.newLeads7d ?? 0}
          icon={UserPlus}
          description="New leads this week"
        />
        <MetricCard
          title="Appointments"
          value={data?.appointmentsThisMonth ?? 0}
          icon={Calendar}
          description="Booked this month"
        />
        <MetricCard
          title="Upcoming"
          value={data?.upcomingAppointments ?? 0}
          icon={CalendarCheck}
          description="Scheduled appointments"
        />
        <MetricCard
          title="Practices"
          value={data?.totalPractices ?? 0}
          icon={Building2}
          description="Active practices"
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <a
            href="/dashboard/leads"
            className="rounded-xl border border-border bg-background p-4 transition-shadow hover:shadow-md"
          >
            <Users className="h-8 w-8 text-primary" />
            <h3 className="mt-3 font-semibold">Manage Leads</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              View and manage your lead pipeline
            </p>
          </a>
          <a
            href="/dashboard/appointments"
            className="rounded-xl border border-border bg-background p-4 transition-shadow hover:shadow-md"
          >
            <Calendar className="h-8 w-8 text-primary" />
            <h3 className="mt-3 font-semibold">Appointments</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              View upcoming consultations
            </p>
          </a>
          <a
            href="/dashboard/analytics"
            className="rounded-xl border border-border bg-background p-4 transition-shadow hover:shadow-md"
          >
            <BarChart3 className="h-8 w-8 text-primary" />
            <h3 className="mt-3 font-semibold">Analytics</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Track conversion performance
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
