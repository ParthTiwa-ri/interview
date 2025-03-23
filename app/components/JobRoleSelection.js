"use client";

import { useInterviewContext } from "../context/InterviewContext";
import { useUser } from "@clerk/nextjs";
const JobRoleSelection = () => {
  const { 
    jobRole, 
    setJobRole, 
    startInterview, 
    loading, 
    error, 
    dummyUserName 
  } = useInterviewContext();

  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Mock Interview Preparation</h2>
              <p className="text-gray-600 mt-1">Start your interview journey</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {user?.firstName?.charAt(0)}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Logged in as</div>
                <div className="font-medium text-gray-900">{user?.firstName}</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="job-role"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                What role are you interviewing for?
              </label>
              <input
                id="job-role"
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g., Software Engineer, Data Scientist, Product Manager"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl">
                {error}
              </div>
            )}

            <button
              onClick={startInterview}
              disabled={loading}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Questions...
                </div>
              ) : (
                "Start Interview"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobRoleSelection; 