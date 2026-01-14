
export interface InterviewQuestion {
  id: string;
  text: string;
  category: 'behavioral' | 'technical' | 'situational' | 'intro';
}

export interface InterviewAnalysis {
  clarityScore: number;
  sentimentScore: number;
  structuredThinkingScore: number;
  bodyLanguageNotes: string;
  keyStrengths: string[];
  areasOfImprovement: string[];
  transcription?: string;
  overallFeedback: string;
}

export interface InterviewSession {
  resume: string;
  jobDescription: string;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  analyses: Record<string, InterviewAnalysis>;
}

export enum AppState {
  SETUP = 'SETUP',
  PREPARING = 'PREPARING',
  INTERVIEWING = 'INTERVIEWING',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS'
}
