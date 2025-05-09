"use client";

import { useStationsData } from "./StationsDataProvider";

export function StationTurnoutClient({ stationId, initialVoterCount = 0 }: { 
  stationId: number;
  initialVoterCount: number;
}) {
  // Use the shared data provider instead of individual queries
  const { turnouts, isLoading } = useStationsData();
  
  // Get the turnout for this station from the shared data
  const turnout = turnouts[stationId] || { stationId, voterCount: initialVoterCount };
  
  return (
    <div className="mt-2">
      <span className={`text-3xl font-bold text-yellow-300 ${isLoading ? 'opacity-50' : ''}`}>
        {turnout.voterCount}
      </span>
      <span className="text-sm text-blue-200"> voters</span>
    </div>
  );
}
