"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { api } from "~/trpc/react";

type StationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function StationPage({ params }: StationPageProps) {
  // Use the React 'use' hook to unwrap the Promise
  const { id } = use(params);
  const router = useRouter();
  const stationId = parseInt(id, 10);
  
  // Fetch station data
  const { data: station, isLoading: stationLoading } = api.stations.getById.useQuery(
    { id: stationId },
    { enabled: !isNaN(stationId) }
  );
  
  // Fetch current turnout data
  const { data: turnout, isLoading: turnoutLoading } = api.stations.getTurnout.useQuery(
    { stationId },
    { enabled: !isNaN(stationId) }
  );
  
  const [voterCount, setVoterCount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update turnout mutation
  const updateTurnout = api.stations.updateTurnout.useMutation({
    onSuccess: () => {
      router.refresh();
      setVoterCount("");
    },
  });
  
  const handleDigitClick = (digit: string) => {
    if (voterCount.length < 6) { // Prevent extremely large numbers
      setVoterCount(prev => prev + digit);
    }
  };
  
  const handleClear = () => {
    setVoterCount("");
  };
  
  const handleBackspace = () => {
    setVoterCount(prev => prev.slice(0, -1));
  };
  
  const handleSubmit = async () => {
    if (!voterCount) return;
    
    setIsSubmitting(true);
    try {
      await updateTurnout.mutateAsync({
        stationId,
        voterCount: parseInt(voterCount, 10),
      });
    } catch (error) {
      console.error("Failed to update turnout:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isLoading = stationLoading || turnoutLoading;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a365d] to-[#0f172a] text-white">
      <div className="container mx-auto px-4 py-8">
        <Link 
          href="/"
          className="mb-6 inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
        >
          ← Back to All Stations
        </Link>
        
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-2xl">Loading...</div>
          </div>
        ) : (
          <>
            <div className="mb-8 rounded-lg bg-blue-900 p-6">
              <h1 className="text-3xl font-bold">{station?.name}</h1>
              <p className="mt-2 text-blue-200">{station?.location}</p>
              
              <div className="mt-6">
                <h2 className="text-xl font-semibold">Current Turnout</h2>
                <p className="mt-2 text-5xl font-bold text-yellow-300">
                  {turnout?.voterCount.toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-blue-200">
                  Last updated: {turnout && 'updatedAt' in turnout && turnout.updatedAt ? new Date(turnout.updatedAt).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>
            
            <div className="rounded-lg bg-blue-800/50 p-6">
              <h2 className="mb-4 text-2xl font-bold">Update Voter Turnout</h2>
              
              <div className="mb-6 rounded-lg bg-gray-900 p-4">
                <input
                  type="text"
                  value={voterCount}
                  readOnly
                  className="w-full bg-transparent text-right text-4xl font-bold text-yellow-300 outline-none"
                  placeholder="0"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handleDigitClick(digit.toString())}
                    className="rounded-lg bg-blue-700 p-4 text-2xl font-bold hover:bg-blue-600"
                    disabled={isSubmitting}
                  >
                    {digit}
                  </button>
                ))}
                <button
                  onClick={handleClear}
                  className="rounded-lg bg-red-700 p-4 text-xl font-bold hover:bg-red-600"
                  disabled={isSubmitting}
                >
                  Clear
                </button>
                <button
                  onClick={() => handleDigitClick("0")}
                  className="rounded-lg bg-blue-700 p-4 text-2xl font-bold hover:bg-blue-600"
                  disabled={isSubmitting}
                >
                  0
                </button>
                <button
                  onClick={handleBackspace}
                  className="rounded-lg bg-yellow-700 p-4 text-xl font-bold hover:bg-yellow-600"
                  disabled={isSubmitting}
                >
                  ←
                </button>
              </div>
              
              <button
                onClick={handleSubmit}
                className="mt-6 w-full rounded-lg bg-green-700 p-4 text-2xl font-bold hover:bg-green-600 disabled:opacity-50"
                disabled={!voterCount || isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Turnout"}
              </button>
              
              <p className="mt-4 text-center text-sm text-blue-200">
                This will replace the current turnout count for this station
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
