import { db } from "./index";
import { stations } from "./schema";

/**
 * Seeds the database with initial data for 82 polling stations
 */
export async function seedDatabase() {
  try {
    // Check if stations already exist
    const existingStations = await db.query.stations.findMany({
      limit: 1,
    });

    // Only seed if no stations exist
    if (existingStations.length === 0) {
      console.log("Seeding database with 82 polling stations...");
      
      // Create array of 82 stations
      const stationsData = Array.from({ length: 82 }, (_, i) => ({
        name: `Station ${i + 1}`,
        location: `Location ${i + 1}`,
      }));
      
      // Insert all stations
      await db.insert(stations).values(stationsData);
      console.log("Database seeded successfully!");
    } else {
      console.log("Database already contains stations, skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
