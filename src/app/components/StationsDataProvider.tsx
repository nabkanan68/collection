"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { api } from "~/trpc/react";

// Define the shape of our turnout data
type TurnoutData = {
  stationId: number;
  voterCount: number;
  updatedAt?: Date | null;
};

// Create a context to share turnout data across components
type StationsContextType = {
  turnouts: Record<number, TurnoutData>;
  isLoading: boolean;
  lastUpdated: Date;
  refreshData: () => void;
};

const StationsContext = createContext<StationsContextType>({
  turnouts: {},
  isLoading: true,
  lastUpdated: new Date(),
  refreshData: () => {}, // Default empty function
});

// Hook to access the stations data
export const useStationsData = () => useContext(StationsContext);

// Provider component that fetches all turnout data in a single request
export function StationsDataProvider({ 
  children,
  initialTurnouts = [],
}: { 
  children: ReactNode;
  initialTurnouts?: TurnoutData[];
}) {
  // Convert initial turnouts to a record for faster lookups
  const initialTurnoutsRecord = initialTurnouts.reduce((acc, turnout) => {
    acc[turnout.stationId] = turnout;
    return acc;
  }, {} as Record<number, TurnoutData>);
  
  const [turnouts, setTurnouts] = useState<Record<number, TurnoutData>>(initialTurnoutsRecord);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  // 5 minutes in milliseconds (300,000ms)
  const [refreshInterval, setRefreshInterval] = useState(300000); 
  
  // Use client-side data fetching with automatic refetching
  const { data, isLoading: isFetching, refetch } = api.stations.getAllTurnouts.useQuery(
    undefined,
    { 
      refetchInterval: refreshInterval,
      staleTime: 60000, // Consider data stale after 1 minute
    }
  );
  
  // Manual refresh function
  const refreshData = () => {
    setIsLoading(true);
    refetch().then(() => {
      setLastUpdated(new Date());
    });
  };
  
  // Update state when data changes
  useEffect(() => {
    if (data) {
      // Convert array to record for faster lookups
      const newTurnouts = data.reduce((acc: Record<number, TurnoutData>, turnout: TurnoutData) => {
        acc[turnout.stationId] = turnout;
        return acc;
      }, {} as Record<number, TurnoutData>);
      
      setTurnouts(newTurnouts);
      setLastUpdated(new Date());
      setIsLoading(false);
    }
  }, [data]);
  
  // Use a longer refresh interval when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      // When hidden: 10 minutes, when visible: 5 minutes
      setRefreshInterval(document.hidden ? 600000 : 300000); 
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
  
  return (
    <StationsContext.Provider value={{ 
      turnouts, 
      isLoading: isFetching, 
      lastUpdated,
      refreshData 
    }}>
      {children}
    </StationsContext.Provider>
  );
}
