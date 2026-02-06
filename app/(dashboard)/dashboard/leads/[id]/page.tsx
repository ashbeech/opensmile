"use client";

import { use, useState } from "react";
import { trpc } from "@/lib/trpc";
import { getStatusColor, formatDate, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  BrainCircuit,
  Clock,
} from "lucide-react";
import { InteractionType } from "@prisma/client";

const interactionIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  CALL_OUTBOUND: Phone,
  CALL_INBOUND: Phone,
  EMAIL_SENT: Mail,
  EMAIL_RECEIVED: Mail,
  SMS_SENT: MessageSquare,
  SMS_RECEIVED: MessageSquare,
  NOTE: MessageSquare,
  STATUS_CHANGE: Clock,
  APPOINTMENT_CREATED: Calendar,
  APPOINTMENT_MODIFIED: Calendar,
};

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [noteText, setNoteText] = useState("");

  const { data: lead, isLoading } = trpc.leads.getById.useQuery({ id });
  const { data: aiInsight } = trpc.ai.getNextBestAction.useQuery(
    { leadId: id },
    { enabled: !!lead }
  );

  const utils = trpc.useUtils();
  const createInteraction = trpc.interactions.create.useMutation({
    onSuccess: () => {
      utils.leads.getById.invalidate({ id });
      setNoteText("");
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Lead not found.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Back Button */}
      <Link
        href="/dashboard/leads"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{lead.name}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span>{lead.email}</span>
            <span>{lead.phone}</span>
            <span className={`badge ${getStatusColor(lead.status)}`}>
              {lead.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              createInteraction.mutate({
                leadId: id,
                type: "CALL_OUTBOUND" as InteractionType,
                body: "Call initiated",
              })
            }
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Phone className="h-4 w-4" />
            Log Call
          </button>
          <button
            onClick={() =>
              createInteraction.mutate({
                leadId: id,
                type: "EMAIL_SENT" as InteractionType,
                body: "Email sent",
              })
            }
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Mail className="h-4 w-4" />
            Log Email
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Lead Info Card */}
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="mb-4 text-lg font-semibold">Lead Information</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Practice</dt>
                <dd className="font-medium">{lead.practice?.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Source</dt>
                <dd className="font-medium">
                  {lead.source.replace(/_/g, " ")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Urgency</dt>
                <dd className="font-medium capitalize">{lead.urgency}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Assigned To</dt>
                <dd className="font-medium">
                  {lead.assignedSalesperson?.fullName}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="font-medium">{formatDate(lead.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">First Contact</dt>
                <dd className="font-medium">
                  {lead.firstContactAt
                    ? formatDateTime(lead.firstContactAt)
                    : "Not yet"}
                </dd>
              </div>
              {lead.interestedTreatments.length > 0 && (
                <div className="col-span-2">
                  <dt className="text-muted-foreground">
                    Interested Treatments
                  </dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {lead.interestedTreatments.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {t}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Add Note */}
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="mb-4 text-lg font-semibold">Add Note</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (noteText.trim()) {
                  createInteraction.mutate({
                    leadId: id,
                    type: "NOTE" as InteractionType,
                    body: noteText,
                  });
                }
              }}
            >
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note about this lead..."
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
              <button
                type="submit"
                disabled={!noteText.trim() || createInteraction.isPending}
                className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {createInteraction.isPending ? "Saving..." : "Save Note"}
              </button>
            </form>
          </div>

          {/* Interaction Timeline */}
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="mb-4 text-lg font-semibold">Interaction Timeline</h2>
            <div className="space-y-4">
              {lead.interactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No interactions yet.
                </p>
              ) : (
                lead.interactions.map((interaction) => {
                  const IconComponent =
                    interactionIcons[interaction.type] || MessageSquare;
                  return (
                    <div
                      key={interaction.id}
                      className="flex gap-4 border-l-2 border-border pl-4"
                    >
                      <div className="mt-1 rounded-lg bg-muted p-2">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {interaction.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(interaction.createdAt)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            by {interaction.salesperson?.fullName}
                          </span>
                        </div>
                        {interaction.body && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {interaction.body}
                          </p>
                        )}
                        {interaction.aiSummary && (
                          <div className="mt-2 rounded-lg bg-primary/5 p-3">
                            <p className="text-xs font-medium text-primary">
                              AI Summary
                            </p>
                            <p className="mt-1 text-sm">
                              {interaction.aiSummary}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column - AI Insights & Appointments */}
        <div className="space-y-6">
          {/* AI Insights */}
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <BrainCircuit className="h-5 w-5 text-primary" />
              AI Insights
            </h2>
            {aiInsight ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Suggested Action
                  </p>
                  <p className="text-sm font-semibold">
                    {aiInsight.action.replace(/_/g, " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Reasoning
                  </p>
                  <p className="text-sm">{aiInsight.reasoning}</p>
                </div>
                {aiInsight.suggestedScript && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Suggested Script
                    </p>
                    <p className="mt-1 rounded-lg bg-muted p-3 text-sm italic">
                      {aiInsight.suggestedScript}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${(aiInsight.confidence || 0) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round((aiInsight.confidence || 0) * 100)}% confidence
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Loading AI insights...
              </p>
            )}
          </div>

          {/* Context */}
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="mb-4 text-lg font-semibold">Context</h2>
            <div className="space-y-3">
              {lead.painPoints.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Pain Points
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {lead.painPoints.map((p, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {lead.motivations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Motivations
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {lead.motivations.map((m, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {lead.objections.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Objections
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {lead.objections.map((o, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                      >
                        {o}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {lead.conversationSummary && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    AI Summary
                  </p>
                  <p className="mt-1 text-sm">{lead.conversationSummary}</p>
                </div>
              )}
            </div>
          </div>

          {/* Appointments */}
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="mb-4 text-lg font-semibold">Appointments</h2>
            {lead.appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No appointments yet.
              </p>
            ) : (
              <div className="space-y-3">
                {lead.appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {apt.treatmentType?.name}
                      </span>
                      <span className={`badge ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(apt.dateTime)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
