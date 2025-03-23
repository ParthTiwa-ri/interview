"use client";

import { createContext, useContext } from "react";
import { useInterview } from "../hooks/useInterview";

const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {
  const interviewState = useInterview();

  return (
    <InterviewContext.Provider value={interviewState}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterviewContext = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error("useInterviewContext must be used within an InterviewProvider");
  }
  return context;
}; 