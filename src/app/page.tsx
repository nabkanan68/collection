import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { api } from "~/trpc/server";
import { type RouterOutputs } from "~/trpc/shared";

export default async function Home() {
  noStore();
  
  // Initialize stations if they don't exist
  await api.stations.initializeStations();
  
  // Get all stations
  const stations = await api.stations.getAll();
  
  // Get total turnout
  const totalTurnout = await api.stations.getTotalTurnout();

  return (
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
            <p className="text-5xl font-bold text-yellow-300">
              {totalTurnout.totalVoters.toLocaleString()}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {stations.map((station) => (
            <Link
              key={station.id}
              href={`/station/${station.id}`}
              className="flex flex-col items-center rounded-lg bg-blue-800/50 p-4 text-center transition-all hover:bg-blue-700/70"
            >
              <span className="text-lg font-bold">{station.name}</span>
              <StationTurnout stationId={station.id ?? 0} />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

async function StationTurnout({ stationId }: { stationId: number }) {
  const turnout = await api.stations.getTurnout({ stationId });
  
  return (
    <div className="mt-2">
      <span className="text-3xl font-bold text-yellow-300">
        {turnout.voterCount}
      </span>
      <span className="text-sm text-blue-200"> voters</span>
    </div>
  );
}
