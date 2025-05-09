"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function UpdateVoterCount() {
  // Removed unused router variable
  const [stationId, setStationId] = useState<string>("");
  const [voterCount, setVoterCount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [inputMode, setInputMode] = useState<"station" | "voter">("station");
  const [stationName, setStationName] = useState<string>("");
  const [lastUpdatedStation, setLastUpdatedStation] = useState<{id: string; name: string} | null>(null);
  
  // Fetch all stations to validate station ID and get station name
  const { data: stations, isLoading: isLoadingStations } = api.stations.getAll.useQuery();
  
  // Get the current turnout for the selected station
  const { data: currentTurnout } = api.stations.getTurnout.useQuery(
    { stationId: parseInt(stationId) || 0 },
    { enabled: !!stationId && stationId !== "0" }
  );
  
  // Update station name when stationId changes
  useEffect(() => {
    if (stationId && stations) {
      const station = stations.find(s => s.id === parseInt(stationId));
      if (station) {
        setStationName(station.name);
      } else {
        setStationName("");
      }
    } else {
      setStationName("");
    }
  }, [stationId, stations]);
  
  // Mutation for updating turnout
  const updateTurnoutMutation = api.stations.updateTurnout.useMutation({
    onSuccess: () => {
      // Show success message
      setMessage({ text: "Voter count updated successfully!", type: "success" });
      
      // Save the last updated station for quick access
      setLastUpdatedStation({ id: stationId, name: stationName });
      
      // Clear inputs and switch back to station selection mode
      setVoterCount("");
      setStationId("");
      setStationName("");
      setInputMode("station");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    },
    onError: (error) => {
      setMessage({ text: `Error: ${error.message}`, type: "error" });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
  
  // Handle digit button click
  const handleDigitClick = (digit: string) => {
    if (inputMode === "station") {
      setStationId(prev => {
        // Limit station ID to 2 digits (max 82 stations)
        if (prev.length >= 2) return prev;
        // Prevent leading zeros
        if (prev === "0" && digit === "0") return prev;
        if (prev === "0") return digit;
        return prev + digit;
      });
    } else {
      setVoterCount(prev => {
        // Prevent leading zeros
        if (prev === "0" && digit === "0") return prev;
        if (prev === "0") return digit;
        return prev + digit;
      });
    }
  };
  
  // Handle clear button click
  const handleClear = () => {
    if (inputMode === "station") {
      setStationId("");
      setStationName("");
    } else {
      setVoterCount("");
    }
  };
  
  // Handle backspace button click
  const handleBackspace = () => {
    if (inputMode === "station") {
      setStationId(prev => prev.slice(0, -1));
    } else {
      setVoterCount(prev => prev.slice(0, -1));
    }
  };
  
  // Switch to voter count input mode
  const handleContinueToVoterCount = () => {
    if (!stationId || stationId === "0") {
      setMessage({ text: "Please enter a valid station ID", type: "error" });
      return;
    }
    
    const parsedStationId = parseInt(stationId);
    if (isNaN(parsedStationId) || !stations?.some(s => s.id === parsedStationId)) {
      setMessage({ text: "Invalid station ID", type: "error" });
      return;
    }
    
    setInputMode("voter");
    setMessage(null);
  };
  
  // Go back to station selection
  const handleBackToStationSelection = () => {
    setInputMode("station");
    setMessage(null);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stationId || stationId === "0") {
      setMessage({ text: "Please enter a station ID", type: "error" });
      return;
    }
    
    if (!voterCount) {
      setMessage({ text: "Please enter a voter count", type: "error" });
      return;
    }
    
    const parsedStationId = parseInt(stationId);
    const parsedVoterCount = parseInt(voterCount);
    
    if (isNaN(parsedStationId) || isNaN(parsedVoterCount)) {
      setMessage({ text: "Invalid input", type: "error" });
      return;
    }
    
    if (!stations?.some(s => s.id === parsedStationId)) {
      setMessage({ text: "Invalid station ID", type: "error" });
      return;
    }
    
    setIsSubmitting(true);
    updateTurnoutMutation.mutate({
      stationId: parsedStationId,
      voterCount: parsedVoterCount,
      updatedBy: "admin-user" // In a real app, this would be the logged-in user
    });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a365d] to-[#0f172a] text-white">
      <div className="container mx-auto px-3 py-4">
        <header className="mb-4 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Update Voter Count
          </h1>
          <p className="mt-1 text-sm text-blue-200">
            Enter station ID and voter count
          </p>
        </header>
        
        {message && (
          <div className={`mb-3 rounded-lg p-2 text-center text-sm ${
            message.type === "success" ? "bg-green-800/50 text-green-200" : "bg-red-800/50 text-red-200"
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="mx-auto max-w-md rounded-lg bg-blue-900/50 p-3 shadow-lg">
          <form onSubmit={handleSubmit}>
            {inputMode === "station" ? (
              /* Station ID Input Mode */
              <>
                <div className="mb-3">
                  <label htmlFor="stationId" className="mb-1 block text-sm font-medium">
                    Enter Polling Station ID (1-82)
                  </label>
                  <input
                    id="stationId"
                    type="text"
                    value={stationId}
                    readOnly
                    className="w-full rounded-lg bg-blue-800 p-2 text-right text-xl font-bold text-white focus:outline-none"
                    placeholder="Enter station ID"
                  />
                </div>
                
                {stationName && (
                  <div className="mb-3 rounded-lg bg-blue-800/50 p-2 text-center">
                    <p className="text-xs text-blue-200">Selected Station</p>
                    <p className="text-base font-bold text-white">{stationName}</p>
                  </div>
                )}
                
                {/* Keypad for Station ID */}
                <div className="mb-3 grid grid-cols-3 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleDigitClick(digit.toString())}
                      className="rounded-lg bg-blue-700 p-3 text-lg font-bold transition-colors hover:bg-blue-600 active:bg-blue-800"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-lg bg-red-700 p-3 text-lg font-bold transition-colors hover:bg-red-600 active:bg-red-800"
                  >
                    C
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigitClick("0")}
                    className="rounded-lg bg-blue-700 p-3 text-lg font-bold transition-colors hover:bg-blue-600 active:bg-blue-800"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="rounded-lg bg-yellow-700 p-3 text-lg font-bold transition-colors hover:bg-yellow-600 active:bg-yellow-800"
                  >
                    ⌫
                  </button>
                </div>
                
                {/* Continue Button */}
                <button
                  type="button"
                  onClick={handleContinueToVoterCount}
                  disabled={!stationId || isLoadingStations}
                  className="w-full rounded-lg bg-blue-600 p-2 text-base font-bold transition-colors hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50"
                >
                  Continue
                </button>
                
                {/* Quick Update Last Station Button */}
                {lastUpdatedStation && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStationId(lastUpdatedStation.id);
                        setStationName(lastUpdatedStation.name);
                        handleContinueToVoterCount();
                      }}
                      className="w-full rounded-lg bg-green-600 p-2 text-sm font-bold transition-colors hover:bg-green-500 active:bg-green-700"
                    >
                      Quick Update {lastUpdatedStation.name}
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Voter Count Input Mode */
              <>
                <div className="mb-3 rounded-lg bg-blue-800/50 p-2 text-center">
                  <p className="text-xs text-blue-200">Selected Station</p>
                  <p className="text-base font-bold text-white">{stationName}</p>
                  {currentTurnout && (
                    <>
                      <p className="mt-1 text-xs text-blue-200">Current Voter Count</p>
                      <p className="text-xl font-bold text-yellow-300">
                        {currentTurnout.voterCount.toLocaleString()}
                      </p>
                    </>
                  )}
                </div>
                
                {/* Voter Count Input */}
                <div className="mb-3">
                  <label htmlFor="voterCount" className="mb-1 block text-sm font-medium">
                    New Voter Count
                  </label>
                  <input
                    id="voterCount"
                    type="text"
                    value={voterCount}
                    readOnly
                    className="w-full rounded-lg bg-blue-800 p-2 text-right text-xl font-bold text-white focus:outline-none"
                    placeholder="Enter new count"
                  />
                </div>
                
                {/* Keypad for Voter Count */}
                <div className="mb-3 grid grid-cols-3 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleDigitClick(digit.toString())}
                      className="rounded-lg bg-blue-700 p-3 text-lg font-bold transition-colors hover:bg-blue-600 active:bg-blue-800"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-lg bg-red-700 p-3 text-lg font-bold transition-colors hover:bg-red-600 active:bg-red-800"
                  >
                    C
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigitClick("0")}
                    className="rounded-lg bg-blue-700 p-3 text-lg font-bold transition-colors hover:bg-blue-600 active:bg-blue-800"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="rounded-lg bg-yellow-700 p-3 text-lg font-bold transition-colors hover:bg-yellow-600 active:bg-yellow-800"
                  >
                    ⌫
                  </button>
                </div>
                
                <div className="mb-2 flex gap-1">
                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={handleBackToStationSelection}
                    className="flex-1 rounded-lg bg-gray-600 p-2 text-base font-bold transition-colors hover:bg-gray-500 active:bg-gray-700"
                  >
                    Back
                  </button>
                  
                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !voterCount}
                    className="flex-1 rounded-lg bg-green-600 p-2 text-base font-bold transition-colors hover:bg-green-500 active:bg-green-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Updating..." : "Update"}
                  </button>
                </div>
              </>
            )}
          </form>
          
          <div className="mt-3 text-center">
            <Link href="/" className="text-sm text-blue-300 hover:text-blue-200">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
