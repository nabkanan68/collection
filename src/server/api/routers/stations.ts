import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { stations, turnouts, auditLogs } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export const stationsRouter = createTRPCRouter({
  // Get all stations
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.stations.findMany({
      orderBy: (stations, { asc }) => [asc(stations.id)],
    });
  }),

  // Get a single station by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.stations.findFirst({
        where: eq(stations.id, input.id),
      });
    }),

  // Get current turnout for a station
  getTurnout: publicProcedure
    .input(z.object({ stationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.turnouts.findFirst({
        where: eq(turnouts.stationId, input.stationId),
        orderBy: (turnouts, { desc }) => [desc(turnouts.updatedAt)],
      });
      
      return result ?? { stationId: input.stationId, voterCount: 0 };
    }),

  // Update turnout for a station
  updateTurnout: publicProcedure
    .input(z.object({
      stationId: z.number(),
      voterCount: z.number().int().min(0),
      updatedBy: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get current turnout to log in audit
      const currentTurnout = await ctx.db.query.turnouts.findFirst({
        where: eq(turnouts.stationId, input.stationId),
        orderBy: (turnouts, { desc }) => [desc(turnouts.updatedAt)],
      });

      // Delete existing turnout records for this station
      await ctx.db.delete(turnouts).where(eq(turnouts.stationId, input.stationId));

      // Create new turnout record
      const result = await ctx.db.insert(turnouts).values({
        stationId: input.stationId,
        voterCount: input.voterCount,
        updatedBy: input.updatedBy,
      }).returning();

      // Log the change in audit log
      if (currentTurnout) {
        await ctx.db.insert(auditLogs).values({
          stationId: input.stationId,
          action: "update",
          previousValue: currentTurnout.voterCount,
          newValue: input.voterCount,
        });
      } else {
        await ctx.db.insert(auditLogs).values({
          stationId: input.stationId,
          action: "create",
          newValue: input.voterCount,
        });
      }

      return result[0];
    }),

  // Initialize stations (if they don't exist)
  initializeStations: publicProcedure.mutation(async ({ ctx }) => {
    const existingStations = await ctx.db.query.stations.findMany();
    
    if (existingStations.length === 0) {
      const stationsToCreate = Array.from({ length: 82 }, (_, i) => ({
        name: `Station ${i + 1}`,
        location: `Location ${i + 1}`,
      }));
      
      await ctx.db.insert(stations).values(stationsToCreate);
    }
    
    return { success: true };
  }),

  // Get total turnout across all stations
  getTotalTurnout: publicProcedure.query(async ({ ctx }) => {
    const allStations = await ctx.db.query.stations.findMany();
    let totalVoters = 0;
    
    for (const station of allStations) {
      const turnout = await ctx.db.query.turnouts.findFirst({
        where: eq(turnouts.stationId, station.id!),
        orderBy: (turnouts, { desc }) => [desc(turnouts.updatedAt)],
      });
      
      if (turnout) {
        totalVoters += turnout.voterCount;
      }
    }
    
    return { totalVoters };
  }),
});
