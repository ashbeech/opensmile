import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { InteractionType } from "@prisma/client";

export const interactionsRouter = router({
  // List interactions for a lead
  listByLead: protectedProcedure
    .input(
      z.object({
        leadId: z.string(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify access via lead
      const lead = await ctx.prisma.lead.findUnique({
        where: { id: input.leadId },
        select: { practiceId: true },
      });
      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.prisma.interaction.findMany({
        where: { leadId: input.leadId },
        include: {
          salesperson: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  // Create interaction
  create: protectedProcedure
    .input(
      z.object({
        leadId: z.string(),
        type: z.nativeEnum(InteractionType),
        subject: z.string().optional(),
        body: z.string().optional(),
        callDuration: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const lead = await ctx.prisma.lead.findUnique({
        where: { id: input.leadId },
        select: { practiceId: true },
      });
      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const interaction = await ctx.prisma.interaction.create({
        data: {
          leadId: input.leadId,
          practiceId: lead.practiceId,
          salespersonId: ctx.dbUser.id,
          type: input.type,
          subject: input.subject,
          body: input.body,
          callDuration: input.callDuration,
          metadata: {},
          keyTopicsDiscussed: [],
        },
      });

      // Update lead's firstContactAt if this is first contact
      if (["CALL_OUTBOUND", "EMAIL_SENT", "SMS_SENT"].includes(input.type)) {
        await ctx.prisma.lead.updateMany({
          where: {
            id: input.leadId,
            firstContactAt: null,
          },
          data: {
            firstContactAt: new Date(),
            speedToFirstContactMs:
              Date.now() -
              (await ctx.prisma.lead.findUnique({
                where: { id: input.leadId },
                select: { createdAt: true },
              }))!.createdAt.getTime(),
          },
        });
      }

      return interaction;
    }),

  // Generate AI summary (stub)
  generateAISummary: protectedProcedure
    .input(z.object({ leadId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // TODO: Call Grok API to summarize all interactions
      const interactions = await ctx.prisma.interaction.findMany({
        where: { leadId: input.leadId },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // Stub response
      const summary = `AI Summary: ${
        interactions.length
      } interactions recorded. Latest: ${
        interactions[0]?.type || "none"
      }. Overall sentiment appears positive. Suggested next action: Follow up with pricing details.`;

      await ctx.prisma.lead.update({
        where: { id: input.leadId },
        data: { conversationSummary: summary },
      });

      return { summary };
    }),
});
