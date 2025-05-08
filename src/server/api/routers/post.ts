import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { stations } from "~/server/db/schema";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(stations).values({
        name: input.name,
        location: "Default location",
      });
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    const station = await ctx.db.query.stations.findFirst({
      orderBy: (stations, { desc }) => [desc(stations.createdAt)],
    });

    return station ?? null;
  }),
});
