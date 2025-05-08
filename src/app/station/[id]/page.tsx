import { type Metadata } from "next";

import StationClient from "./client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Station Detail | Election Turnout Tracker",
};

// Server component that receives the params and passes them to the client component
export default async function StationPage({ params }: PageProps) {
  const { id } = await params;
  return <StationClient id={id} />;
}
