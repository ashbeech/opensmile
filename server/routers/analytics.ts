import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { LeadStatus } from "@prisma/client";

export const analyticsRouter = router({
  // Practice metrics
  getPracticeMetrics: protectedProcedure
    .input(
      z.object({
        practiceId: z.string(),
        startDate: z.string().transform((s) => new Date(s)),
        endDate: z.string().transform((s) => new Date(s)),
      })
    )
    .query(async ({ input, ctx }) => {
      const { practiceId, startDate, endDate } = input;

      const dateFilter = {
        createdAt: { gte: startDate, lte: endDate },
      };

      // Statuses that indicate "contacted or beyond"
      const contactedStatuses: LeadStatus[] = [
        "CONTACTED",
        "QUALIFIED",
        "NURTURING",
        "APPOINTMENT_BOOKED",
        "CONSULTATION_COMPLETED",
        "TREATMENT_STARTED",
      ];
      const qualifiedStatuses: LeadStatus[] = [
        "QUALIFIED",
        "NURTURING",
        "APPOINTMENT_BOOKED",
        "CONSULTATION_COMPLETED",
        "TREATMENT_STARTED",
      ];
      const bookedStatuses: LeadStatus[] = [
        "APPOINTMENT_BOOKED",
        "CONSULTATION_COMPLETED",
        "TREATMENT_STARTED",
      ];
      const completedStatuses: LeadStatus[] = [
        "CONSULTATION_COMPLETED",
        "TREATMENT_STARTED",
      ];

      const [
        totalLeads,
        newLeads,
        contacted,
        qualified,
        appointmentsBooked,
        consultationsCompleted,
        treatmentsStarted,
        lostLeads,
        totalCalls,
        totalEmails,
        totalSMS,
        campaigns,
        appointments,
      ] = await Promise.all([
        ctx.prisma.lead.count({
          where: { practiceId, ...dateFilter },
        }),
        ctx.prisma.lead.count({
          where: {
            practiceId,
            ...dateFilter,
            status: { in: ["ENQUIRY", "NEW"] },
          },
        }),
        ctx.prisma.lead.count({
          where: {
            practiceId,
            ...dateFilter,
            status: { in: contactedStatuses },
          },
        }),
        ctx.prisma.lead.count({
          where: {
            practiceId,
            ...dateFilter,
            status: { in: qualifiedStatuses },
          },
        }),
        ctx.prisma.lead.count({
          where: {
            practiceId,
            ...dateFilter,
            status: { in: bookedStatuses },
          },
        }),
        ctx.prisma.lead.count({
          where: {
            practiceId,
            ...dateFilter,
            status: { in: completedStatuses },
          },
        }),
        ctx.prisma.lead.count({
          where: {
            practiceId,
            ...dateFilter,
            status: "TREATMENT_STARTED",
          },
        }),
        ctx.prisma.lead.count({
          where: {
            practiceId,
            ...dateFilter,
            status: "LOST",
          },
        }),
        ctx.prisma.interaction.count({
          where: {
            practiceId,
            ...dateFilter,
            type: { in: ["CALL_OUTBOUND", "CALL_INBOUND"] },
          },
        }),
        ctx.prisma.interaction.count({
          where: {
            practiceId,
            ...dateFilter,
            type: { in: ["EMAIL_SENT", "EMAIL_RECEIVED"] },
          },
        }),
        ctx.prisma.interaction.count({
          where: {
            practiceId,
            ...dateFilter,
            type: { in: ["SMS_SENT", "SMS_RECEIVED"] },
          },
        }),
        ctx.prisma.campaign.findMany({
          where: { practiceId },
          select: { spend: true },
        }),
        ctx.prisma.appointment.findMany({
          where: {
            practiceId,
            ...dateFilter,
            convertedToTreatment: true,
          },
          select: { estimatedTreatmentValue: true },
        }),
      ]);

      const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
      const totalRevenue = appointments.reduce(
        (sum, a) => sum + (a.estimatedTreatmentValue || 0),
        0
      );

      return {
        totalLeads,
        newLeads,
        contacted,
        qualified,
        appointmentsBooked,
        consultationsCompleted,
        treatmentsStarted,
        lostLeads,
        // Rates (avoid division by zero)
        contactRate: totalLeads > 0 ? contacted / totalLeads : 0,
        qualificationRate: contacted > 0 ? qualified / contacted : 0,
        bookingRate: qualified > 0 ? appointmentsBooked / qualified : 0,
        showRate:
          appointmentsBooked > 0
            ? consultationsCompleted / appointmentsBooked
            : 0,
        conversionRate:
          consultationsCompleted > 0
            ? treatmentsStarted / consultationsCompleted
            : 0,
        // Financial
        totalSpend,
        totalRevenue,
        roi: totalSpend > 0 ? totalRevenue / totalSpend : 0,
        costPerLead: totalLeads > 0 ? totalSpend / totalLeads : 0,
        costPerAppointment:
          appointmentsBooked > 0 ? totalSpend / appointmentsBooked : 0,
        // Activity
        totalCalls,
        totalEmails,
        totalSMS,
      };
    }),

  // Funnel data
  getFunnelData: protectedProcedure
    .input(
      z.object({
        practiceId: z.string().optional(),
        startDate: z.string().transform((s) => new Date(s)),
        endDate: z.string().transform((s) => new Date(s)),
      })
    )
    .query(async ({ input, ctx }) => {
      const { role, id: userId, practiceId: userPracticeId } = ctx.dbUser;
      let practiceFilter: Record<string, unknown> = {};

      if (input.practiceId) {
        practiceFilter = { practiceId: input.practiceId };
      } else if (role === "SALESPERSON") {
        const practices = await ctx.prisma.dentalPractice.findMany({
          where: { assignedSalespersonId: userId },
          select: { id: true },
        });
        practiceFilter = {
          practiceId: { in: practices.map((p) => p.id) },
        };
      } else if (
        (role === "PRACTICE_OWNER" || role === "PRACTICE_STAFF") &&
        userPracticeId
      ) {
        practiceFilter = { practiceId: userPracticeId };
      }

      const dateFilter = {
        createdAt: { gte: input.startDate, lte: input.endDate },
      };

      const stages = [
        { name: "Enquiry", statuses: ["ENQUIRY"] },
        { name: "New", statuses: ["NEW"] },
        { name: "Contacted", statuses: ["CONTACTED"] },
        { name: "Qualified", statuses: ["QUALIFIED"] },
        { name: "Booked", statuses: ["APPOINTMENT_BOOKED"] },
        { name: "Completed", statuses: ["CONSULTATION_COMPLETED"] },
        { name: "Converted", statuses: ["TREATMENT_STARTED"] },
      ];

      const counts = await Promise.all(
        stages.map((stage) =>
          ctx.prisma.lead.count({
            where: {
              ...practiceFilter,
              ...dateFilter,
              status: { in: stage.statuses as LeadStatus[] },
            },
          })
        )
      );

      return stages.map((stage, i) => ({
        stage: stage.name,
        count: counts[i],
      }));
    }),

  // Dashboard summary
  getDashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    const { role, id: userId, practiceId: userPracticeId } = ctx.dbUser;

    let practiceFilter: Record<string, unknown> = {};

    if (role === "SALESPERSON") {
      const practices = await ctx.prisma.dentalPractice.findMany({
        where: { assignedSalespersonId: userId },
        select: { id: true },
      });
      practiceFilter = {
        practiceId: { in: practices.map((p) => p.id) },
      };
    } else if (
      (role === "PRACTICE_OWNER" || role === "PRACTICE_STAFF") &&
      userPracticeId
    ) {
      practiceFilter = { practiceId: userPracticeId };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalLeads30d,
      newLeads7d,
      appointmentsThisMonth,
      upcomingAppointments,
      practices,
    ] = await Promise.all([
      ctx.prisma.lead.count({
        where: {
          ...practiceFilter,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      ctx.prisma.lead.count({
        where: {
          ...practiceFilter,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      ctx.prisma.appointment.count({
        where: {
          ...practiceFilter,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      ctx.prisma.appointment.count({
        where: {
          ...practiceFilter,
          dateTime: { gte: now },
          status: "SCHEDULED",
        },
      }),
      role === "ADMIN"
        ? ctx.prisma.dentalPractice.count()
        : role === "SALESPERSON"
        ? ctx.prisma.dentalPractice.count({
            where: { assignedSalespersonId: userId },
          })
        : Promise.resolve(1),
    ]);

    return {
      totalLeads30d,
      newLeads7d,
      appointmentsThisMonth,
      upcomingAppointments,
      totalPractices: practices,
    };
  }),
});
