"use client";

import { useEffect, useState, use } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getInterviewSessionDetails } from "../../../actions/action";

export default function InterviewDetailsPage({ params }) {
  // Unwrap params using React.use() to follow the new recommended pattern
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (isLoaded && isSignedIn) {
        setLoading(true);
        setError(null);
        
        try {
          const result = await getInterviewSessionDetails(id);
          
          if (!result.success) {
            throw new Error(result.error || "Failed to fetch interview details");
          }
          
          setSession(result.session);
        } catch (err) {
          console.error("Error fetching interview details:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else if (isLoaded && !isSignedIn) {
        router.push("/");
      }
    };

    fetchSessionDetails();
  }, [id, isLoaded, isSignedIn, router]);

  if (!isLoaded || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <Link 
            href="/interviews" 
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            ← Back to interviews
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Interview not found</h2>
          <p className="text-gray-600 mb-6">
            The interview session you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link 
            href="/interviews"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md"
          >
            Back to interviews
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link 
          href="/interviews" 
          className="text-blue-600 hover:underline flex items-center"
        >
          ← Back to interviews
        </Link>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{session.jobRole} Interview</h1>
            <p className="text-gray-600 mt-1">
              {new Date(session.createdAt).toLocaleDateString()} • {session.questionResponses.length} questions
            </p>
          </div>
          <div 
            className={`text-white font-medium px-4 py-2 rounded-full text-lg ${
              session.totalScore >= 8 ? 'bg-green-500' : 
              session.totalScore >= 6 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          >
            Score: {session.totalScore}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Question navigation */}
        <div className="md:w-1/3">
          <div className="bg-white rounded-xl shadow-md p-4 sticky top-4">
            <h2 className="font-semibold text-lg mb-4">Questions</h2>
            <div className="space-y-2">
              {session.questionResponses.map((qr, index) => (
                <button
                  key={qr.id}
                  onClick={() => setActiveQuestionIndex(index)}
                  className={`w-full text-left p-3 rounded-md transition-colors ${
                    activeQuestionIndex === index 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 text-sm mr-2">
                      {index + 1}
                    </span>
                    <span className="line-clamp-1">
                      {qr.question.length > 60 
                        ? qr.question.substring(0, 60) + "..." 
                        : qr.question}
                    </span>
                  </div>
                  {qr.score !== null && (
                    <div 
                      className={`mt-2 text-xs font-medium px-2 py-1 rounded-full inline-block ${
                        qr.score >= 8 ? 'bg-green-100 text-green-800' : 
                        qr.score >= 6 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      Score: {qr.score}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Question details */}
        <div className="md:w-2/3">
          {session.questionResponses.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Question {activeQuestionIndex + 1}
                </h2>
                <p className="text-gray-800">{session.questionResponses[activeQuestionIndex].question}</p>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Your Answer:</h3>
                <div className="bg-gray-50 rounded-md p-4 text-gray-800">
                  {session.questionResponses[activeQuestionIndex].answer}
                </div>
              </div>
              
              {session.questionResponses[activeQuestionIndex].score !== null && (
                <>
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Score:</h3>
                    <div 
                      className={`inline-block px-4 py-2 rounded-md text-white font-medium ${
                        session.questionResponses[activeQuestionIndex].score >= 8 ? 'bg-green-500' : 
                        session.questionResponses[activeQuestionIndex].score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    >
                      {session.questionResponses[activeQuestionIndex].score} / 10
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Feedback:</h3>
                    <p className="text-gray-800">
                      {session.questionResponses[activeQuestionIndex].feedback}
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-green-50 rounded-xl p-4">
                      <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                      <ul className="space-y-2">
                        {session.questionResponses[activeQuestionIndex].strengths.length > 0 ? (
                          session.questionResponses[activeQuestionIndex].strengths.map((strength, idx) => (
                            <li key={idx} className="flex items-start">
                              <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-green-700">{strength}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-500 italic">No strengths highlighted</li>
                        )}
                      </ul>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-4">
                      <h4 className="font-medium text-orange-700 mb-2">Areas to Improve</h4>
                      <ul className="space-y-2">
                        {session.questionResponses[activeQuestionIndex].areasToImprove.length > 0 ? (
                          session.questionResponses[activeQuestionIndex].areasToImprove.map((area, idx) => (
                            <li key={idx} className="flex items-start">
                              <svg className="w-5 h-5 text-orange-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span className="text-orange-700">{area}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-500 italic">No areas to improve highlighted</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </>
              )}
              
              {/* Navigation buttons */}
              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={activeQuestionIndex === 0}
                  className={`px-4 py-2 rounded-md ${
                    activeQuestionIndex === 0 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setActiveQuestionIndex(prev => Math.min(session.questionResponses.length - 1, prev + 1))}
                  disabled={activeQuestionIndex === session.questionResponses.length - 1}
                  className={`px-4 py-2 rounded-md ${
                    activeQuestionIndex === session.questionResponses.length - 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 