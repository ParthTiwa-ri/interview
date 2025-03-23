import { prisma } from "../../../lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Simple query to wake up the database
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ success: true, message: "Database connection established" }, { status: 200 });
  } catch (error) {
    console.error("Error connecting to database:", error);
    return NextResponse.json({ success: false, message: "Failed to connect to database" }, { status: 500 });
  }
} 