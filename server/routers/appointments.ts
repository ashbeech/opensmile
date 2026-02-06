import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  AppointmentStatus,
  AppointmentType,
  AppointmentConfirmationSource,
} from "@prisma/client";

export const appointmentsRouter = router({
  // List appointments
  list: protectedProcedure
    .input(
      z.object({
        practiceId: z.string().optional(),
        status: z.nativeEnum(AppointmentStatus).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { role, id: userId, practiceId: userPracticeId } = ctx.dbUser;

      let practiceFilter: { practiceId?: string | { in: string[] } } = {};

      if (role === "ADMIN") {
        if (input.practiceId) {
          practiceFilter = { practiceId: input.practiceId };
        }
      } else if (role === "SALESPERSON") {
        const practices = await ctx.prisma.dentalPractice.findMany({
          where: { assignedSalespersonId: userId },
          select: { id: true },
        });
        practiceFilter = { practiceId: { in: practices.map((p) => p.id) } };
      } else if (
        (role === "PRACTICE_OWNER" || role === "PRACTICE_STAFF") &&
        userPracticeId
      ) {
        practiceFilter = { practiceId: userPracticeId };
      } else {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.prisma.appointment.findMany({
        where: {
          ...practiceFilter,
          ...(input.status && { status: input.status }),
          ...(input.startDate &&
            input.endDate && {
              dateTime: {
                gte: input.startDate,
                lte: input.endDate,
              },
            }),
        },
        include: {
          lead: { select: { id: true, name: true, phone: true } },
          practice: { select: { id: true, name: true } },
          treatmentType: { select: { name: true, averagePrice: true } },
          bookedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { dateTime: "asc" },
      });
    }),

  // Create appointment
  create: protectedProcedure
    .input(
      z.object({
        leadId: z.string(),
        practiceId: z.string(),
        dateTime: z.string().transform((s) => new Date(s)),
        type: z.nativeEnum(AppointmentType).default("CONSULTATION"),
        treatmentTypeId: z.string(),
        depositAmount: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify lead exists
      const lead = await ctx.prisma.lead.findUnique({
        where: { id: input.leadId },
      });
      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      }

      // Create appointment
      const appointment = await ctx.prisma.appointment.create({
        data: {
          leadId: input.leadId,
          practiceId: input.practiceId,
          dateTime: input.dateTime,
          type: input.type,
          status: "SCHEDULED",
          treatmentTypeId: input.treatmentTypeId,
          salespersonId: ctx.dbUser.id,
          depositAmount: input.depositAmount,
          patientPreparationNotes: input.notes || null,
          reminderSentAt: [],
        },
      });

      // Update lead status
      await ctx.prisma.lead.update({
        where: { id: input.leadId },
        data: {
          status: "APPOINTMENT_BOOKED",
          appointmentBookedAt: new Date(),
        },
      });

      // Create interaction log
      await ctx.prisma.interaction.create({
        data: {
          leadId: input.leadId,
          practiceId: input.practiceId,
          salespersonId: ctx.dbUser.id,
          type: "APPOINTMENT_CREATED",
          body: `Appointment booked for ${input.dateTime.toLocaleDateString()}`,
          metadata: { appointmentId: appointment.id },
          keyTopicsDiscussed: [],
        },
      });

      return appointment;
    }),

  // Record outcome
  recordOutcome: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        showedUp: z.boolean(),
        noShowReason: z.string().optional(),
        consultationNotes: z.string().optional(),
        convertedToTreatment: z.boolean().default(false),
        estimatedTreatmentValue: z.number().optional(),
        confirmationSource: z
          .nativeEnum(AppointmentConfirmationSource)
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const appointment = await ctx.prisma.appointment.findUnique({
        where: { id: input.id },
      });
      if (!appointment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const status: AppointmentStatus = input.showedUp ? "ATTENDED" : "NO_SHOW";

      const updated = await ctx.prisma.appointment.update({
        where: { id: input.id },
        data: {
          showedUp: input.showedUp,
          status,
          noShowReason: input.noShowReason,
          consultationNotes: input.consultationNotes,
          convertedToTreatment: input.convertedToTreatment,
          estimatedTreatmentValue: input.estimatedTreatmentValue,
          confirmedAt: new Date(),
          confirmationSource: input.confirmationSource || "MANUAL_SALESPERSON",
          confirmedByUserId: ctx.dbUser.id,
        },
      });

      // Update lead status if attended
      if (input.showedUp && appointment.leadId) {
        const newStatus = input.convertedToTreatment
          ? "TREATMENT_STARTED"
          : "CONSULTATION_COMPLETED";

        await ctx.prisma.lead.update({
          where: { id: appointment.leadId },
          data: { status: newStatus },
        });
      }

      return updated;
    }),
});
