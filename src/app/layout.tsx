import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { unstable_noStore as noStore } from "next/cache";

import { TRPCReactProvider } from "~/trpc/react";
import { seedDatabase } from "~/server/db/seed";

export const metadata: Metadata = {
  title: "Election Turnout Tracker",
  description: "Track voter turnout across 82 polling stations",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

// Initialize the database with seed data
async function initDatabase() {
  noStore();
  await seedDatabase();
  return null;
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Seed the database when the app starts
  await initDatabase();
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
