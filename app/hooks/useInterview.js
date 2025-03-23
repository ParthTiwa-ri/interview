"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { 
  generateInterviewQuestions, 
  generateInterviewFeedback, 
  saveInterview, 
  calculateTotalScore 
} from "../components/api/interviewService";
import { createUserFromClerk } from "../../actions/action";

export const useInterview = () => {
  const [jobRole, setJobRole] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState("role");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [savingToDb, setSavingToDb] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState(null);
  const [dbUserId, setDbUserId] = useState(null);

  // Get user from Clerk
  const { user, isLoaded, isSignedIn } = useUser();

  // Create or get database user when clerk user loads
  useEffect(() => {
    const syncUser = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          const result = await createUserFromClerk({
            id: user.id,
            name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            email: user.primaryEmailAddress?.emailAddress,
          });
          
          if (result.success) {
            setDbUserId(result.userId);
          } else {
            console.error("Failed to sync user with database:", result.error);
          }
        } catch (err) {
          console.error("Error syncing user:", err);
        }
      }
    };
    
    syncUser();
  }, [isLoaded, isSignedIn, user]);

  const startInterview = async () => {
    if (!jobRole.trim()) {
      setError("Please enter a job role");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateInterviewQuestions(jobRole);
      
      if (result.success) {
        setQuestions(result.questions);
        
        // Initialize answers object
        const initialAnswers = {};
        result.questions.forEach((q) => {
          initialAnswers[q.id] = "";
        });
        setAnswers(initialAnswers);
        
        // Move to question mode
        setCurrentStep("questions");
      } else {
        setError(result.error || "Failed to generate questions. Please try again.");
      }
    } catch (err) {
      console.error("Error in startInterview:", err);
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
      // Generate feedback
      const feedbackResult = await generateInterviewFeedback(jobRole, questions, answers);
      
      if (feedbackResult.success) {
        setScores(feedbackResult.scores);
        
        // Save to database
        await saveInterviewToDatabase(feedbackResult.scores);
        
        // Move to summary view
        setCurrentStep("summary");
      } else {
        setError(feedbackResult.error || "Failed to generate feedback. Please try again.");
      }
    } catch (err) {
      console.error("Error in scoreAllAnswers:", err);
      setError("Failed to generate feedback. Please try again.");
    } finally {
      setScoringLoading(false);
    }
  };

  const saveInterviewToDatabase = async (finalScores) => {
    setSavingToDb(true);

    try {
      if (!dbUserId && isSignedIn) {
        // If dbUserId is not set yet but user is signed in, try to sync again
        const result = await createUserFromClerk({
          id: user.id,
          name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.primaryEmailAddress?.emailAddress,
        });
        
        if (result.success) {
          setDbUserId(result.userId);
        } else {
          throw new Error("Failed to get user ID from database");
        }
      }
      
      // Use the database user ID for saving
      const userId = dbUserId || "anonymous";

      const result = await saveInterview(
        userId,
        jobRole,
        questions,
        answers,
        finalScores
      );

      if (result.success) {
        setSavedSessionId(result.sessionId);
        console.log("Interview saved to database:", result.sessionId);
      } else {
        console.error("Failed to save to database:", result.error);
        setError("Failed to save your interview results: " + result.error);
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

  const getTotalScore = () => {
    return calculateTotalScore(questions, scores);
  };

  return {
    // State
    jobRole,
    questions,
    answers,
    scores,
    loading,
    scoringLoading,
    error,
    currentStep,
    currentQuestionIndex,
    interviewComplete,
    savingToDb,
    savedSessionId,
    user,
    isLoaded,
    isSignedIn,

    // Actions
    setJobRole,
    startInterview,
    handleAnswerChange,
    nextQuestion,
    previousQuestion,
    scoreAllAnswers,
    resetInterview,
    getTotalScore
  };
}; 