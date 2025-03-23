"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Initialize Prisma outside the action to avoid multiple instances
const prisma = new PrismaClient();

export async function saveInterviewFeedback(data) {
  try {
    const { jobRole, questions, answers, scores, userId, industry = "Technology", company = "" } = data;

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
        industry,
        company,
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

export async function createUserFromClerk(clerkData) {
  try {
    // Check if user already exists based on Clerk ID
    let user = await prisma.user.findUnique({
      where: {
        clerkId: clerkData.id,
      },
    });
    
    // If user doesn't exist, create a new one
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: clerkData.name,
          email: clerkData.email,
          clerkId: clerkData.id
        },
      });
      
      console.log("New user created:", user.id);
    } else {
      console.log("Existing user found:", user.id);
    }
    
    return {
      success: true,
      userId: user.id,
      message: "User created/retrieved successfully",
    };
  } catch (error) {
    console.error("Error processing user data:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getUserInterviewSessions(userId) {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required"
      };
    }

    const sessions = await prisma.interviewSession.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: { questionResponses: true }
        }
      }
    });

    return {
      success: true,
      sessions: sessions.map(session => ({
        id: session.id,
        jobRole: session.jobRole,
        totalScore: session.totalScore,
        createdAt: session.createdAt,
        questionCount: session._count.questionResponses
      }))
    };
  } catch (error) {
    console.error("Error fetching interview sessions:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getInterviewSessionDetails(sessionId) {
  try {
    if (!sessionId) {
      return {
        success: false,
        error: "Session ID is required"
      };
    }

    const session = await prisma.interviewSession.findUnique({
      where: {
        id: sessionId
      },
      include: {
        questionResponses: true,
        user: {
          select: {
            name: true
          }
        }
      }
    });

    if (!session) {
      return {
        success: false,
        error: "Interview session not found"
      };
    }

    return {
      success: true,
      session: {
        id: session.id,
        jobRole: session.jobRole,
        totalScore: session.totalScore,
        createdAt: session.createdAt,
        userName: session.user.name,
        questionResponses: session.questionResponses.map(qr => ({
          id: qr.id,
          questionId: qr.questionId,
          question: qr.question,
          answer: qr.answer,
          score: qr.score,
          feedback: qr.feedback,
          strengths: qr.strengths,
          areasToImprove: qr.areasToImprove
        }))
      }
    };
  } catch (error) {
    console.error("Error fetching interview session details:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function deleteInterviewSession(sessionId) {
  try {
    if (!sessionId) {
      return {
        success: false,
        error: "Session ID is required"
      };
    }

    // Delete the session and its related responses (cascading delete should handle this if set up in schema)
    await prisma.interviewSession.delete({
      where: {
        id: sessionId
      }
    });

    // Revalidate the interviews page to show updated list
    revalidatePath("/interviews");

    return {
      success: true,
      message: "Interview session deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting interview session:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
