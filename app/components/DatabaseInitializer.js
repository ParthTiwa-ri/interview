"use client";

import { useEffect } from 'react';
import { wakeDatabase } from '../../lib/wakeDatabase';

export default function DatabaseInitializer() {
  useEffect(() => {
    // Wake up the database when this component mounts
    wakeDatabase();
    
    // Also set up a periodic ping to keep the connection alive
    const interval = setInterval(() => {
      wakeDatabase();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  // This component doesn't render anything
  return null;
} 