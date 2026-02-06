import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { RATE_LIMITS } from "@/lib/server/rateLimit";
import { TRPCError } from "@trpc/server";

export const aiRouter = router({
  // Get next best action for a lead (stub)
  getNextBestAction: protectedProcedure
    .input(z.object({ leadId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Rate limit AI calls
      if (!RATE_LIMITS.aiContext(ctx.dbUser.id)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "AI rate limit exceeded. Try again later.",
        });
      }

      const lead = await ctx.prisma.lead.findUnique({
        where: { id: input.leadId },
        include: {
          interactions: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // TODO: Call Grok API with lead context
      // For now, return mock recommendations based on lead state
      const recommendations: Record<
        string,
        { action: string; reasoning: string; suggestedScript: string }
      > = {
        ENQUIRY: {
          action: "CALL_OUTBOUND",
          reasoning: "New enquiry - speed to lead is critical",
          suggestedScript:
            "Hi [name], thanks for your interest in [treatment]. I'd love to help you understand your options...",
        },
        NEW: {
          action: "CALL_OUTBOUND",
          reasoning: "Qualified lead, needs first contact",
          suggestedScript:
            "Hi [name], I noticed you're interested in [treatment]. Many of our patients start with a free consultation...",
        },
        CONTACTED: {
          action: "EMAIL_SENT",
          reasoning: "Already spoken, send follow-up with details",
          suggestedScript:
            "Great speaking with you! As discussed, here's more information about [treatment] pricing and process...",
        },
        QUALIFIED: {
          action: "CALL_OUTBOUND",
          reasoning: "Qualified and engaged - push for appointment",
          suggestedScript:
            "I have availability this week for your consultation. Shall we get you booked in?",
        },
        NURTURING: {
          action: "SMS_SENT",
          reasoning: "Keep warm with gentle check-in",
          suggestedScript:
            "Hi [name], just checking in! We have a special offer on [treatment] this month. Would you like to chat?",
        },
      };

      const rec = recommendations[lead.status] || {
        action: "NOTE",
        reasoning: "Review lead status and plan next steps",
        suggestedScript: "",
      };

      return {
        ...rec,
        confidence: 0.85,
        leadStatus: lead.status,
        interactionCount: lead.interactions.length,
      };
    }),

  // Analyze sentiment (stub)
  analyzeSentiment: protectedProcedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ ctx }) => {
      if (!RATE_LIMITS.aiContext(ctx.dbUser.id)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
        });
      }
      // TODO: Grok sentiment analysis
      return { score: 0.5, confidence: 0.9 };
    }),
});
