"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { createUserFromClerk, getUserInterviewSessions } from "../../actions/action";

export default function InterviewsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbUserId, setDbUserId] = useState(null);

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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 