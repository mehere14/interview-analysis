
export interface InterviewQuestion {
  id: string;
  text: string;
  category: 'behavioral' | 'technical' | 'situational' | 'intro';
}

export interface DimensionScore {
  label: string;
  score: number; // 1-5 scale
  feedback: string;
}

export interface InterviewAnalysis {
  dimensions: DimensionScore[];
  bodyLanguageNotes: string;
  keyStrengths: string[];
  areasOfImprovement: string[];
  redFlags: string[];
  overallFeedback: string;
  overallScore: number; // 1-5 scale
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
