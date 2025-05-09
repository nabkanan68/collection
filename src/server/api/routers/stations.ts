import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { stations, turnouts, auditLogs } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export const stationsRouter = createTRPCRouter({
  // Get all stations
  getAll: publicProcedure.query(async ({ ctx }) => {
    const results = await ctx.db.query.stations.findMany();
    // Sort numerically by ID to ensure correct order (1, 2, ..., 81, 82)
    return results.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
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
    
  // Get all station turnouts in a single request (much more efficient)
  getAllTurnouts: publicProcedure.query(async ({ ctx }) => {
    // Get all turnouts in a single query
    const allTurnouts = await ctx.db.query.turnouts.findMany({
      orderBy: (turnouts, { desc }) => [desc(turnouts.updatedAt)],
    });
    
    // Create a map of the latest turnout for each station
    const latestTurnoutByStation = new Map();
    for (const turnout of allTurnouts) {
      const existingTurnout = latestTurnoutByStation.get(turnout.stationId);
      const currentUpdatedAt = turnout.updatedAt ?? new Date(0);
      const existingUpdatedAt = existingTurnout?.updatedAt ?? new Date(0);
      
      if (!existingTurnout || currentUpdatedAt > existingUpdatedAt) {
        latestTurnoutByStation.set(turnout.stationId, turnout);
      }
    }
    
    // Convert to array of turnout objects
    return Array.from(latestTurnoutByStation.values());
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

  // Get total turnout across all stations - optimized with a batch query
  getTotalTurnout: publicProcedure.query(async ({ ctx }) => {
    // Get all turnouts in a single query
    const allTurnouts = await ctx.db.query.turnouts.findMany({
      orderBy: (turnouts, { desc }) => [desc(turnouts.updatedAt)],
    });
    
    // Create a map of the latest turnout for each station
    const latestTurnoutByStation = new Map();
    for (const turnout of allTurnouts) {
      const existingTurnout = latestTurnoutByStation.get(turnout.stationId);
      const currentUpdatedAt = turnout.updatedAt ?? new Date(0);
      const existingUpdatedAt = existingTurnout?.updatedAt ?? new Date(0);
      
      if (!existingTurnout || currentUpdatedAt > existingUpdatedAt) {
        latestTurnoutByStation.set(turnout.stationId, turnout);
      }
    }
    
    // Sum up the voter counts
    const totalVoters = Array.from(latestTurnoutByStation.values())
      .reduce((sum, turnout) => sum + turnout.voterCount, 0);
    
    return { totalVoters };
  }),
});
