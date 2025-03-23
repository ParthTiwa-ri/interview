
"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Initialize Prisma outside the action to avoid multiple instances
const prisma = new PrismaClient();

export async function saveInterviewFeedback(data) {
  try {
    const { jobRole, questions, answers, scores, userId } = data;

    // Calculate total score
    let totalScoreSum = 0;
    let scoredQuestionsCount = 0;

    questions.forEach((q) => {
      if (scores[q.id] && typeof scores[q.id].score === "number") {
        totalScoreSum += scores[q.id].score;
        scoredQuestionsCount++;
      }
    });

    const totalScore =
      scoredQuestionsCount > 0
        ? Math.round((totalScoreSum / scoredQuestionsCount) * 10) / 10
        : 0;

    // Create interview session
    const session = await prisma.interviewSession.create({
      data: {
        jobRole,
        totalScore,
        userId,
        questionResponses: {
          create: questions.map((question) => ({
            questionId: String(question.id), // Convert to string
            question: question.question,
            answer: answers[question.id] || "",
            score: scores[question.id]?.score || null,
            feedback: scores[question.id]?.feedback || null,
            strengths: scores[question.id]?.strengths || [],
            areasToImprove: scores[question.id]?.areas_to_improve || [],
          })),
        },
      },
      include: {
        questionResponses: true,
      },
    });

    try {
      // Revalidate related path(s) to update UI
      revalidatePath("/interviews");
      revalidatePath(`/interviews/${session.id}`);
    } catch (revalidateError) {
      // If revalidation fails, log it but don't fail the whole operation
      console.error("Error revalidating paths:", revalidateError);
    }

    return {
      success: true,
      sessionId: session.id,
      message: "Interview feedback saved successfully",
    };
  } catch (error) {
    console.error("Error saving interview feedback:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
