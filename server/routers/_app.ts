import { router } from "../trpc";
import { authRouter } from "./auth";
import { leadsRouter } from "./leads";
import { interactionsRouter } from "./interactions";
import { appointmentsRouter } from "./appointments";
import { analyticsRouter } from "./analytics";
import { aiRouter } from "./ai";

export const appRouter = router({
  auth: authRouter,
  leads: leadsRouter,
  interactions: interactionsRouter,
  appointments: appointmentsRouter,
  analytics: analyticsRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
