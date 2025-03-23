"use client";

import { useState, useEffect } from "react";
import JobRoleSelection from "../components/JobRoleSelection";
import InterviewQuestions from "../components/InterviewQuestions";
import ResultsSummary from "../components/ResultsSummary";
import { 
  generateInterviewQuestions, 
  generateInterviewFeedback, 
  saveInterview, 
  calculateTotalScore 
} from "../components/api/interviewService";
import { InterviewProvider, useInterviewContext } from "../context/InterviewContext";

const InterviewContent = () => {
  const { currentStep } = useInterviewContext();

  // Render the appropriate component based on the current step
  if (currentStep === "role") {
    return <JobRoleSelection />;
  }

  if (currentStep === "questions") {
    return <InterviewQuestions />;
  }

  if (currentStep === "summary") {
    return <ResultsSummary />;
  }

  return <div>Loading...</div>;
};

const MockInterview = () => {
  return (
    <InterviewProvider>
      <InterviewContent />
    </InterviewProvider>
  );
};

export default MockInterview;
