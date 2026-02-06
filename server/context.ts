import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { PrismaClient, User as DbUser } from "@prisma/client";

export async function createContext() {
  let user: User | null = null;
  let dbUser: DbUser | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;

    if (authUser) {
      // Find matching Prisma user - MUST match auth.uid()
      dbUser = await prisma.user.findUnique({
        where: { id: authUser.id },
      });

      // On mismatch: REJECT, never auto-create
      if (!dbUser) {
        console.error(`Auth user ${authUser.id} has no matching Prisma record`);
        // Don't throw here - let the protectedProcedure middleware handle it
        // by checking user but null dbUser
        user = null;
      }
    }
  } catch {
    // Auth errors should not break the context creation
    // for public procedures
  }

  return {
    prisma,
    user,
    dbUser,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
