"use client";

import { BrainCircuit } from "lucide-react";

export default function AIInsightsPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">AI Insights</h1>
        <p className="text-muted-foreground">
          AI-powered analysis and recommendations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* AI Status */}
        <div className="rounded-xl border border-border bg-background p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BrainCircuit className="h-5 w-5 text-primary" />
            AI Engine Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Grok API</span>
              <span className="badge bg-yellow-100 text-yellow-800">
                Stubbed
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                OpenAI Whisper
              </span>
              <span className="badge bg-yellow-100 text-yellow-800">
                Stubbed
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Sentiment Analysis
              </span>
              <span className="badge bg-yellow-100 text-yellow-800">
                Stubbed
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Next Best Action
              </span>
              <span className="badge bg-green-100 text-green-800">
                Mock Active
              </span>
            </div>
          </div>
        </div>

        {/* AI Capabilities */}
        <div className="rounded-xl border border-border bg-background p-6">
          <h2 className="mb-4 text-lg font-semibold">Phase Roadmap</h2>
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
              <p className="text-sm font-semibold text-green-800 dark:text-green-400">
                Phase 1: Context Gathering (Current)
              </p>
              <p className="mt-1 text-xs text-green-700 dark:text-green-500">
                Every interaction is logged for AI training. Call transcripts,
                notes, status changes, and outcomes are captured.
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-400">
                Phase 2: AI Assistant (Next)
              </p>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-500">
                Next best action recommendations, script suggestions, objection
                handling, and sentiment analysis.
              </p>
            </div>
            <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
              <p className="text-sm font-semibold text-purple-800 dark:text-purple-400">
                Phase 3: Full Automation (Future)
              </p>
              <p className="mt-1 text-xs text-purple-700 dark:text-purple-500">
                AI-powered outbound calls, real-time transcription, appointment
                booking, and automated follow-ups.
              </p>
            </div>
          </div>
        </div>

        {/* Training Data Stats */}
        <div className="col-span-2 rounded-xl border border-border bg-background p-6">
          <h2 className="mb-4 text-lg font-semibold">
            Training Data Collection
          </h2>
          <p className="text-sm text-muted-foreground">
            The system captures interaction context for future AI training. Each
            call, email, SMS, and note creates an AI-ready record with:
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              "Call Transcripts",
              "Sentiment Scores",
              "Objection Patterns",
              "Conversion Tactics",
              "Lead Profiles",
              "Status Transitions",
              "Time-in-Pipeline",
              "Outcome Tracking",
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg bg-muted px-3 py-2 text-center text-sm font-medium"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
