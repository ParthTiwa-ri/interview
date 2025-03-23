"use client";

import { InterviewProvider } from "./context/InterviewContext";
import JobRoleSelection from "./components/JobRoleSelection";
import InterviewQuestions from "./components/InterviewQuestions";
import ResultsSummary from "./components/ResultsSummary";
import HomePage from "./components/HomePage";
import { useInterviewContext } from "./context/InterviewContext";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

// Inner component that uses the context
const InterviewContent = () => {
  const { currentStep } = useInterviewContext();
  const { isSignedIn, isLoaded } = useUser();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Once Clerk has loaded, mark first load as complete
  useEffect(() => {
    if (isLoaded) {
      setIsFirstLoad(false);
    }
  }, [isLoaded]);
  
  // Show a blank screen during the first load to prevent flashing
  if (isFirstLoad) {
    return <div className="min-h-screen"></div>;
  }

  // After first load, check if the user is signed in
  if (!isSignedIn) {
    return <HomePage />;
  }

  return (
    <div className="pt-4">
      {currentStep === "role" && <JobRoleSelection />}
      {currentStep === "questions" && <InterviewQuestions />}
      {currentStep === "summary" && <ResultsSummary />}
    </div>
  );
};

// Main page component that provides the context
export default function MainPage() {
  return (
    <InterviewProvider>
      <InterviewContent />
    </InterviewProvider>
  );
}
