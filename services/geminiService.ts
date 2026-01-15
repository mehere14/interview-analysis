
import { GoogleGenAI, Type } from "@google/genai";
import { InterviewQuestion, InterviewAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateQuestions = async (resume: string, jobDescription: string): Promise<InterviewQuestion[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on this resume and job description, generate 4 highly relevant interview questions. 
    Mix of behavioral and technical questions suitable for the role.
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
              description: "behavioral or technical"
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
  question: InterviewQuestion,
  frames: string[]
): Promise<InterviewAnalysis> => {
  const isTechnical = question.category === 'technical';
  
  const behavioralInstructions = `
    Assess using 1-5 scales:
    1. Structural Criteria (STAR+R Method): Did they provide Situation, Task, Action, Result (quantified), and Reflection?
    2. Content & Competency Alignment: Relevance to job, problem-solving, communication quality.
    3. Behavioral & Engagement Cues: Listening, confidence, energy, self-awareness.
    Check for Red Flags: Vague "Story-Only" answers (no metrics), Blame-Shifting, Inconsistency with resume, Defensiveness.
  `;

  const technicalInstructions = `
    Assess using 1-5 scales:
    1. Meta-Reasoning & "Thinking Out Loud": Clarification questions, externalizing thought process, self-correction.
    2. Implementation Quality: Readability, abstractions (DRY), Big O optimization.
    3. Trade-off Fluency & System Awareness: Resource management, alternative solutions, failure modes.
    4. Testing & Edge Case Awareness: Adversarial thinking, validation for nulls/boundaries, systematic debugging.
    5. Technical Communication & Collaboration: Explaining complex concepts simply, feedback integration, AI literacy (if applicable).
  `;

  const parts = [
    { text: `Analyze this interview response. 
      Question Type: ${question.category.toUpperCase()}
      Question asked: "${question.text}"
      
      Evaluation Standards:
      ${isTechnical ? technicalInstructions : behavioralInstructions}
      
      Instructions:
      - Provide a score (1-5) and specific feedback for each dimension listed above.
      - Extract any Red Flags.
      - Analyze body language from the provided frames.` },
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
          dimensions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                score: { type: Type.NUMBER, description: "1 to 5 score" },
                feedback: { type: Type.STRING }
              },
              required: ["label", "score", "feedback"]
            }
          },
          bodyLanguageNotes: { type: Type.STRING },
          keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          areasOfImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
          redFlags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific warnings based on the red flag criteria provided" },
          overallFeedback: { type: Type.STRING },
          overallScore: { type: Type.NUMBER, description: "1 to 5 overall score" }
        },
        required: ["dimensions", "bodyLanguageNotes", "keyStrengths", "areasOfImprovement", "redFlags", "overallFeedback", "overallScore"]
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
