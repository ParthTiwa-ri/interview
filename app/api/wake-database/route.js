import { prisma } from "../../../lib/db";
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Direct database query without using wakeDatabaseServer
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      success: true,
      message: 'Database connection established'
    });
  } catch (error) {
    console.error('Error in wake-database API route:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error while trying to wake database'
    }, { status: 500 });
  }
} 