"use client";

import { useState, useEffect } from "react";
import { HfInference } from "@huggingface/inference";
import { saveInterviewFeedback } from "../../actions/action"; // Make sure this path is correct

const MockInterview = () => {
  const [jobRole, setJobRole] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState("role"); // "role", "questions", "summary"
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [savingToDb, setSavingToDb] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState(null);

  // Dummy user ID - in a real app, this would come from authentication
  const dummyUserId = "user-id-123";
  const dummyUserName = "John Doe";

  const startInterview = async () => {
    if (!jobRole.trim()) {
      setError("Please enter a job role");
      return;
    }

    setLoading(true);
    setError(null);
    // and one of them must be leetcode question problem statement to solve with example test case as string
    try {
      const client = new HfInference(process.env.NEXT_PUBLIC_HF_TOKEN);

      const chatCompletion = await client.chatCompletion({
        model: "mistralai/Mistral-7B-Instruct-v0.2",
        messages: [
          {
            role: "user",
            content: `Generate 2 mock interview questions for a ${jobRole} position. 
            
            
      Format your response EXACTLY as a JSON array with each object having 'id' and 'question' fields like this example:
      [
        {
          "id": 1,
          "question": "Can you describe your experience with object-oriented programming and design principles? How have you applied these concepts in your past projects?"
        },
        {
          "id": 2,
          "question": "Tell me about a time when you had to troubleshoot and resolve a complex coding issue. What steps did you take to diagnose the problem and what was the outcome?"
        }
      ]
      
      Return ONLY the JSON array with no additional text, explanation, or formatting.`,
          },
        ],
        provider: "hf-inference",
        max_tokens: 500,
      });

      // Extract the response content
      const responseContent = chatCompletion.choices[0].message.content;
      console.log("Response from AI:", responseContent);

      try {
        // Look for JSON in the response
        const jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/) ||
          responseContent.match(/```\s*([\s\S]*?)\s*```/) || [
            null,
            responseContent,
          ];

        const jsonString = jsonMatch[1]
          ? jsonMatch[1].trim()
          : responseContent.trim();
        const parsedQuestions = JSON.parse(jsonString);

        // Handle both array and object with questions property
        const questionsArray = Array.isArray(parsedQuestions)
          ? parsedQuestions
          : parsedQuestions.questions || [];

        // Ensure each question has an id
        const formattedQuestions = questionsArray.map((q, index) => ({
          ...q,
          id: q.id || `q${index + 1}`,
        }));

        setQuestions(formattedQuestions);

        // Initialize answers object
        const initialAnswers = {};
        formattedQuestions.forEach((q) => {
          initialAnswers[q.id] = "";
        });
        setAnswers(initialAnswers);

        // Move to question mode
        setCurrentStep("questions");
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        setError(
          "Failed to parse response from AI. Please refresh and try again."
        );
      }
    } catch (err) {
      console.error("API Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, ready for submission
      setInterviewComplete(true);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const scoreAllAnswers = async () => {
    // Validate that all questions have answers
    const unansweredQuestions = questions.filter((q) => !answers[q.id]?.trim());
    if (unansweredQuestions.length > 0) {
      setError(
        `Please answer all questions before submitting. You have ${
          unansweredQuestions.length
        } unanswered ${
          unansweredQuestions.length === 1 ? "question" : "questions"
        }.`
      );
      return;
    }

    setScoringLoading(true);
    setError(null);

    try {
      const client = new HfInference(process.env.NEXT_PUBLIC_HF_TOKEN);

      // Create a batch prompt for all questions and answers
      const batchPrompt = `
I need feedback on the following job interview for a ${jobRole} position:

${questions
  .map(
    (q, index) => `
Question ${index + 1}: "${q.question}"
Candidate Answer: "${answers[q.id]}"
`
  )
  .join("\n")}

For each question, rate the answer from 1-10 based on:
- Relevance to the question
- Technical accuracy
- Communication clarity
- Depth of knowledge

Return a JSON object with the following structure:
{
  "questionFeedback": [
    {
      "id": "${questions[0]?.id || "q1"}",
      "score": 7,
      "feedback": "Detailed feedback here",
      "strengths": ["Strength 1", "Strength 2"],
      "areas_to_improve": ["Area 1", "Area 2"]
    },
    {
      "id": "${questions[1]?.id || "q2"}",
      "score": 8,
      "feedback": "Detailed feedback here",
      "strengths": ["Strength 1", "Strength 2"],
      "areas_to_improve": ["Area 1", "Area 2"]
    }
  ],
  "overall": {
    "averageScore": 7.5,
    "generalFeedback": "Overall assessment of the candidate",
    "keyStrengths": ["Key strength 1", "Key strength 2"],
    "developmentAreas": ["Development area 1", "Development area 2"]
  }
}

Only return the JSON object, no other text.
      `;

      const feedbackCompletion = await client.chatCompletion({
        model: "mistralai/Mistral-7B-Instruct-v0.2",
        messages: [
          {
            role: "user",
            content: batchPrompt,
          },
        ],
        provider: "hf-inference",
        max_tokens: 1000,
      });

      const responseContent = feedbackCompletion.choices[0].message.content;
      console.log("Feedback response:", responseContent);

      try {
        // Extract JSON from the response
        const jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/) ||
          responseContent.match(/```\s*([\s\S]*?)\s*```/) || [
            null,
            responseContent,
          ];

        const jsonString = jsonMatch[1]
          ? jsonMatch[1].trim()
          : responseContent.trim();
        const feedbackData = JSON.parse(jsonString);

        // Process individual question feedback
        const formattedScores = {};
        feedbackData.questionFeedback.forEach((qf) => {
          formattedScores[qf.id] = {
            score: qf.score,
            feedback: qf.feedback,
            strengths: qf.strengths || [],
            areas_to_improve: qf.areas_to_improve || [],
          };
        });

        setScores(formattedScores);

        // Save overall feedback in a special key
        if (feedbackData.overall) {
          setScores((prev) => ({
            ...prev,
            overall: feedbackData.overall,
          }));
        }

        // Save to database
        await saveInterviewToDatabase(formattedScores);

        // Move to summary view
        setCurrentStep("summary");
      } catch (parseError) {
        console.error("Failed to parse feedback JSON:", parseError);
        setError("Failed to parse AI response. Please try again.");
      }
    } catch (err) {
      console.error("Feedback generation error:", err);
      setError("Failed to generate feedback. Please try again.");
    } finally {
      setScoringLoading(false);
    }
  };

  const saveInterviewToDatabase = async (finalScores) => {
    setSavingToDb(true);

    try {
      // Using the server action instead of fetch to API
      const data = await saveInterviewFeedback({
        userId: dummyUserId,
        jobRole,
        questions,
        answers,
        scores: finalScores,
      });

      if (data.success) {
        setSavedSessionId(data.sessionId);
        console.log("Interview saved to database:", data.sessionId);
      } else {
        console.error("Failed to save to database:", data.error);
        setError("Failed to save your interview results: " + data.error);
      }
    } catch (err) {
      console.error("Error saving to database:", err);
      setError("Error saving your interview results: " + err.message);
    } finally {
      setSavingToDb(false);
    }
  };

  const resetInterview = () => {
    setJobRole("");
    setQuestions([]);
    setAnswers({});
    setScores({});
    setCurrentStep("role");
    setCurrentQuestionIndex(0);
    setInterviewComplete(false);
    setError(null);
    setSavedSessionId(null);
  };

  const calculateTotalScore = () => {
    if (!scores.overall?.averageScore) {
      // Calculate manually if overall score isn't provided
      if (questions.length === 0) return 0;

      let total = 0;
      let count = 0;

      questions.forEach((q) => {
        if (scores[q.id] && typeof scores[q.id].score === "number") {
          total += scores[q.id].score;
          count++;
        }
      });

      return count > 0 ? Math.round((total / count) * 10) / 10 : 0;
    }

    return scores.overall.averageScore;
  };

  // Render job role selection
  if (currentStep === "role") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Mock Interview Preparation</h2>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2">Logged in as:</div>
            <div className="font-medium">{dummyUserName}</div>
          </div>

          <label
            htmlFor="job-role"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Enter the job role you're interviewing for:
          </label>
          <input
            id="job-role"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            placeholder="e.g., Software Engineer, Data Scientist, Product Manager"
          />

          {error && <div className="text-red-500 mb-4">{error}</div>}

          <button
            onClick={startInterview}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating Questions..." : "Start Interview"}
          </button>
        </div>
      </div>
    );
  }

  // Render questions input form
  if (currentStep === "questions") {
    const currentQuestion = questions[currentQuestionIndex];

    if (!currentQuestion) {
      return <div className="text-red-500 p-4">Error: Question not found</div>;
    }

    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">{jobRole} Mock Interview</h2>
        <div className="mb-4 text-gray-600">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-6">
            {currentQuestion.question}
          </h3>

          <div>
            <label
              htmlFor={`answer-${currentQuestion.id}`}
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Answer:
            </label>
            <textarea
              id={`answer-${currentQuestion.id}`}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={answers[currentQuestion.id]}
              onChange={(e) =>
                handleAnswerChange(currentQuestion.id, e.target.value)
              }
              placeholder="Type your answer here..."
            />

            {error && <div className="text-red-500 mt-2">{error}</div>}

            <div className="flex justify-between mt-4">
              <button
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={nextQuestion}
                  disabled={!answers[currentQuestion.id]?.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  disabled={!answers[currentQuestion.id]?.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Review Answers
                </button>
              )}
            </div>
          </div>
        </div>

        {interviewComplete && (
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Review Your Answers</h3>

            <div className="space-y-4 mb-6">
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className="p-4 border border-gray-200 rounded-md"
                >
                  <div className="font-medium">
                    Question {index + 1}: {q.question}
                  </div>
                  <div className="mt-2 p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-500 mb-1">
                      Your Answer:
                    </div>
                    <p className="whitespace-pre-wrap">{answers[q.id]}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={scoreAllAnswers}
              disabled={scoringLoading || savingToDb}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scoringLoading
                ? "Generating Feedback..."
                : savingToDb
                ? "Saving Results..."
                : "Submit All Answers For Feedback"}
            </button>

            {error && <div className="text-red-500 mt-2">{error}</div>}
          </div>
        )}
      </div>
    );
  }

  // Render summary after all questions
  if (currentStep === "summary") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-2">{jobRole} Interview Results</h2>

        <div className="mb-8 p-4 bg-white shadow rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Overall Performance</h3>
            <div className="text-2xl font-bold text-blue-600">
              {calculateTotalScore()}/10
            </div>
          </div>

          {scores.overall && (
            <div className="mb-6">
              <div className="font-medium mb-2">Overall Feedback:</div>
              <p className="text-gray-700 mb-3">
                {scores.overall.generalFeedback}
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="font-medium mb-1 text-green-700">
                    Key Strengths:
                  </div>
                  <ul className="list-disc pl-5">
                    {scores.overall.keyStrengths?.map((strength, idx) => (
                      <li key={idx} className="text-green-700">
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="font-medium mb-1 text-orange-700">
                    Development Areas:
                  </div>
                  <ul className="list-disc pl-5">
                    {scores.overall.developmentAreas?.map((area, idx) => (
                      <li key={idx} className="text-orange-700">
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {savedSessionId && (
            <div className="mb-4 text-green-600">
              <span className="font-medium">✓ Results saved</span>
              <span className="text-sm text-gray-500 ml-1">
                (Session ID: {savedSessionId.substring(0, 8)}...)
              </span>
            </div>
          )}

          <button
            onClick={resetInterview}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Start New Interview
          </button>
        </div>

        <div className="space-y-8">
          {questions.map((item, index) => (
            <div key={item.id} className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">
                Question {index + 1}: {item.question}
              </h3>

              <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                <div className="font-medium mb-1">Your Answer:</div>
                <p className="whitespace-pre-wrap">{answers[item.id]}</p>
              </div>

              {scores[item.id] && (
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="flex items-center mb-3">
                    <div className="text-lg font-semibold mr-2">Score:</div>
                    <div
                      className={`font-bold text-xl ${
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

                  <div className="mb-3">
                    <div className="font-semibold mb-1">Feedback:</div>
                    <p className="text-gray-700">{scores[item.id].feedback}</p>
                  </div>

                  <div className="mb-3">
                    <div className="font-semibold mb-1">Strengths:</div>
                    <ul className="list-disc pl-5">
                      {scores[item.id].strengths.map((strength, idx) => (
                        <li key={idx} className="text-green-700">
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="font-semibold mb-1">Areas to Improve:</div>
                    <ul className="list-disc pl-5">
                      {scores[item.id].areas_to_improve.map((area, idx) => (
                        <li key={idx} className="text-orange-700">
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
};

export default MockInterview;
