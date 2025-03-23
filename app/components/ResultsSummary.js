"use client";

import { useInterviewContext } from "../context/InterviewContext";

const ResultsSummary = () => {
  const {
    jobRole,
    questions,
    answers,
    scores,
    savedSessionId,
    resetInterview,
    getTotalScore
  } = useInterviewContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{jobRole} Interview Results</h2>
              <p className="text-gray-600 mt-1">Your performance analysis</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">{getTotalScore()}/10</div>
              <div className="text-sm text-gray-500">Overall Score</div>
            </div>
          </div>

          {scores.overall && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Overall Feedback</h3>
                <p className="text-gray-700 leading-relaxed">
                  {scores.overall.generalFeedback}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-green-700 mb-3">Key Strengths</h4>
                  <ul className="space-y-2">
                    {scores.overall.keyStrengths?.map((strength, idx) => (
                      <li key={idx} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-orange-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-orange-700 mb-3">Development Areas</h4>
                  <ul className="space-y-2">
                    {scores.overall.developmentAreas?.map((area, idx) => (
                      <li key={idx} className="flex items-start">
                        <svg className="w-5 h-5 text-orange-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-orange-700">{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {savedSessionId && (
            <div className="mt-8 p-4 bg-green-50 rounded-xl flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="text-green-700 font-medium">Results saved successfully</div>
                <div className="text-sm text-green-600">Session ID: {savedSessionId.substring(0, 8)}...</div>
              </div>
            </div>
          )}

          <button
            onClick={resetInterview}
            className="mt-8 w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            Start New Interview
          </button>
        </div>

        <div className="space-y-6">
          {questions.map((item, index) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">{index + 1}</span>
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {item.question}
                  </h3>

                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="text-sm font-medium text-gray-700 mb-2">Your Answer:</div>
                    <p className="text-gray-900 whitespace-pre-wrap">{answers[item.id]}</p>
                  </div>

                  {scores[item.id] && (
                    <div className="space-y-6">
                      <div className="flex items-center">
                        <div className="text-lg font-semibold mr-2">Score:</div>
                        <div
                          className={`text-2xl font-bold ${
                            scores[item.id].score >= 8
                              ? "text-green-600"
                              : scores[item.id].score >= 6
                              ? "text-blue-600"
                              : scores[item.id].score >= 4
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {scores[item.id].score}/10
                        </div>
                      </div>

                      <div>
                        <div className="font-medium text-gray-900 mb-2">Feedback:</div>
                        <p className="text-gray-700">{scores[item.id].feedback}</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-green-50 rounded-xl p-4">
                          <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                          <ul className="space-y-2">
                            {scores[item.id].strengths.map((strength, idx) => (
                              <li key={idx} className="flex items-start">
                                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-green-700">{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-orange-50 rounded-xl p-4">
                          <h4 className="font-medium text-orange-700 mb-2">Areas to Improve</h4>
                          <ul className="space-y-2">
                            {scores[item.id].areas_to_improve.map((area, idx) => (
                              <li key={idx} className="flex items-start">
                                <svg className="w-5 h-5 text-orange-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="text-orange-700">{area}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsSummary; 