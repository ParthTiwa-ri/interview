"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { createUserFromClerk, getUserInterviewSessions, deleteInterviewSession } from "../../actions/action";

export default function InterviewsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbUserId, setDbUserId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    const syncUserAndFetchInterviews = async () => {
      if (isLoaded && isSignedIn) {
        setLoading(true);
        setError(null);
        
        try {
          // First, make sure user exists in our database
          const userResult = await createUserFromClerk({
            id: user.id,
            name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            email: user.primaryEmailAddress?.emailAddress,
          });
          
          if (!userResult.success) {
            throw new Error(userResult.error || "Failed to sync user");
          }
          
          setDbUserId(userResult.userId);
          
          // Then fetch the user's interviews
          const interviewsResult = await getUserInterviewSessions(userResult.userId);
          
          if (!interviewsResult.success) {
            throw new Error(interviewsResult.error || "Failed to fetch interviews");
          }
          
          setInterviews(interviewsResult.sessions);
        } catch (err) {
          console.error("Error fetching interviews:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    syncUserAndFetchInterviews();
  }, [isLoaded, isSignedIn, user]);

  const deleteInterview = async (sessionId) => {
    if (confirm("Are you sure you want to delete this interview? This action cannot be undone.")) {
      setDeleteLoading(sessionId);
      
      try {
        const result = await deleteInterviewSession(sessionId);
        
        if (!result.success) {
          throw new Error(result.error || "Failed to delete interview");
        }
        
        // Update the interviews list without reloading the page
        setInterviews(interviews.filter(interview => interview.id !== sessionId));
      } catch (err) {
        console.error("Error deleting interview:", err);
        setError(err.message);
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  if (!isLoaded) {
    return <div className="max-w-4xl mx-auto px-4 py-12">Loading...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view your interviews</h2>
          <p className="text-gray-600 mb-6">
            You need to sign in to access your past interview sessions.
          </p>
          <Link 
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md"
          >
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Interview Sessions</h1>
        <Link
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          New Interview
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-6 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ) : interviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">No interviews yet</h2>
          <p className="text-gray-600 mb-6">
            You haven't completed any interview sessions yet. Start a new interview to see results here.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md"
          >
            Start your first interview
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => (
            <div key={interview.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{interview.jobRole}</h2>
                  <p className="text-gray-500">
                    {new Date(interview.createdAt).toLocaleDateString()} • {interview.questionCount} questions
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div 
                    className={`text-white font-medium px-3 py-1 rounded-full ${
                      interview.totalScore >= 8 ? 'bg-green-500' : 
                      interview.totalScore >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                  >
                    Score: {interview.totalScore}
                  </div>
                  <Link
                    href={`/interviews/${interview.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Details →
                  </Link>
                  <button
                    onClick={() => deleteInterview(interview.id)}
                    disabled={deleteLoading === interview.id}
                    className="text-red-600 hover:text-red-800 disabled:text-red-300"
                    aria-label="Delete interview"
                  >
                    {deleteLoading === interview.id ? (
                      <span className="inline-block w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 