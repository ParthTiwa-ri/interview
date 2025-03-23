"use client";

import { InterviewProvider } from "./context/InterviewContext";
import JobRoleSelection from "./components/JobRoleSelection";
import InterviewQuestions from "./components/InterviewQuestions";
import ResultsSummary from "./components/ResultsSummary";
import { useInterviewContext } from "./context/InterviewContext";

// Inner component that uses the context
const InterviewContent = () => {
  const { currentStep } = useInterviewContext();

  return (
    <div className="pt-4">
      {currentStep === "role" && <JobRoleSelection />}
      {currentStep === "questions" && <InterviewQuestions />}
      {currentStep === "summary" && <ResultsSummary />}
    </div>
  );
};

// Main page component that provides the context
export default function HomePage() {
  return (
    <InterviewProvider>
      <InterviewContent />
    </InterviewProvider>
  );
}
