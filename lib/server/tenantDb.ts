// REQUIRED: Tenant-scoped database wrapper
// All application-level Prisma access MUST go through this wrapper.
// Direct prisma.lead.findMany() without practiceId is BANNED in application code.
import "server-only";
import { prisma } from "@/lib/prisma";

export function tenantDb(practiceId: string) {
  return {
    lead: {
      findMany: (args?: Parameters<typeof prisma.lead.findMany>[0]) =>
        prisma.lead.findMany({
          ...args,
          where: { ...args?.where, practiceId },
        }),
      findFirst: (args?: Parameters<typeof prisma.lead.findFirst>[0]) =>
        prisma.lead.findFirst({
          ...args,
          where: { ...args?.where, practiceId },
        }),
      findUnique: (args: Parameters<typeof prisma.lead.findUnique>[0]) =>
        prisma.lead.findUnique(args),
      create: (args: Parameters<typeof prisma.lead.create>[0]) =>
        prisma.lead.create({
          ...args,
          data: { ...args.data, practiceId },
        }),
      update: (args: Parameters<typeof prisma.lead.update>[0]) =>
        prisma.lead.update(args),
      count: (args?: Parameters<typeof prisma.lead.count>[0]) =>
        prisma.lead.count({
          ...args,
          where: { ...args?.where, practiceId },
        }),
    },
    interaction: {
      findMany: (args?: Parameters<typeof prisma.interaction.findMany>[0]) =>
        prisma.interaction.findMany({
          ...args,
          where: { ...args?.where, practiceId },
        }),
      create: (args: Parameters<typeof prisma.interaction.create>[0]) =>
        prisma.interaction.create({
          ...args,
          data: { ...args.data, practiceId },
        }),
      count: (args?: Parameters<typeof prisma.interaction.count>[0]) =>
        prisma.interaction.count({
          ...args,
          where: { ...args?.where, practiceId },
        }),
    },
    appointment: {
      findMany: (args?: Parameters<typeof prisma.appointment.findMany>[0]) =>
        prisma.appointment.findMany({
          ...args,
          where: { ...args?.where, practiceId },
        }),
      create: (args: Parameters<typeof prisma.appointment.create>[0]) =>
        prisma.appointment.create({
          ...args,
          data: { ...args.data, practiceId },
        }),
      update: (args: Parameters<typeof prisma.appointment.update>[0]) =>
        prisma.appointment.update(args),
      count: (args?: Parameters<typeof prisma.appointment.count>[0]) =>
        prisma.appointment.count({
          ...args,
          where: { ...args?.where, practiceId },
        }),
    },
    campaign: {
      findMany: (args?: Parameters<typeof prisma.campaign.findMany>[0]) =>
        prisma.campaign.findMany({
          ...args,
          where: { ...args?.where, practiceId },
        }),
      count: (args?: Parameters<typeof prisma.campaign.count>[0]) =>
        prisma.campaign.count({
          ...args,
          where: { ...args?.where, practiceId },
        }),
    },
  };
}
