import { NextResponse } from 'next/server';

// Add runtime configuration for API route
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Simple ping response without database connection
    // This avoids potential issues during build time
    return NextResponse.json({
      success: true,
      message: 'API is online and ready to wake database',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in wake-database API route:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error processing request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    }, { status: 500 });
  }
} 