import { wakeDatabaseServer } from "../../../lib/wakeDatabaseServer";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Use the server-side wake function with retries
    const success = await wakeDatabaseServer();
    
    if (success) {
      return NextResponse.json({ success: true, message: "Database connection established" }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, message: "Failed to connect to database after multiple attempts" }, { status: 500 });
    }
  } catch (error) {
    console.error("Unexpected error in wake-database endpoint:", error);
    return NextResponse.json({ success: false, message: "Unexpected error occurred" }, { status: 500 });
  }
} 