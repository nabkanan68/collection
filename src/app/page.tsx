import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { Suspense } from "react";

import { api } from "~/trpc/server";
import { StationTurnoutClient } from "./components/StationTurnoutClient";
import { TotalTurnoutClient } from "./components/TotalTurnoutClient";
import { StationsDataProvider } from "./components/StationsDataProvider";
import { RefreshButton } from "./components/RefreshButton";

// Separate data fetching functions for parallel execution
async function getStations() {
  noStore();
  return api.stations.getAll();
}

async function getTotalTurnout() {
  noStore();
  return api.stations.getTotalTurnout();
}

async function initializeStations() {
  return api.stations.initializeStations();
}

// We're using inline loading states instead of this component
// Keeping the commented code for future reference if needed
/*
function LoadingCard() {
  return (
    <div className="flex h-24 animate-pulse flex-col items-center rounded-lg bg-blue-800/30 p-4 text-center">
      <div className="h-5 w-24 rounded bg-blue-700/50"></div>
      <div className="mt-2 h-8 w-16 rounded bg-yellow-500/30"></div>
    </div>
  );
}
*/

// Server component wrapper for station turnout
const StationTurnout = async ({ stationId }: { stationId: number }) => {
  const turnout = await api.stations.getTurnout({ stationId });
  
  return (
    <StationTurnoutClient 
      stationId={stationId} 
      initialVoterCount={turnout.voterCount} 
    />
  );
}

// Optimized station card component
function StationCard({ station }: { station: { id: number | null; name: string } }) {
  return (
    <Link
      key={station.id}
      href={`/station/${station.id}`}
      className="flex flex-col items-center rounded-lg bg-blue-800/50 p-4 text-center transition-all hover:bg-blue-700/70"
      prefetch={false} // Only prefetch when user hovers, saving resources
    >
      <span className="text-lg font-bold">{station.name}</span>
      <Suspense fallback={<div className="mt-2 h-8 w-16 animate-pulse rounded bg-yellow-500/30"></div>}>
        <StationTurnout stationId={station.id ?? 0} />
      </Suspense>
    </Link>
  );
}

export default async function Home() {
  // Initialize stations in parallel with other data fetching
  const initPromise = initializeStations();
  
  // Fetch data in parallel for better performance
  const [stations, totalTurnout, allTurnouts] = await Promise.all([
    getStations(),
    getTotalTurnout(),
    api.stations.getAllTurnouts(),
    initPromise, // Wait for initialization but don't use the result
  ]);

  return (
    <StationsDataProvider initialTurnouts={allTurnouts}>
      <main className="min-h-screen bg-gradient-to-b from-[#1a365d] to-[#0f172a] text-white">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Election Turnout Tracker
            </h1>
            <p className="mt-2 text-xl text-blue-200">
              Track voter turnout across 82 polling stations
            </p>
            <div className="mt-4 rounded-lg bg-blue-900 p-4 text-center">
              <h2 className="text-2xl font-bold">Total Voter Turnout</h2>
              <TotalTurnoutClient initialTotalVoters={totalTurnout?.totalVoters ?? 0} />
            </div>
            <div className="mt-4">
              <RefreshButton />
              <div className="mt-4">
                <Link 
                  href="/admin/update" 
                  className="inline-block rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-all hover:bg-green-700"
                >
                  Update Voter Counts
                </Link>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {stations.map((station) => (
              <StationCard key={station.id} station={station} />
            ))}
          </div>
        </div>
      </main>
    </StationsDataProvider>
  );
}
