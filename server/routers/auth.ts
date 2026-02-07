import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const authRouter = router({
  /**
   * Public procedure: create a Prisma User record after Supabase Auth sign-up.
   * Called from the sign-up page after supabase.auth.signUp() succeeds.
   */
  register: publicProcedure
    .input(
      z.object({
        supabaseUserId: z.string().uuid(),
        email: z.string().email(),
        fullName: z.string().min(1).max(200),
        role: z.enum([
          "ADMIN",
          "SALESPERSON",
          "PRACTICE_OWNER",
          "PRACTICE_STAFF",
        ]),
        practiceName: z.string().min(1).max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabaseUserId, email, fullName, role, practiceName } = input;

      // Check if user already exists
      const existing = await ctx.prisma.user.findUnique({
        where: { id: supabaseUserId },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User record already exists",
        });
      }

      // For PRACTICE_OWNER: create a DentalPractice and link the user
      if (
        (role === "PRACTICE_OWNER" || role === "PRACTICE_STAFF") &&
        practiceName
      ) {
        // Create user first, then practice
        const user = await ctx.prisma.user.create({
          data: {
            id: supabaseUserId,
            email,
            fullName,
            role,
          },
        });

        // Create the practice with this user as the assigned salesperson
        // (practice owners self-manage; we use their own ID as the salesperson placeholder)
        const practice = await ctx.prisma.dentalPractice.create({
          data: {
            name: practiceName,
            address: "",
            city: "",
            postcode: "",
            email,
            phone: "",
            subscriptionTier: "STARTER",
            status: "ACTIVE",
            onboardingStatus: "LEAD",
            assignedSalespersonId: supabaseUserId,
            conversionPreferences: {},
          },
        });

        // Link user to the practice
        await ctx.prisma.user.update({
          where: { id: supabaseUserId },
          data: { practiceId: practice.id },
        });

        return { userId: user.id, practiceId: practice.id };
      }

      // For ADMIN / SALESPERSON: just create the user
      const user = await ctx.prisma.user.create({
        data: {
          id: supabaseUserId,
          email,
          fullName,
          role,
        },
      });

      return { userId: user.id, practiceId: null };
    }),

  /**
   * Protected procedure: clear the mustChangePassword flag after password update.
   */
  clearMustChangePassword: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.user.update({
      where: { id: ctx.dbUser.id },
      data: { mustChangePassword: false },
    });
    return { success: true };
  }),

  /**
   * Protected procedure: check if the current user must change their password.
   */
  checkMustChangePassword: protectedProcedure.query(async ({ ctx }) => {
    return { mustChangePassword: ctx.dbUser.mustChangePassword };
  }),
});
