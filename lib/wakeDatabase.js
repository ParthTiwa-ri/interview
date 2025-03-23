/**
 * Utility function to wake up the database
 * This should be called as early as possible when the app starts
 */
export const wakeDatabase = async () => {
  try {
    const response = await fetch('/api/wake-database', { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    console.log('Database wake-up call:', data.message);
    return data.success;
  } catch (error) {
    console.warn('Failed to wake database:', error);
    return false;
  }
}; 