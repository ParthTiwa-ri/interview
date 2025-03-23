"use client";

import { HfInference } from "@huggingface/inference";
import { saveInterviewFeedback } from "../../../actions/action";

// Service for generating interview questions
export const generateInterviewQuestions = async (jobRole, experienceLevel = "Mid-Level", industry = "Technology", company = "") => {
  try {
    const client = new HfInference(process.env.NEXT_PUBLIC_HF_TOKEN);

    // Create the prompt with specific company info if provided
    let companySpecificContent = "";
    if (company) {
      companySpecificContent = `The candidate is interviewing at ${company}. Include questions that reflect ${company}'s known interview style and company values.`;
    }

    const chatCompletion = await client.chatCompletion({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      messages: [
        {
          role: "user",
          content: `Generate 1 realistic mock interview questions for a ${experienceLevel} ${jobRole} position in the ${industry} industry.

The questions should match the real-world expectations for a ${experienceLevel} candidate in this role and industry.
${companySpecificContent}

Include a mix of:
- Technical questions specific to the ${jobRole} role
- Behavioral questions relevant to ${experienceLevel} professionals
- Problem-solving scenarios a ${jobRole} would face in their daily work in the ${industry} industry
- Industry-specific knowledge questions relevant to ${industry}
          
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
      max_tokens: 800,
    });

    // Extract the response content
    const responseContent = chatCompletion.choices[0].message.content;
    console.log("Response from AI:", responseContent);

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

    return { success: true, questions: formattedQuestions };
  } catch (err) {
    console.error("API Error:", err);
    return { success: false, error: err.message };
  }
};

// Service for generating interview feedback
export const generateInterviewFeedback = async (
  jobRole, 
  questions, 
  answers, 
  experienceLevel = "Mid-Level", 
  industry = "Technology", 
  company = ""
) => {
  try {
    const client = new HfInference(process.env.NEXT_PUBLIC_HF_TOKEN);

    // Add company-specific context if provided
    let companyContext = "";
    if (company) {
      companyContext = `The candidate is interviewing at ${company}. Evaluate their answers based on what would be expected at this company.`;
    }

    // Create a batch prompt for all questions and answers
    const batchPrompt = `
I need feedback on the following job interview for a ${experienceLevel} ${jobRole} position in the ${industry} industry.
${companyContext}

${questions
  .map(
    (q, index) => `
Question ${index + 1}: "${q.question}"
Candidate Answer: "${answers[q.id]}"
`
  )
  .join("\n")}

For each question, rate the answer from 1-10 based on expectations for a ${experienceLevel} candidate in the ${industry} industry, considering:
- Relevance to the question
- Technical accuracy
- Communication clarity
- Depth of knowledge appropriate for a ${experienceLevel} ${jobRole}
- Industry-specific awareness and knowledge

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
    "developmentAreas": ["Development area 1", "Development area 2"],
    "hiringRecommendation": "Would recommend hiring for a ${experienceLevel} ${jobRole} position at ${company || 'a company'} in the ${industry} industry"
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

    // Add overall feedback
    if (feedbackData.overall) {
      formattedScores.overall = feedbackData.overall;
    }

    return { success: true, scores: formattedScores };
  } catch (err) {
    console.error("Feedback generation error:", err);
    return { success: false, error: err.message };
  }
};

// Service for saving interview to database
export const saveInterview = async (userId, jobRole, questions, answers, scores, industry = "Technology", company = "") => {
  try {
    const data = await saveInterviewFeedback({
      userId,
      jobRole,
      questions,
      answers,
      scores,
      industry,
      company
    });

    if (data.success) {
      return { success: true, sessionId: data.sessionId };
    } else {
      console.error("Failed to save to database:", data.error);
      return { success: false, error: data.error };
    }
  } catch (err) {
    console.error("Error saving to database:", err);
    return { success: false, error: err.message };
  }
};

// Helper function to calculate total score
export const calculateTotalScore = (questions, scores) => {
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