"use client";

import { useState, useEffect } from "react";
import { useStationsData } from "./StationsDataProvider";

export function TotalTurnoutClient({ initialTotalVoters = 0 }: { 
  initialTotalVoters: number;
}) {
  const { turnouts, isLoading } = useStationsData();
  const [totalVoters, setTotalVoters] = useState(initialTotalVoters);
  
  // Calculate total voters whenever turnouts change
  useEffect(() => {
    // Sum up all voter counts from the turnouts
    const total = Object.values(turnouts).reduce(
      (sum, turnout) => sum + turnout.voterCount, 
      0
    );
    
    setTotalVoters(total || initialTotalVoters);
  }, [turnouts, initialTotalVoters]);
  
  return (
    <p className={`text-5xl font-bold text-yellow-300 transition-opacity duration-300 ${isLoading ? 'opacity-70' : 'opacity-100'}`}>
      {totalVoters.toLocaleString()}
    </p>
  );
}
