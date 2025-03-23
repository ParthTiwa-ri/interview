"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import "./globals.css";
import Navbar from "./components/Navbar";
import DatabaseInitializer from "./components/DatabaseInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const pathname = usePathname();
  // Hide navbar on auth pages and homepage
  const hideNavbar = pathname?.includes('/sign-in') || 
                     pathname?.includes('/sign-up') || 
                     pathname === '/';

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <title>InterviewPrep - AI-Powered Interview Practice</title>
          <meta name="description" content="Practice for job interviews with AI-generated questions and feedback." />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <DatabaseInitializer />
          {!hideNavbar && <Navbar />}
          <main className="min-h-screen">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
