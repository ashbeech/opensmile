import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  LeadSource,
  LeadStatus,
  LostReason,
  InteractionType,
} from "@prisma/client";
import { RATE_LIMITS } from "@/lib/server/rateLimit";

export const leadsRouter = router({
  // List leads with access control
  list: protectedProcedure
    .input(
      z.object({
        practiceId: z.string().optional(),
        status: z.nativeEnum(LeadStatus).optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      // Rate limit
      if (!RATE_LIMITS.leadSearch(ctx.dbUser.id)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded. Try again later.",
        });
      }

      const { role, id: userId, practiceId: userPracticeId } = ctx.dbUser;

      // Build where clause based on role
      let practiceFilter: { practiceId?: string | { in: string[] } } = {};

      if (role === "ADMIN") {
        // Admins see all, optionally filtered
        if (input.practiceId) {
          practiceFilter = { practiceId: input.practiceId };
        }
      } else if (role === "SALESPERSON") {
        // Get assigned practices
        const practices = await ctx.prisma.dentalPractice.findMany({
          where: { assignedSalespersonId: userId },
          select: { id: true },
        });
        const practiceIds = practices.map((p) => p.id);
        practiceFilter = { practiceId: { in: practiceIds } };
      } else if (
        (role === "PRACTICE_OWNER" || role === "PRACTICE_STAFF") &&
        userPracticeId
      ) {
        practiceFilter = { practiceId: userPracticeId };
      } else {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const where = {
        ...practiceFilter,
        ...(input.status && { status: input.status }),
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" as const } },
            { email: { contains: input.search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [leads, total] = await Promise.all([
        ctx.prisma.lead.findMany({
          where,
          include: {
            practice: { select: { id: true, name: true } },
            assignedSalesperson: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.prisma.lead.count({ where }),
      ]);

      return { leads, total, page: input.page, limit: input.limit };
    }),

  // Get single lead by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const lead = await ctx.prisma.lead.findUnique({
        where: { id: input.id },
        include: {
          practice: { select: { id: true, name: true } },
          assignedSalesperson: { select: { id: true, fullName: true } },
          interactions: {
            orderBy: { createdAt: "desc" },
            take: 20,
            include: {
              salesperson: { select: { id: true, fullName: true } },
            },
          },
          appointments: {
            orderBy: { dateTime: "desc" },
            include: {
              treatmentType: { select: { name: true } },
            },
          },
          attribution: true,
        },
      });

      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      }

      // Access control
      const { role, id: userId, practiceId: userPracticeId } = ctx.dbUser;

      if (role === "ADMIN") {
        // OK
      } else if (role === "SALESPERSON") {
        const practice = await ctx.prisma.dentalPractice.findFirst({
          where: {
            id: lead.practiceId,
            assignedSalespersonId: userId,
          },
        });
        if (!practice) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
      } else if (
        (role === "PRACTICE_OWNER" || role === "PRACTICE_STAFF") &&
        userPracticeId
      ) {
        if (lead.practiceId !== userPracticeId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
      } else {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return lead;
    }),

  // Create lead
  create: protectedProcedure
    .input(
      z.object({
        practiceId: z.string(),
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(10),
        source: z.nativeEnum(LeadSource),
        interestedTreatments: z.array(z.string()).default([]),
        urgency: z.enum(["low", "medium", "high"]).default("medium"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { role, id: userId } = ctx.dbUser;

      // Only ADMIN and SALESPERSON can create leads
      if (role !== "ADMIN" && role !== "SALESPERSON") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Verify practice access
      if (role === "SALESPERSON") {
        const practice = await ctx.prisma.dentalPractice.findFirst({
          where: {
            id: input.practiceId,
            assignedSalespersonId: userId,
          },
        });
        if (!practice) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
      }

      // Normalize email
      const normalizedEmail = input.email.toLowerCase().trim();

      // Create lead
      const lead = await ctx.prisma.lead.create({
        data: {
          practiceId: input.practiceId,
          name: input.name.trim(),
          email: normalizedEmail,
          phone: input.phone.trim(),
          source: input.source,
          status: "NEW",
          interestedTreatments: input.interestedTreatments,
          urgency: input.urgency,
          assignedSalespersonId: userId,
          painPoints: [],
          motivations: [],
          objections: [],
        },
      });

      // Create initial interaction log
      if (input.notes) {
        await ctx.prisma.interaction.create({
          data: {
            leadId: lead.id,
            practiceId: input.practiceId,
            salespersonId: userId,
            type: "NOTE",
            body: input.notes,
            metadata: {},
          },
        });
      }

      return lead;
    }),

  // Change status
  changeStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        newStatus: z.nativeEnum(LeadStatus),
        notes: z.string().optional(),
        lostReason: z.nativeEnum(LostReason).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const lead = await ctx.prisma.lead.findUnique({
        where: { id: input.id },
      });
      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const oldStatus = lead.status;

      // Build update data
      const updateData: Record<string, unknown> = {
        status: input.newStatus,
      };

      // Track lifecycle timestamps
      if (input.newStatus === "CONTACTED" && !lead.firstContactAt) {
        updateData.firstContactAt = new Date();
        updateData.speedToFirstContactMs =
          Date.now() - lead.createdAt.getTime();
      }
      if (input.newStatus === "QUALIFIED" && !lead.qualifiedAt) {
        updateData.qualifiedAt = new Date();
      }
      if (
        input.newStatus === "APPOINTMENT_BOOKED" &&
        !lead.appointmentBookedAt
      ) {
        updateData.appointmentBookedAt = new Date();
      }
      if (input.newStatus === "LOST") {
        updateData.lostAt = new Date();
        if (input.lostReason) {
          updateData.lostReason = input.lostReason;
        }
      }
      if (input.newStatus === "NEW" && lead.status === "ENQUIRY") {
        updateData.promotedToLeadAt = new Date();
      }

      const updated = await ctx.prisma.lead.update({
        where: { id: input.id },
        data: updateData,
      });

      // Create interaction log for status change
      await ctx.prisma.interaction.create({
        data: {
          leadId: input.id,
          practiceId: lead.practiceId,
          salespersonId: ctx.dbUser.id,
          type: "STATUS_CHANGE",
          body: `Status changed from ${oldStatus} to ${input.newStatus}${
            input.notes ? `: ${input.notes}` : ""
          }`,
          metadata: {
            oldStatus,
            newStatus: input.newStatus,
          },
        },
      });

      return updated;
    }),

  // Update lead
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        urgency: z.enum(["low", "medium", "high"]).optional(),
        interestedTreatments: z.array(z.string()).optional(),
        estimatedBudget: z.number().optional(),
        recordingConsent: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      // Add consent tracking
      const updateData: Record<string, unknown> = { ...data };
      if (data.email) {
        updateData.email = data.email.toLowerCase().trim();
      }
      if (data.recordingConsent !== undefined) {
        updateData.recordingConsentDate = data.recordingConsent
          ? new Date()
          : null;
      }

      return ctx.prisma.lead.update({
        where: { id },
        data: updateData,
      });
    }),
});
