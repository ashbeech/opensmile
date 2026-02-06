"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Phone,
  Mail,
} from "lucide-react";

function MetricCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [practiceId] = useState<string>("");

  // Default to last 30 days
  const endDate = new Date().toISOString();
  const startDate = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: funnel, isLoading: funnelLoading } =
    trpc.analytics.getFunnelData.useQuery({
      practiceId: practiceId || undefined,
      startDate,
      endDate,
    });

  const { data: summary } = trpc.analytics.getDashboardSummary.useQuery();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">
          Track conversion performance and ROI
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Total Leads"
          value={summary?.totalLeads30d ?? 0}
          icon={Users}
          subtitle="Last 30 days"
        />
        <MetricCard
          title="New This Week"
          value={summary?.newLeads7d ?? 0}
          icon={TrendingUp}
          subtitle="Last 7 days"
        />
        <MetricCard
          title="Appointments"
          value={summary?.appointmentsThisMonth ?? 0}
          icon={Target}
          subtitle="This month"
        />
        <MetricCard
          title="Upcoming"
          value={summary?.upcomingAppointments ?? 0}
          icon={Phone}
          subtitle="Scheduled"
        />
        <MetricCard
          title="Practices"
          value={summary?.totalPractices ?? 0}
          icon={DollarSign}
          subtitle="Active"
        />
        <MetricCard
          title="Pipeline"
          value={summary?.totalLeads30d ?? 0}
          icon={Mail}
          subtitle="In funnel"
        />
      </div>

      {/* Conversion Funnel */}
      <div className="rounded-xl border border-border bg-background p-6">
        <h2 className="mb-6 text-lg font-semibold">Conversion Funnel</h2>
        {funnelLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : funnel && funnel.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={funnel}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="stage" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                }}
              />
              <Bar
                dataKey="count"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">
              No data available for the selected period.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
