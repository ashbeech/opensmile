"use client";

import { trpc } from "@/lib/trpc";
import { getStatusColor, formatDateTime, formatCurrency } from "@/lib/utils";
import { Calendar } from "lucide-react";

export default function AppointmentsPage() {
  const { data: appointments, isLoading } = trpc.appointments.list.useQuery({});

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
        <p className="text-muted-foreground">
          Manage booked consultations and track outcomes
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date & Time
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Patient
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Practice
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Treatment
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Booked By
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-6 py-4">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : !appointments || appointments.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                  <p>No appointments found.</p>
                </td>
              </tr>
            ) : (
              appointments.map((apt) => (
                <tr
                  key={apt.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-6 py-4 text-sm font-medium">
                    {formatDateTime(apt.dateTime)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {apt.lead?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {apt.practice?.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {apt.treatmentType?.name}
                    {apt.treatmentType?.averagePrice && (
                      <span className="ml-2 text-xs">
                        ({formatCurrency(apt.treatmentType.averagePrice)})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {apt.bookedBy?.fullName}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
