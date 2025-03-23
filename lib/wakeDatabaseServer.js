import { prisma } from "./db";

/**
 * Server-side utility function to wake up the database
 * Can be used in server components or API routes
 * Includes retry mechanism for better reliability
 */
export const wakeDatabaseServer = async (retries = 3, delay = 2000) => {
  let lastError;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Simple query to wake up the database
      await prisma.$queryRaw`SELECT 1`;
      console.log(`Database connection established (server-side) on attempt ${attempt + 1}`);
      return true;
    } catch (error) {
      lastError = error;
      console.error(`Error connecting to database (server-side) on attempt ${attempt + 1}:`, error);
      
      if (attempt < retries - 1) {
        console.log(`Retrying database connection in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // Exponential backoff
        delay *= 1.5;
      }
    }
  }

  console.error(`Failed to connect to database after ${retries} attempts. Last error:`, lastError);
  return false;
}; 