/**
 * Utility function to wake up the database
 * This should be called as early as possible when the app starts
 * Includes retry mechanism for better reliability
 */
export const wakeDatabase = async (retries = 3, delay = 2000): Promise<boolean> => {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch('/api/wake-database', { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Adding cache: 'no-store' to prevent caching of the response
        cache: 'no-store',
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`Database wake-up successful on attempt ${attempt + 1}: ${data.message}`);
        return true;
      } else {
        console.warn(`Database wake-up returned failure on attempt ${attempt + 1}: ${data.message}`);
      }
    } catch (error) {
      lastError = error;
      console.warn(`Database wake-up attempt ${attempt + 1} failed:`, error);
    }
    
    if (attempt < retries - 1) {
      console.log(`Retrying database wake-up in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      // Exponential backoff
      delay *= 1.5;
    }
  }

  console.error(`Failed to wake database after ${retries} attempts. Last error:`, lastError);
  return false;
}; 