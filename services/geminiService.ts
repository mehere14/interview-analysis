
import { GoogleGenAI, Type } from "@google/genai";
import { InterviewQuestion, InterviewAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateQuestions = async (resume: string, jobDescription: string): Promise<InterviewQuestion[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on this resume and job description, generate 4 highly relevant interview questions. 
    Resume: ${resume}
    Job Description: ${jobDescription}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            text: { type: Type.STRING },
            category: { 
              type: Type.STRING,
              description: "behavioral, technical, situational, or intro"
            }
          },
          required: ["id", "text", "category"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Failed to parse questions", error);
    return [];
  }
};

export const analyzeInterviewResponse = async (
  question: string,
  frames: string[], // Base64 strings
  audioBase64?: string
): Promise<InterviewAnalysis> => {
  // We send the question and a sequence of frames to analyze performance
  const parts = [
    { text: `Analyze this interview response. 
      Question asked: "${question}"
      
      Instructions:
      1. Analyze the speaker's body language from the video frames (eye contact, posture, confidence).
      2. Analyze the structured thinking (e.g., did they use STAR method?).
      3. Evaluate clarity and sentiment.
      4. Provide constructive feedback.` },
    ...frames.map(f => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: f.split(',')[1] || f
      }
    }))
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          clarityScore: { type: Type.NUMBER, description: "0 to 100 score" },
          sentimentScore: { type: Type.NUMBER, description: "0 to 100 score (positive sentiment)" },
          structuredThinkingScore: { type: Type.NUMBER, description: "0 to 100 score" },
          bodyLanguageNotes: { type: Type.STRING },
          keyStrengths: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          areasOfImprovement: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          overallFeedback: { type: Type.STRING }
        },
        required: ["clarityScore", "sentimentScore", "structuredThinkingScore", "bodyLanguageNotes", "keyStrengths", "areasOfImprovement", "overallFeedback"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Failed to parse analysis", error);
    throw new Error("Analysis failed");
  }
};
