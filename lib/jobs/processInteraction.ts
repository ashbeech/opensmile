import { prisma } from "@/lib/prisma";
import { generateTranscript } from "@/lib/ai/transcription";
import { analyzeInteraction } from "@/lib/ai/analysis";
import { safeLog } from "@/lib/server/safeLog";

/**
 * Background job: Process an interaction for AI analysis
 * Called after new interactions are created.
 */
export async function processInteraction(interactionId: string) {
  const interaction = await prisma.interaction.findUnique({
    where: { id: interactionId },
    include: { lead: true },
  });

  if (!interaction) {
    safeLog("processInteraction:not_found", { id: interactionId });
    return;
  }

  // If it's a call with recording but no transcript
  if (interaction.callRecordingUrl && !interaction.callTranscript) {
    const transcript = await generateTranscript(interaction.callRecordingUrl);

    await prisma.interaction.update({
      where: { id: interactionId },
      data: { callTranscript: transcript },
    });
  }

  // Analyze the interaction
  const analysis = await analyzeInteraction(
    interaction.callTranscript || interaction.body || ""
  );

  // Update interaction with AI insights
  await prisma.interaction.update({
    where: { id: interactionId },
    data: {
      aiSummary: analysis.summary,
      sentimentScore: analysis.sentiment,
      keyTopicsDiscussed: analysis.keyTopics,
      nextBestAction: analysis.nextBestAction,
    },
  });

  // Update lead with extracted context
  if (analysis.objections.length > 0 || analysis.motivations.length > 0) {
    const lead = await prisma.lead.findUnique({
      where: { id: interaction.leadId },
      select: { objections: true, motivations: true },
    });

    if (lead) {
      await prisma.lead.update({
        where: { id: interaction.leadId },
        data: {
          objections: [
            ...new Set([...lead.objections, ...analysis.objections]),
          ],
          motivations: [
            ...new Set([...lead.motivations, ...analysis.motivations]),
          ],
        },
      });
    }
  }

  safeLog("processInteraction:complete", {
    id: interactionId,
    type: interaction.type,
  });
}

/**
 * Background job: Enforce data retention (GDPR)
 * Run daily via cron to delete recordings older than 90 days
 */
export async function enforceDataRetention() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const expiredInteractions = await prisma.interaction.findMany({
    where: {
      callRecordingUrl: { not: null },
      createdAt: { lt: ninetyDaysAgo },
    },
    select: { id: true, callRecordingUrl: true },
  });

  for (const interaction of expiredInteractions) {
    // In production: also delete from Supabase Storage
    // using canonical path: {practiceId}/{leadId}/{interactionId}
    await prisma.interaction.update({
      where: { id: interaction.id },
      data: { callRecordingUrl: null },
    });
  }

  safeLog("dataRetention:complete", {
    count: expiredInteractions.length,
  });
}
